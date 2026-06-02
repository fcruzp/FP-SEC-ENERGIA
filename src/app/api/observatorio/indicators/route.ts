import { NextRequest, NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { Indicator, IndicatorCategory, Entity } from '@/lib/supabase-types'

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

    // If with_data, fetch latest data point for each indicator
    if (withData && indicators && indicators.length > 0) {
      const indicatorIds = indicators.map(i => i.id)

      // Build a map of indicator_id -> entity_id for filtering
      const indicatorEntityMap: Record<string, string | null> = {}
      for (const ind of indicators) {
        indicatorEntityMap[ind.id] = ind.entity_id
      }

      // MEMORY-OPTIMIZED: Fetch recent data points with a smart limit
      // Instead of loading ALL 60K+ data points, fetch the most recent 2500 rows
      // which covers enough data for latest/previous per indicator
      const { data: dataPoints } = await supabase
        .from('data_points')
        .select('indicator_id, value, date, period_type, entity_id')
        .in('indicator_id', indicatorIds)
        .order('date', { ascending: false })
        .limit(2500)

      // Group by indicator_id and take the latest, filtered by the indicator's entity
      const latestByIndicator: Record<string, { value: number; date: string }> = {}
      if (dataPoints) {
        for (const dp of dataPoints) {
          if (!latestByIndicator[dp.indicator_id]) {
            // Only consider data points that match the indicator's entity
            const indicatorEntityId = indicatorEntityMap[dp.indicator_id]
            if (indicatorEntityId) {
              if (dp.entity_id === indicatorEntityId) {
                latestByIndicator[dp.indicator_id] = { value: dp.value, date: dp.date }
              }
            } else {
              if (!dp.entity_id) {
                latestByIndicator[dp.indicator_id] = { value: dp.value, date: dp.date }
              }
            }
          }
        }
      }

      // Get previous data point for change calculation (same entity filter)
      const previousByIndicator: Record<string, { value: number; date: string }> = {}
      if (dataPoints) {
        for (const dp of dataPoints) {
          const latest = latestByIndicator[dp.indicator_id]
          if (latest && dp.date !== latest.date && !previousByIndicator[dp.indicator_id]) {
            const indicatorEntityId = indicatorEntityMap[dp.indicator_id]
            const matchesEntity = indicatorEntityId
              ? dp.entity_id === indicatorEntityId
              : !dp.entity_id

            if (matchesEntity) {
              previousByIndicator[dp.indicator_id] = { value: dp.value, date: dp.date }
            }
          }
        }
      }

      // Enrich indicators with data
      const enriched = indicators.map(ind => {
        const latest = latestByIndicator[ind.id]
        const previous = previousByIndicator[ind.id]
        return {
          ...ind,
          latest_value: latest?.value ?? null,
          latest_date: latest?.date ?? null,
          previous_value: previous?.value ?? null,
          change: latest && previous ? latest.value - previous.value : null,
          change_pct: latest && previous && previous.value !== 0
            ? ((latest.value - previous.value) / Math.abs(previous.value)) * 100
            : null,
        }
      })

      return NextResponse.json({ indicators: enriched })
    }

    return NextResponse.json({ indicators: indicators || [] })
  } catch (err) {
    console.error('Unexpected error in GET /api/observatorio/indicators:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
