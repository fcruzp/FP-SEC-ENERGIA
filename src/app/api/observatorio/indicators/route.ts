import { NextRequest, NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { enrichWithStats, fetchIndicatorStats } from '@/lib/indicator-stats'

export const dynamic = 'force-dynamic'

/**
 * GET /api/observatorio/indicators
 * Lista indicadores con filtros opcionales.
 * Query params:
 *   - category_slug — filtrar por categoría (ej: "variables-relevantes")
 *   - entity_slug — filtrar por entidad (ej: "edenorte")
 *   - is_breakdown — "true"/"false" — filtrar por si es desglose
 *   - parent_only — "true" — solo indicadores padre (no desgloses)
 *   - with_data — "true" — incluye último data_point
 */
export async function GET(request: NextRequest) {
  try {
    if (!isSupabaseConfigured) {
      return NextResponse.json({ indicators: [] })
    }

    const { searchParams } = new URL(request.url)
    const categorySlug = searchParams.get('category_slug')
    const entitySlug = searchParams.get('entity_slug')
    const isBreakdown = searchParams.get('is_breakdown')
    const parentOnly = searchParams.get('parent_only') === 'true'
    const withData = searchParams.get('with_data') === 'true'

    let query = supabase
      .from('indicators')
      .select(`
        *,
        category:indicator_categories(*),
        entity:entities(*),
        parent_indicator:indicators!parent_indicator_id(id, name, slug)
      `)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .range(0, 4999)

    // Filter by category slug
    if (categorySlug) {
      const { data: cat } = await supabase
        .from('indicator_categories')
        .select('id')
        .eq('slug', categorySlug)
        .single()

      if (cat) {
        query = query.eq('category_id', cat.id)
      } else {
        return NextResponse.json({ indicators: [] })
      }
    }

    // Filter by entity slug
    if (entitySlug) {
      const { data: ent } = await supabase
        .from('entities')
        .select('id')
        .eq('slug', entitySlug)
        .single()

      if (ent) {
        query = query.eq('entity_id', ent.id)
      } else {
        return NextResponse.json({ indicators: [] })
      }
    }

    // Filter by breakdown status
    if (isBreakdown === 'true') {
      query = query.eq('is_breakdown', true)
    } else if (isBreakdown === 'false') {
      query = query.eq('is_breakdown', false)
    }

    // Parent only (no breakdowns)
    if (parentOnly) {
      query = query.eq('is_breakdown', false)
    }

    const { data: indicators, error } = await query

    if (error) {
      console.error('Error fetching indicators:', error)
      return NextResponse.json({ error: 'Error al obtener indicadores' }, { status: 500 })
    }

    // If with_data, add latest/previous values and sparkline from indicator_stats
    if (withData && indicators && indicators.length > 0) {
      const stats = await fetchIndicatorStats()
      const enriched = indicators
        .map(ind => enrichWithStats(ind, stats.get(ind.id)))
        .filter(ind => ind.latest_value !== null)
      return NextResponse.json({ indicators: enriched })
    }

    return NextResponse.json({ indicators: indicators || [] })
  } catch (err) {
    console.error('Unexpected error in GET /api/observatorio/indicators:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
