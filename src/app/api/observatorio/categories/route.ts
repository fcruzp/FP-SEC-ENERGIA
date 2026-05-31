import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import type { CategoryWithIndicators } from '@/lib/supabase-types'

export const dynamic = 'force-dynamic'

/**
 * GET /api/observatorio/categories
 * Lista todas las categorías con conteo de indicadores.
 * Query params:
 *   - with_indicators=true — incluye los indicadores de cada categoría
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const withIndicators = searchParams.get('with_indicators') === 'true'

    // Fetch categories ordered by sort_order
    const { data: categories, error } = await supabase
      .from('indicator_categories')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching categories:', error)
      return NextResponse.json({ error: 'Error al obtener categorías' }, { status: 500 })
    }

    // If no indicators needed, just add count
    if (!withIndicators) {
      // Get indicator counts per category
      const { data: counts } = await supabase
        .from('indicators')
        .select('category_id')
        .eq('is_active', true)
        .eq('is_breakdown', false)

      const countMap: Record<string, number> = {}
      if (counts) {
        for (const row of counts) {
          countMap[row.category_id] = (countMap[row.category_id] || 0) + 1
        }
      }

      const result: CategoryWithIndicators[] = (categories || []).map(cat => ({
        ...cat,
        indicators: [],
        indicator_count: countMap[cat.id] || 0,
      }))

      return NextResponse.json({ categories: result })
    }

    // With indicators — fetch them grouped
    const { data: indicators, error: indError } = await supabase
      .from('indicators')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (indError) {
      console.error('Error fetching indicators:', indError)
      return NextResponse.json({ error: 'Error al obtener indicadores' }, { status: 500 })
    }

    // Group indicators by category
    const indicatorsByCategory: Record<string, typeof indicators> = {}
    if (indicators) {
      for (const ind of indicators) {
        if (!indicatorsByCategory[ind.category_id]) {
          indicatorsByCategory[ind.category_id] = []
        }
        indicatorsByCategory[ind.category_id].push(ind)
      }
    }

    const result: CategoryWithIndicators[] = (categories || []).map(cat => ({
      ...cat,
      indicators: indicatorsByCategory[cat.id] || [],
      indicator_count: (indicatorsByCategory[cat.id] || []).filter(i => !i.is_breakdown).length,
    }))

    return NextResponse.json({ categories: result })
  } catch (err) {
    console.error('Unexpected error in GET /api/observatorio/categories:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
