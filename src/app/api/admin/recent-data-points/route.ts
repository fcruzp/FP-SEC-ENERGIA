import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/recent-data-points
 * Obtiene los data points más recientes para el panel admin.
 * Query params:
 *   - limit — máximo de puntos (default 20, max 100)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get('limit')
    const limit = Math.min(Math.max(parseInt(limitParam || '20', 10) || 20, 1), 100)

    // Fetch recent data points with indicator and entity info
    const { data: dataPoints, error } = await supabase
      .from('data_points')
      .select(`
        id,
        value,
        date,
        period_type,
        source_file,
        is_estimated,
        created_at,
        indicator:indicators(id, name, unit, slug),
        entity:entities(id, name, slug)
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching recent data points:', error)
      return NextResponse.json({ error: 'Error al obtener datos recientes' }, { status: 500 })
    }

    // Get total count for stats
    const { count: totalCount } = await supabase
      .from('data_points')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({
      data_points: dataPoints || [],
      total_count: totalCount || 0,
    })
  } catch (err) {
    console.error('Unexpected error in GET /api/admin/recent-data-points:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
