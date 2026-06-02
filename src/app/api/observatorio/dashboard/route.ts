import { NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

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
 * Returns all data needed for the dashboard landing page.
 * Uses minimal queries with smart limits to avoid memory issues.
 */
export async function GET() {
  if (!isSupabaseConfigured) {
    return emptyDashboard()
  }

  try {
    // 1. Summary stats — use head:true counts to minimize data transfer
    const [indCount, dpCount, latestDp, latestUpload, catCount] = await Promise.all([
      supabase.from('indicators').select('*', { count: 'exact', head: true }).eq('is_active', true).eq('is_breakdown', false),
      supabase.from('data_points').select('*', { count: 'exact', head: true }),
      supabase.from('data_points').select('date').order('date', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('data_points').select('created_at').order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('indicator_categories').select('*', { count: 'exact', head: true }),
    ])

    const summary = {
      total_indicators: indCount.count || 0,
      total_data_points: dpCount.count || 0,
      total_categories: catCount.count || 0,
      latest_period: latestDp.data?.date || null,
      last_upload_at: latestUpload.data?.created_at || null,
      data_sources: ['Informe-de-Desempeno-marzo-2026.xlsx'], // Hardcoded for performance
    }

    // 2. Fetch all active parent indicators with category info
    const { data: allIndicators, error: indError } = await supabase
      .from('indicators')
      .select(`*, category:indicator_categories(*)`)
      .eq('is_active', true)
      .eq('is_breakdown', false)
      .order('sort_order', { ascending: true })

    if (indError) {
      console.error('Error fetching indicators:', indError)
      return NextResponse.json({ error: 'Error al obtener indicadores' }, { status: 500 })
    }

    // 3. Get latest data points efficiently — ONE query with smart limit
    // Fetch recent data points ordered by date desc. With 145 indicators,
    // fetching ~2500 most recent rows covers ~17 points per indicator on average.
    const { data: recentDataPoints } = await supabase
      .from('data_points')
      .select('indicator_id, value, date, entity_id')
      .order('date', { ascending: false })
      .limit(2500)

    // Build entity map for filtering
    const indicatorEntityMap: Record<string, string | null> = {}
    for (const ind of allIndicators || []) {
      indicatorEntityMap[ind.id] = ind.entity_id
    }

    // Build latest/previous per indicator (respecting entity filter)
    const latestByIndicator: Record<string, { value: number; date: string }> = {}
    const previousByIndicator: Record<string, { value: number; date: string }> = {}

    // Build sparkline data per indicator (last 12 data points, chronological order)
    const sparklineByIndicator: Record<string, { date: string; value: number }[]> = {}
    const sparklineGrouped: Record<string, { date: string; value: number }[]> = {}

    if (recentDataPoints) {
      for (const dp of recentDataPoints) {
        const entityId = indicatorEntityMap[dp.indicator_id]
        const matchesEntity = entityId ? dp.entity_id === entityId : !dp.entity_id
        if (!matchesEntity) continue

        // Latest/previous tracking
        if (!latestByIndicator[dp.indicator_id]) {
          latestByIndicator[dp.indicator_id] = { value: dp.value, date: dp.date }
        } else if (!previousByIndicator[dp.indicator_id]) {
          const latest = latestByIndicator[dp.indicator_id]
          if (dp.date !== latest.date) {
            previousByIndicator[dp.indicator_id] = { value: dp.value, date: dp.date }
          }
        }

        // Sparkline tracking (collect up to 12 points per indicator)
        if (!sparklineGrouped[dp.indicator_id]) sparklineGrouped[dp.indicator_id] = []
        if (sparklineGrouped[dp.indicator_id].length < 12) {
          sparklineGrouped[dp.indicator_id].push({ date: dp.date, value: dp.value })
        }
      }

      // Reverse sparklines to chronological order
      for (const [id, points] of Object.entries(sparklineGrouped)) {
        sparklineByIndicator[id] = points.reverse()
      }
    }

    // 4. Enrich indicators with data
    const enriched = (allIndicators || []).map(ind => {
      const latest = latestByIndicator[ind.id]
      const previous = previousByIndicator[ind.id]
      const change = latest && previous ? latest.value - previous.value : null
      const changePct = latest && previous && previous.value !== 0
        ? ((latest.value - previous.value) / Math.abs(previous.value)) * 100
        : null

      return {
        ...ind,
        latest_value: latest?.value ?? null,
        latest_date: latest?.date ?? null,
        previous_value: previous?.value ?? null,
        change,
        change_pct: changePct,
        sparkline_data: sparklineByIndicator[ind.id] || [],
      }
    })

    // 5. Top indicators (those with data)
    const withData = enriched.filter(ind => ind.latest_value !== null && ind.latest_value !== undefined)
    const topIndicators = withData.slice(0, 6)

    // 6. Featured indicator — pick the #2 indicator (or #1 if only one)
    const featuredIndicator = withData.length > 1 ? withData[1] : withData[0] || null

    // 7. Fetch full time series for featured indicator ONLY (single indicator, small dataset)
    let featuredTimeSeries: { date: string; value: number }[] = []
    if (featuredIndicator) {
      const { data: fullSeries } = await supabase
        .from('data_points')
        .select('date, value, entity_id')
        .eq('indicator_id', featuredIndicator.id)
        .order('date', { ascending: true })

      if (fullSeries) {
        const entityId = featuredIndicator.entity_id
        featuredTimeSeries = fullSeries
          .filter(dp => entityId ? dp.entity_id === entityId : !dp.entity_id)
          .map(dp => ({ date: dp.date, value: dp.value }))
      }
    }

    // 8. Trend movers — top positive and negative changes
    const withChange = withData
      .filter(ind => ind.change_pct !== null && ind.change_pct !== undefined && Math.abs(ind.change_pct) < 1000)
      .sort((a, b) => Math.abs(b.change_pct!) - Math.abs(a.change_pct!))

    const topGainers = withChange
      .filter(ind => ind.change_pct! > 0)
      .slice(0, 4)
      .map(ind => ({
        id: ind.id,
        name: ind.name,
        slug: ind.slug,
        change_pct: ind.change_pct,
        latest_value: ind.latest_value,
        unit: ind.unit,
        category_slug: ind.category?.slug,
        category_name: ind.category?.name,
        category_color: ind.category?.color,
      }))

    const topLosers = withChange
      .filter(ind => ind.change_pct! < 0)
      .slice(0, 4)
      .map(ind => ({
        id: ind.id,
        name: ind.name,
        slug: ind.slug,
        change_pct: ind.change_pct,
        latest_value: ind.latest_value,
        unit: ind.unit,
        category_slug: ind.category?.slug,
        category_name: ind.category?.name,
        category_color: ind.category?.color,
      }))

    // 9. Categories with indicator counts
    const { data: categories } = await supabase
      .from('indicator_categories')
      .select('*')
      .order('sort_order', { ascending: true })

    const { data: catCounts } = await supabase
      .from('indicators')
      .select('category_id')
      .eq('is_active', true)
      .eq('is_breakdown', false)

    const countMap: Record<string, number> = {}
    if (catCounts) {
      for (const row of catCounts) {
        countMap[row.category_id] = (countMap[row.category_id] || 0) + 1
      }
    }

    const categoriesWithCounts = (categories || []).map(cat => ({
      ...cat,
      indicator_count: countMap[cat.id] || 0,
    }))

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
