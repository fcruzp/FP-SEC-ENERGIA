import { supabase } from '@/lib/supabase'
import { fetchIndicatorStats, type IndicatorStats } from '@/lib/indicator-stats'
import { getDefinition } from '@/lib/mem/definitions'
import { SOURCES } from '@/lib/sources'
import { ApiError } from './http'

/**
 * Catálogo y fuentes para /api/v1. Indicadores, categorías, entidades, ediciones y
 * el resumen por indicador se cargan juntos y se guardan en memoria 5 minutos
 * (los datos solo cambian al cargar una edición del informe, una vez al mes).
 */

export interface CatIndicator {
  id: string
  slug: string
  name: string
  unit: string
  description: string | null
  source: string | null
  is_breakdown: boolean
  parent_indicator_id: string | null
  category_id: string
  entity_id: string | null
  sort_order: number | null
  source_sheet: string | null
  source_label: string | null
  notes: string | null
}

export interface CatCategory { id: string; slug: string; name: string; description: string | null; sort_order: number | null }
export interface CatEntity { id: string; slug: string; name: string; type: string; sort_order: number | null }
export interface CatReport {
  id: string
  title: string
  edition: string
  publish_date: string | null
  source_url: string | null
  pdf_url: string | null
}

export interface Catalog {
  indicators: CatIndicator[]
  bySlug: Map<string, CatIndicator>
  byId: Map<string, CatIndicator>
  children: Map<string, CatIndicator[]>
  categories: CatCategory[]
  categoryById: Map<string, CatCategory>
  categoryBySlug: Map<string, CatCategory>
  entities: CatEntity[]
  entityById: Map<string, CatEntity>
  entityBySlug: Map<string, CatEntity>
  /** Ediciones del MEM, de la más antigua a la más reciente */
  reports: CatReport[]
  reportById: Map<string, CatReport>
  stats: Map<string, IndicatorStats>
  lastUpdate: string | null
}

const TTL_MS = 5 * 60 * 1000
let cache: { at: number; promise: Promise<Catalog> } | null = null

export function getCatalog(): Promise<Catalog> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.promise
  const promise = loadCatalog()
  cache = { at: Date.now(), promise }
  promise.catch(() => { cache = null })
  return promise
}

async function loadCatalog(): Promise<Catalog> {
  const [indRes, catRes, entRes, repRes, runRes, stats] = await Promise.all([
    supabase.from('indicators')
      .select('id, slug, name, unit, description, source, is_breakdown, parent_indicator_id, category_id, entity_id, sort_order, source_sheet, source_label, notes')
      .eq('is_active', true).order('sort_order', { ascending: true }).range(0, 4999),
    supabase.from('indicator_categories').select('id, slug, name, description, sort_order').order('sort_order', { ascending: true }),
    supabase.from('entities').select('id, slug, name, type, sort_order').order('sort_order', { ascending: true }),
    supabase.from('reports').select('id, title, edition, publish_date, source_url, pdf_url')
      .eq('source_org', 'MEM').not('edition', 'is', null).order('edition', { ascending: true }),
    supabase.from('ingestion_runs').select('finished_at').eq('status', 'success')
      .order('finished_at', { ascending: false }).limit(1).maybeSingle(),
    fetchIndicatorStats(),
  ])
  for (const res of [indRes, catRes, entRes, repRes]) if (res.error) throw res.error

  const indicators = (indRes.data ?? []) as CatIndicator[]
  const categories = (catRes.data ?? []) as CatCategory[]
  const entities = (entRes.data ?? []) as CatEntity[]
  const reports = (repRes.data ?? []) as CatReport[]
  const children = new Map<string, CatIndicator[]>()
  for (const ind of indicators) {
    if (!ind.parent_indicator_id) continue
    if (!children.has(ind.parent_indicator_id)) children.set(ind.parent_indicator_id, [])
    children.get(ind.parent_indicator_id)!.push(ind)
  }

  return {
    indicators,
    bySlug: new Map(indicators.map(i => [i.slug, i])),
    byId: new Map(indicators.map(i => [i.id, i])),
    children,
    categories,
    categoryById: new Map(categories.map(c => [c.id, c])),
    categoryBySlug: new Map(categories.map(c => [c.slug, c])),
    entities,
    entityById: new Map(entities.map(e => [e.id, e])),
    entityBySlug: new Map(entities.map(e => [e.slug, e])),
    reports,
    reportById: new Map(reports.map(r => [r.id, r])),
    stats,
    lastUpdate: runRes.data?.finished_at ?? null,
  }
}

