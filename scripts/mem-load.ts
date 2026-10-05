/**
 * Carga una edición del "Informe de Desempeño de las Empresas Eléctricas
 * Estatales" (MEM) en la base de datos.
 *
 * Uso (con bun):
 *   bun scripts/mem-load.ts --file data/mem/<archivo>.xlsx --source-url <url> [--pdf-url <url>]
 *   bun scripts/mem-load.ts --file ... --dry-run          # solo verifica, no escribe
 *   bun scripts/mem-load.ts --file ... --accept-catalog   # acepta cambios de estructura del Excel
 *
 * Garantías:
 *   - El catálogo generado debe coincidir con data/mem/catalogo.json (versionado en git).
 *   - Verificaciones de conciliación antes de escribir; si fallan, no se escribe nada.
 *   - Todo se escribe en una transacción: o se carga completo o no se carga.
 *   - Cada valor guarda su edición, hoja y celda de origen; los cambios respecto
 *     a la edición anterior quedan en data_point_revisions.
 */
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Client } from 'pg'
import { MEM_SHEETS } from '../src/lib/mem/catalog'
import { compareCatalog, editionFromFilename, extractWorkbook, MONTHS, runChecks, toPoints, type KnownAnomaly } from '../src/lib/mem/pipeline'

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..')
const CATALOG_FILE = resolve(ROOT, 'data/mem/catalogo.json')
const KNOWN_FILE = resolve(ROOT, 'data/mem/anomalias-conocidas.json')

// ── Argumentos ──
const args = process.argv.slice(2)
const arg = (name: string) => {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : undefined
}
const file = arg('--file')
const sourceUrl = arg('--source-url') ?? null
const pdfUrl = arg('--pdf-url') ?? null
const dryRun = args.includes('--dry-run')
const acceptCatalog = args.includes('--accept-catalog')
if (!file) {
  console.error('Uso: bun scripts/mem-load.ts --file <xlsx> --source-url <url> [--pdf-url <url>] [--dry-run] [--accept-catalog]')
  process.exit(1)
}

