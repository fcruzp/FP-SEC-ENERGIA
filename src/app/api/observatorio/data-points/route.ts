import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import type { DataPoint } from '@/lib/supabase-types'

export const dynamic = 'force-dynamic'

/**
 * GET /api/observatorio/data-points
 * Obtiene series de datos temporales.
 * Query params:
 *   - indicator_slug (requerido) — slug del indicador
 *   - entity_slug — filtrar por entidad
 *   - from — fecha inicio (YYYY-MM-DD)
 *   - to — fecha fin (YYYY-MM-DD)
 *   - period_type — "monthly" | "quarterly" | "yearly"
 *   - limit — máximo de puntos a retornar
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const indicatorSlug = searchParams.get('indicator_slug')
    const entitySlug = searchParams.get('entity_slug')
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const periodType = searchParams.get('period_type')
    const limitParam = searchParams.get('limit')

    if (!indicatorSlug) {
      return NextResponse.json(
        { error: 'Parámetro requerido: indicator_slug' },
        { status: 400 }
      )
    }

    // Resolve indicator slug to ID
    const { data: indicator, error: indError } = await supabase
      .from('indicators')
      .select('id, name, unit, chart_type')
      .eq('slug', indicatorSlug)
      .eq('is_active', true)
      .single()

    if (indError || !indicator) {
      return NextResponse.json(
        { error: `Indicador no encontrado: ${indicatorSlug}` },
        { status: 404 }
      )
    }

    // Build query
    let query = supabase
      .from('data_points')
      .select('*')
      .eq('indicator_id', indicator.id)
      .order('date', { ascending: true })

    // Filter by entity
    if (entitySlug) {
      const { data: entity } = await supabase
        .from('entities')
        .select('id')
        .eq('slug', entitySlug)
        .single()

      if (entity) {
        query = query.eq('entity_id', entity.id)
      }
    }

    // Date range
    if (from) {
      query = query.gte('date', from)
    }
    if (to) {
      query = query.lte('date', to)
    }

    // Period type
    if (periodType) {
      query = query.eq('period_type', periodType)
    }

    // Limit
    if (limitParam) {
      const limit = parseInt(limitParam, 10)
      if (!isNaN(limit) && limit > 0) {
        query = query.limit(limit)
      }
    }

    const { data: dataPoints, error: dpError } = await query

    if (dpError) {
      console.error('Error fetching data points:', dpError)
      return NextResponse.json({ error: 'Error al obtener datos' }, { status: 500 })
    }

    return NextResponse.json({
      indicator: {
        id: indicator.id,
        name: indicator.name,
        unit: indicator.unit,
        chart_type: indicator.chart_type,
      },
      data_points: dataPoints || [],
      count: (dataPoints || []).length,
    })
  } catch (err) {
    console.error('Unexpected error in GET /api/observatorio/data-points:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
