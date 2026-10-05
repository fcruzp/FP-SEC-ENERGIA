/**
 * Escritura de una edición del Informe de Desempeño en la base de datos.
 * La usan scripts/mem-load.ts y el panel /admin, para que ambos carguen igual.
 *
 * - Todo ocurre en una transacción: o se carga completo o no se carga.
 * - Solo se escriben los valores nuevos o cambiados; un valor que no cambia conserva
 *   la edición en la que se publicó por primera vez (su procedencia).
 * - Cada valor cambiado queda registrado en data_point_revisions.
 */
import type { Client } from 'pg'
import type { CatalogEntry } from './catalog'
import type { CheckResult } from './reconcile'
import { MONTHS } from './pipeline'

export interface EditionMeta {
  edition: string // 'YYYY-MM-01'
  sourceFile: string
  sourceUrl: string | null
  pdfUrl: string | null
  sha256: string
  fileSize: number
  /** Fecha en que el MEM publicó la edición ('YYYY-MM-DD'), si se conoce */
  publishedAt?: string | null
}

export interface Point { slug: string; date: string; value: number; cell: string }

export interface LoadStats {
  indicators: number
  values: number
  latest_month: string
  inserted: number
  revisions: number
  unchanged: number
  removed_indicators: number
}

type Queryable = Pick<Client, 'query'>

