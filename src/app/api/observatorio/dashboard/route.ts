import { NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { enrichWithStats, fetchIndicatorStats } from '@/lib/indicator-stats'

export const dynamic = 'force-dynamic'

/** Indicadores clave del tablero, en orden. Si alguno falta se completa con otros con datos. */
const TOP_SLUGS = [
  'edes-perdidas-ano-movil',
  'edes-cri-ano-movil',
  'edes-cobranzas-ano-movil',
  'generacion-total',
  'edes-compra-de-energia',
  'costo-marginal-de-energia',
]
const FEATURED_SLUG = 'edes-perdidas-ano-movil'

/** Base mínima para calcular variaciones porcentuales con sentido. */
const MIN_BASE: Record<string, number> = { 'US$ MM': 1, 'RD$ MM': 50, 'GWh': 1 }

/** Empty dashboard response when Supabase is not configured */
function emptyDashboard() {
  return NextResponse.json({
    summary: {
      total_indicators: 0,
      total_data_points: 0,
      total_categories: 0,
      latest_period: null,
      last_upload_at: null,
      data_sources: [],
    },
    top_indicators: [],
    featured_indicator: null,
    trend_movers: { gainers: [], losers: [] },
    categories: [],
  })
}

/**
 * GET /api/observatorio/dashboard
 * Datos del tablero principal del Observatorio. Los valores por indicador
 * vienen de la vista materializada `indicator_stats` (sin truncamiento).
 */
export async function GET() {
  if (!isSupabaseConfigured) {
    return emptyDashboard()
  }

  try {
    const [indicatorsRes, statsMap, dpCount, categoriesRes, latestReport, latestRun] = await Promise.all([
      supabase
        .from('indicators')
        .select(`*, category:indicator_categories(*)`)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .range(0, 4999),
      fetchIndicatorStats(),
      supabase.from('data_points').select('*', { count: 'exact', head: true }),
      supabase.from('indicator_categories').select('*').order('sort_order', { ascending: true }),
      supabase
        .from('reports')
        .select('source_url, file_url, edition')
        .eq('source_org', 'MEM')
        .order('edition', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('ingestion_runs')
        .select('finished_at')
        .eq('status', 'success')
        .order('finished_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])

    if (indicatorsRes.error) {
      console.error('Error fetching indicators:', indicatorsRes.error)
      return NextResponse.json({ error: 'Error al obtener indicadores' }, { status: 500 })
    }

    const enriched = (indicatorsRes.data ?? []).map(ind => enrichWithStats(ind, statsMap.get(ind.id)))
    const withData = enriched.filter(ind => ind.latest_value !== null)
    const parents = withData.filter(ind => !ind.is_breakdown)

    const reportFile = latestReport.data?.source_url ?? latestReport.data?.file_url ?? null
    const summary = {
      total_indicators: withData.length,
      total_data_points: dpCount.count || 0,
      total_categories: new Set(withData.map(i => i.category_id)).size,
      latest_period: withData.reduce<string | null>((max, i) => (i.latest_date && (!max || i.latest_date > max) ? i.latest_date : max), null),
      last_upload_at: latestRun.data?.finished_at ?? null,
      data_sources: reportFile ? [reportFile.split('/').pop()!] : [],
    }

    // Indicadores clave
    const bySlug = new Map(withData.map(i => [i.slug, i]))
    const topIndicators = TOP_SLUGS.map(s => bySlug.get(s)).filter((i): i is NonNullable<typeof i> => !!i)
    for (const ind of parents) {
      if (topIndicators.length >= 6) break
      if (!topIndicators.includes(ind)) topIndicators.push(ind)
    }

    // Indicador destacado con su serie completa
    const featuredIndicator = bySlug.get(FEATURED_SLUG) ?? topIndicators[0] ?? null
    let featuredTimeSeries: { date: string; value: number }[] = []
    if (featuredIndicator) {
      const { data: fullSeries } = await supabase
        .from('data_points')
        .select('date, value')
        .eq('indicator_id', featuredIndicator.id)
        .eq('period_type', 'monthly')
        .order('date', { ascending: true })
        .range(0, 4999)
      featuredTimeSeries = (fullSeries ?? []).map(dp => ({ date: dp.date, value: Number(dp.value) }))
    }

    // Tendencias: variación interanual (mismo mes del año anterior) de los indicadores principales,
    // excluyendo porcentajes (se leen mejor en puntos porcentuales), bases demasiado pequeñas
    // y series que ya no se publican (p. ej. CDEEE, que reporta hasta enero 2024)
    const withChange = parents
      .filter(ind => ind.latest_date === summary.latest_period)
      .filter(ind => ind.unit !== '%' && ind.yoy_change_pct !== null && ind.year_ago_value !== null)
      .filter(ind => Math.abs(ind.year_ago_value!) >= (MIN_BASE[ind.unit] ?? 0.01))
      .filter(ind => Math.abs(ind.yoy_change_pct!) < 500)
      .sort((a, b) => Math.abs(b.yoy_change_pct!) - Math.abs(a.yoy_change_pct!))

    const toMover = (ind: (typeof withChange)[number]) => ({
      id: ind.id,
      name: ind.name,
      slug: ind.slug,
      change_pct: ind.yoy_change_pct,
      latest_value: ind.latest_value,
      unit: ind.unit,
      category_slug: ind.category?.slug,
      category_name: ind.category?.name,
      category_color: ind.category?.color,
    })
    const topGainers = withChange.filter(ind => ind.yoy_change_pct! > 0).slice(0, 4).map(toMover)
    const topLosers = withChange.filter(ind => ind.yoy_change_pct! < 0).slice(0, 4).map(toMover)

    // Categorías con número de indicadores principales con datos
    const countMap: Record<string, number> = {}
    for (const ind of parents) countMap[ind.category_id] = (countMap[ind.category_id] || 0) + 1
    const categoriesWithCounts = (categoriesRes.data ?? [])
      .map(cat => ({ ...cat, indicator_count: countMap[cat.id] || 0 }))
      .filter(cat => cat.indicator_count > 0)

    return NextResponse.json({
      summary,
      top_indicators: topIndicators,
      featured_indicator: featuredIndicator ? {
        id: featuredIndicator.id,
        name: featuredIndicator.name,
        slug: featuredIndicator.slug,
        unit: featuredIndicator.unit,
        description: featuredIndicator.description,
        latest_value: featuredIndicator.latest_value,
        latest_date: featuredIndicator.latest_date,
        change_pct: featuredIndicator.change_pct,
        change: featuredIndicator.change,
        category: featuredIndicator.category,
        category_slug: featuredIndicator.category?.slug,
        time_series: featuredTimeSeries,
      } : null,
      trend_movers: {
        gainers: topGainers,
        losers: topLosers,
      },
      categories: categoriesWithCounts,
    })
  } catch (err) {
    console.error('Unexpected error in GET /api/observatorio/dashboard:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