// ── Entorno ──
for (const line of readFileSync(resolve(ROOT, '.env.local'), 'utf-8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^"|"$/g, '')
}

async function main() {
  const filePath = resolve(ROOT, file!)
  const buffer = readFileSync(filePath)
  const sha256 = createHash('sha256').update(buffer).digest('hex')
  const sourceFile = basename(filePath)
  const edition = editionFromFilename(sourceFile)
  console.log(`📄 ${sourceFile}\n   edición ${edition} · sha256 ${sha256.slice(0, 16)}…`)

  // ── 1. Estructura y catálogo ──
  const extraction = extractWorkbook(buffer)
  const { rows, sheets } = extraction
  for (const s of sheets) {
    const alias = s.actualName !== s.sheet ? ` (hoja "${s.actualName}")` : ''
    console.log(`   ${s.sheet.padEnd(22)} ${String(s.indicators).padStart(3)} indicadores · ${s.firstMonth} → ${s.lastMonth}${alias}`)
  }
  const catalog = rows.map(r => r.entry)

  if (!existsSync(CATALOG_FILE) || acceptCatalog) {
    writeFileSync(CATALOG_FILE, JSON.stringify(catalog, null, 2) + '\n')
    console.log(`📝 Catálogo escrito en data/mem/catalogo.json (${catalog.length} indicadores). Revísalo y versiónalo en git.`)
  } else {
    const diffs = compareCatalog(catalog, JSON.parse(readFileSync(CATALOG_FILE, 'utf-8')))
    if (diffs.length) {
      console.error(`\n❌ La estructura del Excel no coincide con data/mem/catalogo.json (${diffs.length} diferencias):`)
      diffs.slice(0, 40).forEach(d => console.error('   ' + d))
      console.error('\nRevisa los cambios. Si son correctos, vuelve a ejecutar con --accept-catalog.')
      process.exit(2)
    }
    console.log(`✅ Catálogo idéntico al versionado (${catalog.length} indicadores)`)
  }

  // ── 2. Verificaciones ──
  const known: KnownAnomaly[] = existsSync(KNOWN_FILE) ? JSON.parse(readFileSync(KNOWN_FILE, 'utf-8')) : []
  const { outcomes, ok: checksOk } = runChecks(extraction, known)
  const checks = outcomes.map(o => o.result)
  const failed = !checksOk
  console.log('\n🔎 Verificaciones')
  for (const { result: c, known: knownHere, ok } of outcomes) {
    const knownNote = knownHere.length ? ` (${knownHere.length} anomalías conocidas de la fuente)` : ''
    console.log(`   ${ok ? '✅' : '❌'} ${c.check}: ${c.compared} comparaciones, ${c.mismatches} diferencias${knownNote} — ${c.description}`)
    if (!ok) c.samples.forEach(s => console.log(`      · ${s}`))
    knownHere.forEach(k => console.log(`      ℹ️  ${k.key}: ${k.explanation}`))
  }

  const points = toPoints(rows)
  const latest = points.reduce((max, p) => (p.date > max ? p.date : max), '')
  console.log(`\n📊 ${points.length.toLocaleString('es-DO')} valores mensuales · último mes ${latest}`)
  const nonNumeric = rows.reduce((s, r) => s + r.source.nonNumeric, 0)
  if (nonNumeric) console.log(`   ℹ️  ${nonNumeric} celdas mensuales con texto (p. ej. "-") se omitieron`)

  if (failed) {
    console.error('\n❌ Hay verificaciones con diferencias. No se escribe nada en la base de datos.')
    process.exit(3)
  }
  if (dryRun) {
    console.log('\n🔧 Modo prueba: no se escribió nada.')
    return
  }

  // ── 3. Escritura transaccional ──
  const db = new Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } })
  await db.connect()
  const startedAt = new Date()
  try {
    await db.query('BEGIN')

    const newer = await db.query(
      `SELECT edition FROM reports WHERE source_org = 'MEM' AND report_type = 'desempeno_mensual' AND edition > $1 LIMIT 1`, [edition])
    if (newer.rowCount) throw new Error(`Ya hay cargada una edición más reciente (${newer.rows[0].edition.toISOString().slice(0, 10)}).`)

    const report = await db.query(
      `INSERT INTO reports (title, slug, file_url, file_type, file_size, publish_date, source_org, report_type, is_published, edition, source_url, pdf_url, sha256)
       VALUES ($1, $2, $3, 'xlsx', $4, now()::date, 'MEM', 'desempeno_mensual', true, $5, $3, $6, $7)
       ON CONFLICT (source_org, report_type, edition) DO UPDATE SET
         file_url = EXCLUDED.file_url, source_url = EXCLUDED.source_url, pdf_url = COALESCE(EXCLUDED.pdf_url, reports.pdf_url),
         sha256 = EXCLUDED.sha256, file_size = EXCLUDED.file_size, title = EXCLUDED.title
       RETURNING id`,
      [`Informe de Desempeño EEE — ${MONTHS[Number(edition.slice(5, 7)) - 1]} ${edition.slice(0, 4)}`,
        `mem-desempeno-${edition.slice(0, 7)}`, sourceUrl ?? sourceFile, buffer.length, edition, pdfUrl, sha256])
    const reportId: string = report.rows[0].id

    // Catálogo: categorías y entidades existentes
    const cats = new Map((await db.query('SELECT id, slug FROM indicator_categories')).rows.map(r => [r.slug, r.id]))
    const ents = new Map((await db.query('SELECT id, slug FROM entities')).rows.map(r => [r.slug, r.id]))
    for (const e of catalog) {
      if (!cats.has(e.category)) throw new Error(`Categoría inexistente: ${e.category}`)
      if (e.entity && !ents.has(e.entity)) throw new Error(`Entidad inexistente: ${e.entity}`)
    }

    // Indicadores: primero los principales, luego los desgloses (necesitan el id del padre)
    const ids = new Map<string, string>()
    for (const e of [...catalog.filter(c => !c.parent), ...catalog.filter(c => c.parent)]) {
      const res = await db.query(
        `INSERT INTO indicators (category_id, entity_id, name, slug, unit, source, frequency, chart_type, is_breakdown,
                                 parent_indicator_id, sort_order, is_active, source_sheet, source_label, notes)
         VALUES ($1, $2, $3, $4, $5, 'MEM', 'monthly', $6, $7, $8, $9, true, $10, $11, $12)
         ON CONFLICT (slug) DO UPDATE SET
           category_id = EXCLUDED.category_id, entity_id = EXCLUDED.entity_id, name = EXCLUDED.name, unit = EXCLUDED.unit,
           chart_type = EXCLUDED.chart_type, is_breakdown = EXCLUDED.is_breakdown, parent_indicator_id = EXCLUDED.parent_indicator_id,
           sort_order = EXCLUDED.sort_order, is_active = true, source_sheet = EXCLUDED.source_sheet,
           source_label = EXCLUDED.source_label, notes = EXCLUDED.notes
         RETURNING id`,
        [cats.get(e.category), e.entity ? ents.get(e.entity) : null, e.name, e.slug, e.unit, e.chart,
          !!e.parent, e.parent ? ids.get(e.parent) : null, e.order, e.sheet, e.label, e.note ?? null])
      ids.set(e.slug, res.rows[0].id)
    }

    // Indicadores de las hojas cargadas que ya no están en el catálogo: se eliminan
    const sheets = [...new Set(catalog.map(c => c.category))]
    const removed = await db.query(
      `DELETE FROM indicators i USING indicator_categories c
        WHERE c.id = i.category_id AND c.slug = ANY($1) AND NOT (i.slug = ANY($2)) RETURNING i.slug`,
      [sheets, catalog.map(c => c.slug)])

    // Valores existentes, para registrar revisiones
    const existing = await db.query(
      `SELECT dp.indicator_id, to_char(dp.date, 'YYYY-MM-DD') AS date, dp.value::float8 AS value, dp.report_id
         FROM data_points dp WHERE dp.period_type = 'monthly' AND dp.indicator_id = ANY($1)`, [[...ids.values()]])
    type Existing = { indicator_id: string; date: string; value: number; report_id: string | null }
    const prev = new Map((existing.rows as Existing[]).map(r => [`${r.indicator_id}|${r.date}`, r]))

    const revisions: unknown[][] = []
    let unchanged = 0
    for (const p of points) {
      const id = ids.get(p.slug)!
      const old = prev.get(`${id}|${p.date}`)
      if (!old) continue
      if (Math.abs(old.value - p.value) <= 1e-6) { unchanged++; continue }
      if (old.report_id !== reportId) revisions.push([id, p.date, old.value, p.value, old.report_id])
    }

    // Inserción masiva por lotes
    const BATCH = 5000
    for (let i = 0; i < points.length; i += BATCH) {
      const batch = points.slice(i, i + BATCH)
      await db.query(
        `INSERT INTO data_points (indicator_id, entity_id, value, date, period_type, source_file, report_id, source_cell, updated_at)
         SELECT x.indicator_id, i.entity_id, x.value, x.date, 'monthly', $5, $6, x.cell, now()
           FROM unnest($1::uuid[], $2::date[], $3::numeric[], $4::text[]) AS x(indicator_id, date, value, cell)
           JOIN indicators i ON i.id = x.indicator_id
         ON CONFLICT (indicator_id, period_type, date) DO UPDATE SET
           value = EXCLUDED.value, entity_id = EXCLUDED.entity_id, source_file = EXCLUDED.source_file,
           report_id = EXCLUDED.report_id, source_cell = EXCLUDED.source_cell, updated_at = now()`,
        [batch.map(p => ids.get(p.slug)), batch.map(p => p.date), batch.map(p => p.value), batch.map(p => p.cell), sourceFile, reportId])
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

    const stats = {
      indicators: catalog.length,
      values: points.length,
      latest_month: latest,
      revisions: revisions.length,
      unchanged,
      removed_indicators: removed.rowCount,
    }
    await db.query(
      `INSERT INTO ingestion_runs (report_id, started_at, finished_at, status, stats, checks)
       VALUES ($1, $2, now(), 'success', $3, $4)`,
      [reportId, startedAt, JSON.stringify(stats), JSON.stringify(checks)])

    await db.query('COMMIT')
    console.log('\n✅ Carga completada')
    console.log(`   ${stats.indicators} indicadores · ${stats.values.toLocaleString('es-DO')} valores · último mes ${latest}`)
    console.log(`   ${stats.revisions} valores revisados respecto a la edición anterior · ${removed.rowCount} indicadores obsoletos eliminados`)
  } catch (err) {
    await db.query('ROLLBACK')
    console.error('\n❌ Error; no se escribió nada:', (err as Error).message)
    process.exitCode = 1
  } finally {
    await db.end()
  }
}

main()