export function requireIndicator(cat: Catalog, slug: string): CatIndicator {
  const ind = cat.bySlug.get(slug)
  if (!ind) {
    throw new ApiError(404, 'indicador_no_encontrado', 'Indicador no encontrado',
      `No existe el indicador "${slug}". Use GET /api/v1/indicadores para buscar el slug exacto.`)
  }
  return ind
}

// ── Fechas y fuente ──

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

/** '2026-07-01' → '2026-07' */
export const toPeriod = (date: string) => date.slice(0, 7)
/** '2026-07' → '2026-07-01' */
export const fromPeriod = (period: string) => `${period}-01`

export function addMonths(date: string, n: number): string {
  const total = Number(date.slice(0, 4)) * 12 + Number(date.slice(5, 7)) - 1 + n
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, '0')}-01`
}

function monthsBetween(a: string, b: string): number {
  return (Number(b.slice(0, 4)) - Number(a.slice(0, 4))) * 12 + Number(b.slice(5, 7)) - Number(a.slice(5, 7))
}

function longDate(date: string): string {
  return `${Number(date.slice(8, 10))} de ${MONTHS[Number(date.slice(5, 7)) - 1]} de ${date.slice(0, 4)}`
}

export function editionLabel(edition: string): string {
  return `${MONTHS[Number(edition.slice(5, 7)) - 1]} ${edition.slice(0, 4)}`
}

/** Fuente de una edición del Informe de Desempeño, lista para citar. */
export function memSource(report: CatReport | null | undefined) {
  const mem = SOURCES.MEM
  if (!report) {
    return { organismo: `${mem.institution} (MEM)`, publicacion: mem.publication, pagina: mem.url, cita: `${mem.institution} (MEM), ${mem.publication}.` }
  }
  return {
    organismo: `${mem.institution} (MEM)`,
    publicacion: mem.publication,
    edicion: toPeriod(report.edition),
    titulo: report.title,
    publicado: report.publish_date,
    excel_url: report.source_url,
    pdf_url: report.pdf_url,
    pagina: mem.url,
    cita: `${mem.institution} (MEM), ${mem.publication}, edición ${editionLabel(report.edition)}`
      + (report.publish_date ? `, publicada el ${longDate(report.publish_date)}.` : '.'),
  }
}

export function currentReport(cat: Catalog): CatReport | null {
  return cat.reports[cat.reports.length - 1] ?? null
}

/** Edición vigente + nota de interpretación: los valores reflejan la última edición cargada. */
export function sourceMeta(cat: Catalog) {
  const first = cat.reports[0]
  return {
    fuente: memSource(currentReport(cat)),
    nota_fuente: 'Valores según la edición más reciente del informe.'
      + (first ? ` En las series, "edicion" es la edición más antigua cargada en el Observatorio (desde ${editionLabel(first.edition)}) que ya publicaba ese mismo valor.` : ''),
  }
}

export function editionOf(cat: Catalog, reportId: string | null): string | null {
  const r = reportId ? cat.reportById.get(reportId) : null
  return r ? toPeriod(r.edition) : null
}

// ── Serialización de indicadores ──

const round = (n: number, digits = 6) => Math.round(n * 10 ** digits) / 10 ** digits

function variation(from: number | null, to: number | null) {
  if (from === null || to === null) return null
  return {
    absoluta: round(to - from),
    relativa_pct: from !== 0 ? round(((to - from) / Math.abs(from)) * 100, 2) : null,
  }
}

export function indicatorSummary(cat: Catalog, ind: CatIndicator, withValues: boolean) {
  const stats = cat.stats.get(ind.id)
  const parent = ind.parent_indicator_id ? cat.byId.get(ind.parent_indicator_id) : null
  return {
    slug: ind.slug,
    nombre: ind.name,
    unidad: ind.unit,
    categoria: cat.categoryById.get(ind.category_id)?.slug ?? null,
    entidad: ind.entity_id ? cat.entityById.get(ind.entity_id)?.slug ?? null : null,
    es_desglose: ind.is_breakdown,
    indicador_padre: parent?.slug ?? null,
    fuente: ind.source ?? 'MEM',
    ...(withValues
      ? { ultimo: stats?.latest_date && stats.latest_value !== null ? { periodo: toPeriod(stats.latest_date), valor: stats.latest_value } : null }
      : {}),
  }
}

/** Último valor, anterior, hace 12 meses y variaciones (desde `indicator_stats`). */
export function indicatorValues(cat: Catalog, ind: CatIndicator) {
  const stats = cat.stats.get(ind.id)
  if (!stats?.latest_date || stats.latest_value === null) return null
  // "Hace 12 meses" solo si la serie es mensual continua (sin huecos): entonces la fila 13 es exactamente ese mes
  const continuous = stats.first_date !== null && monthsBetween(stats.first_date, stats.latest_date) + 1 === Number(stats.point_count)
  const yearAgo = continuous && stats.year_ago_value !== null ? stats.year_ago_value : null
  return {
    ultimo: { periodo: toPeriod(stats.latest_date), valor: stats.latest_value },
    anterior: stats.previous_date && stats.previous_value !== null ? { periodo: toPeriod(stats.previous_date), valor: stats.previous_value } : null,
    hace_12_meses: yearAgo !== null ? { periodo: toPeriod(addMonths(stats.latest_date, -12)), valor: yearAgo } : null,
    variacion_mensual: variation(stats.previous_value, stats.latest_value),
    variacion_interanual: variation(yearAgo, stats.latest_value),
    ...(ind.unit === '%' ? { nota: 'Para indicadores en %, la variación absoluta está en puntos porcentuales.' } : {}),
  }
}

export function indicatorDetail(cat: Catalog, ind: CatIndicator, withValues: boolean) {
  const stats = cat.stats.get(ind.id)
  const def = getDefinition(ind.slug)
  const entity = ind.entity_id ? cat.entityById.get(ind.entity_id) : null
  const category = cat.categoryById.get(ind.category_id)

  return {
    ...indicatorSummary(cat, ind, false),
    categoria_nombre: category?.name ?? null,
    entidad_nombre: entity?.name ?? null,
    definicion: def?.definition ?? ind.description ?? null,
    formula: def?.formula ?? null,
    fuente_primaria: def?.primarySource ?? null,
    notas: ind.notes,
    origen: { hoja: ind.source_sheet, etiqueta: ind.source_label },
    desgloses: (cat.children.get(ind.id) ?? []).map(child => ({
      slug: child.slug,
      nombre: child.name,
      entidad: child.entity_id ? cat.entityById.get(child.entity_id)?.slug ?? null : null,
    })),
    cobertura: stats?.first_date && stats.latest_date
      ? { desde: toPeriod(stats.first_date), hasta: toPeriod(stats.latest_date), puntos: Number(stats.point_count) }
      : null,
    ...(withValues ? { valores: indicatorValues(cat, ind) } : {}),
  }
}

// ── Series ──

export interface SeriesPoint { periodo: string; valor: number; edicion: string | null; celda: string | null }

/** Serie mensual de un indicador (ascendente). `desde`/`hasta` en 'AAAA-MM'. */
export async function fetchSeries(cat: Catalog, ind: CatIndicator, desde?: string, hasta?: string): Promise<SeriesPoint[]> {
  let query = supabase.from('data_points')
    .select('date, value, report_id, source_cell')
    .eq('indicator_id', ind.id)
    .eq('period_type', 'monthly')
  if (desde) query = query.gte('date', fromPeriod(desde))
  if (hasta) query = query.lte('date', fromPeriod(hasta))
  const { data, error } = await query.order('date', { ascending: true }).range(0, 4999)
  if (error) throw error
  return (data ?? []).map(dp => ({
    periodo: toPeriod(dp.date),
    valor: Number(dp.value),
    edicion: editionOf(cat, dp.report_id),
    celda: dp.source_cell ?? null,
  }))
}