export async function writeEdition(db: Queryable, catalog: CatalogEntry[], points: Point[], checks: CheckResult[], meta: EditionMeta): Promise<LoadStats> {
  const startedAt = new Date()
  const { edition } = meta
  await db.query('BEGIN')
  try {
    const newer = await db.query(
      `SELECT edition FROM reports WHERE source_org = 'MEM' AND report_type = 'desempeno_mensual' AND edition > $1 LIMIT 1`, [edition])
    if (newer.rowCount) throw new Error(`Ya hay cargada una edición más reciente (${newer.rows[0].edition.toISOString().slice(0, 10)}).`)

    const report = await db.query(
      `INSERT INTO reports (title, slug, file_url, file_type, file_size, publish_date, source_org, report_type, is_published, edition, source_url, pdf_url, sha256)
       VALUES ($1, $2, $3, 'xlsx', $4, $8::date, 'MEM', 'desempeno_mensual', true, $5, $3, $6, $7)
       ON CONFLICT (source_org, report_type, edition) DO UPDATE SET
         file_url = EXCLUDED.file_url, source_url = EXCLUDED.source_url, pdf_url = COALESCE(EXCLUDED.pdf_url, reports.pdf_url),
         sha256 = EXCLUDED.sha256, file_size = EXCLUDED.file_size, title = EXCLUDED.title,
         publish_date = COALESCE(EXCLUDED.publish_date, reports.publish_date)
       RETURNING id`,
      [`Informe de Desempeño EEE — ${MONTHS[Number(edition.slice(5, 7)) - 1]} ${edition.slice(0, 4)}`,
        `mem-desempeno-${edition.slice(0, 7)}`, meta.sourceUrl ?? meta.sourceFile, meta.fileSize, edition, meta.pdfUrl, meta.sha256,
        meta.publishedAt ?? null])
    const reportId: string = report.rows[0].id

    // Catálogo: categorías y entidades deben existir
    const cats = new Set((await db.query('SELECT slug FROM indicator_categories')).rows.map(r => r.slug))
    const ents = new Set((await db.query('SELECT slug FROM entities')).rows.map(r => r.slug))
    for (const e of catalog) {
      if (!cats.has(e.category)) throw new Error(`Categoría inexistente: ${e.category}`)
      if (e.entity && !ents.has(e.entity)) throw new Error(`Entidad inexistente: ${e.entity}`)
    }

    // Indicadores en bloque: primero los principales, luego los desgloses (referencian al padre por slug)
    const ids = new Map<string, string>()
    for (const group of [catalog.filter(c => !c.parent), catalog.filter(c => c.parent)]) {
      if (!group.length) continue
      const res = await db.query(
        `INSERT INTO indicators (category_id, entity_id, name, slug, unit, source, frequency, chart_type, is_breakdown,
                                 parent_indicator_id, sort_order, is_active, source_sheet, source_label, notes)
         SELECT c.id, e.id, x.name, x.slug, x.unit, 'MEM', 'monthly', x.chart, x.parent IS NOT NULL,
                p.id, x.ord, true, x.sheet, x.label, x.note
           FROM unnest($1::text[], $2::text[], $3::text[], $4::text[], $5::text[], $6::text[], $7::text[],
                       $8::int[], $9::text[], $10::text[], $11::text[])
                AS x(category, entity, name, slug, unit, chart, parent, ord, sheet, label, note)
           JOIN indicator_categories c ON c.slug = x.category
           LEFT JOIN entities e ON e.slug = x.entity
           LEFT JOIN indicators p ON p.slug = x.parent
         ON CONFLICT (slug) DO UPDATE SET
           category_id = EXCLUDED.category_id, entity_id = EXCLUDED.entity_id, name = EXCLUDED.name, unit = EXCLUDED.unit,
           chart_type = EXCLUDED.chart_type, is_breakdown = EXCLUDED.is_breakdown, parent_indicator_id = EXCLUDED.parent_indicator_id,
           sort_order = EXCLUDED.sort_order, is_active = true, source_sheet = EXCLUDED.source_sheet,
           source_label = EXCLUDED.source_label, notes = EXCLUDED.notes
         RETURNING id, slug`,
        [group.map(e => e.category), group.map(e => e.entity), group.map(e => e.name), group.map(e => e.slug),
          group.map(e => e.unit), group.map(e => e.chart), group.map(e => e.parent), group.map(e => e.order),
          group.map(e => e.sheet), group.map(e => e.label), group.map(e => e.note ?? null)])
      for (const r of res.rows) ids.set(r.slug, r.id)
    }
    const missing = catalog.filter(e => !ids.has(e.slug))
    if (missing.length) throw new Error(`No se pudieron guardar ${missing.length} indicadores (p. ej. ${missing[0].slug})`)

    // Indicadores de las categorías cargadas que ya no están en el catálogo: se eliminan
    const categories = [...new Set(catalog.map(c => c.category))]
    const removed = await db.query(
      `DELETE FROM indicators i USING indicator_categories c
        WHERE c.id = i.category_id AND c.slug = ANY($1) AND NOT (i.slug = ANY($2)) RETURNING i.slug`,
      [categories, catalog.map(c => c.slug)])

    // Comparación con lo ya cargado. Primero un resumen por indicador calculado en la base
    // (cantidad, rango de fechas, suma y suma ponderada por mes); solo los indicadores cuyo
    // resumen no coincide se comparan valor por valor. Así no hay que descargar toda la tabla.
    const monthIndex = (date: string) => Number(date.slice(0, 4)) * 12 + Number(date.slice(5, 7))
    const summary = await db.query(
      `SELECT indicator_id, count(*)::int AS n, to_char(min(date), 'YYYY-MM-DD') AS first, to_char(max(date), 'YYYY-MM-DD') AS last,
              sum(value)::float8 AS s,
              sum(value * (extract(year FROM date) * 12 + extract(month FROM date)))::float8 AS w
         FROM data_points WHERE period_type = 'monthly' AND indicator_id = ANY($1) GROUP BY indicator_id`, [[...ids.values()]])
    type Summary = { indicator_id: string; n: number; first: string; last: string; s: number; w: number }
    const dbSummary = new Map((summary.rows as Summary[]).map(r => [r.indicator_id, r]))

    const pointsById = new Map<string, Point[]>()
    for (const p of points) {
      const id = ids.get(p.slug)!
      if (!pointsById.has(id)) pointsById.set(id, [])
      pointsById.get(id)!.push(p)
    }
    const close = (a: number, b: number) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b))

    const toWrite: Point[] = []
    const dirty: string[] = []
    let inserted = 0
    let unchanged = 0
    for (const [id, pts] of pointsById) {
      const sum = dbSummary.get(id)
      if (!sum) { toWrite.push(...pts); inserted += pts.length; continue } // indicador sin datos previos
      const inRange = pts.filter(p => p.date >= sum.first && p.date <= sum.last)
      const s = inRange.reduce((acc, p) => acc + p.value, 0)
      const w = inRange.reduce((acc, p) => acc + p.value * monthIndex(p.date), 0)
      if (inRange.length === sum.n && close(s, sum.s) && close(w, sum.w)) {
        unchanged += inRange.length
        const fresh = pts.filter(p => p.date < sum.first || p.date > sum.last)
        toWrite.push(...fresh)
        inserted += fresh.length
      } else {
        dirty.push(id)
      }
    }

    // Indicadores con diferencias: comparación valor por valor y registro de revisiones
    const revisions: [string, string, number, number, string | null][] = []
    if (dirty.length) {
      const existing = await db.query(
        `SELECT indicator_id, to_char(date, 'YYYY-MM-DD') AS date, value::float8 AS value, report_id
           FROM data_points WHERE period_type = 'monthly' AND indicator_id = ANY($1)`, [dirty])
      type Existing = { indicator_id: string; date: string; value: number; report_id: string | null }
      const prev = new Map((existing.rows as Existing[]).map(r => [`${r.indicator_id}|${r.date}`, r]))
      for (const id of dirty) {
        for (const p of pointsById.get(id)!) {
          const old = prev.get(`${id}|${p.date}`)
          if (!old) { toWrite.push(p); inserted++; continue }
          if (Math.abs(old.value - p.value) <= 1e-6) { unchanged++; continue }
          toWrite.push(p)
          if (old.report_id !== reportId) revisions.push([id, p.date, old.value, p.value, old.report_id])
        }
      }
    }

    const BATCH = 5000
    for (let i = 0; i < toWrite.length; i += BATCH) {
      const batch = toWrite.slice(i, i + BATCH)
      await db.query(
        `INSERT INTO data_points (indicator_id, entity_id, value, date, period_type, source_file, report_id, source_cell, updated_at)
         SELECT x.indicator_id, i.entity_id, x.value, x.date, 'monthly', $5, $6, x.cell, now()
           FROM unnest($1::uuid[], $2::date[], $3::numeric[], $4::text[]) AS x(indicator_id, date, value, cell)
           JOIN indicators i ON i.id = x.indicator_id
         ON CONFLICT (indicator_id, period_type, date) DO UPDATE SET
           value = EXCLUDED.value, entity_id = EXCLUDED.entity_id, source_file = EXCLUDED.source_file,
           report_id = EXCLUDED.report_id, source_cell = EXCLUDED.source_cell, updated_at = now()`,
        [batch.map(p => ids.get(p.slug)), batch.map(p => p.date), batch.map(p => p.value), batch.map(p => p.cell), meta.sourceFile, reportId])
    }

    for (let i = 0; i < revisions.length; i += BATCH) {
      const batch = revisions.slice(i, i + BATCH)
      await db.query(
        `INSERT INTO data_point_revisions (indicator_id, period_type, date, old_value, new_value, old_report_id, new_report_id)
         SELECT x.indicator_id, 'monthly', x.date, x.old_value, x.new_value, x.old_report_id, $6
           FROM unnest($1::uuid[], $2::date[], $3::numeric[], $4::numeric[], $5::uuid[]) AS x(indicator_id, date, old_value, new_value, old_report_id)`,
        [batch.map(r => r[0]), batch.map(r => r[1]), batch.map(r => r[2]), batch.map(r => r[3]), batch.map(r => r[4]), reportId])
    }

    // Resumen por indicador (último valor, sparkline) usado por la web
    await db.query('REFRESH MATERIALIZED VIEW indicator_stats')

    const stats: LoadStats = {
      indicators: catalog.length,
      values: points.length,
      latest_month: points.reduce((max, p) => (p.date > max ? p.date : max), ''),
      inserted,
      revisions: revisions.length,
      unchanged,
      removed_indicators: removed.rowCount ?? 0,
    }
    await db.query(
      `INSERT INTO ingestion_runs (report_id, started_at, finished_at, status, stats, checks)
       VALUES ($1, $2, now(), 'success', $3, $4)`,
      [reportId, startedAt, JSON.stringify(stats), JSON.stringify(checks)])

    await db.query('COMMIT')
    return stats
  } catch (err) {
    await db.query('ROLLBACK')
    throw err
  }
}
