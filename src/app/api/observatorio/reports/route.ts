import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * GET /api/observatorio/reports
 * Lista informes publicados.
 * Query params:
 *   - phase — filtrar por fase (ej: "desempeno_eee")
 *   - file_type — filtrar por tipo (pdf, xls, xlsx, csv)
 *   - limit — máximo resultados (default 20)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const phase = searchParams.get('phase')
    const fileType = searchParams.get('file_type')
    const limitParam = searchParams.get('limit')

    let query = supabase
      .from('reports')
      .select('*')
      .eq('is_published', true)
      .order('publish_date', { ascending: false })

    if (phase) {
      query = query.eq('phase', phase)
    }
    if (fileType) {
      query = query.eq('file_type', fileType)
    }

    const limit = limitParam ? parseInt(limitParam, 10) : 20
    query = query.limit(Math.min(limit, 100))

    const { data: reports, error } = await query

    if (error) {
      console.error('Error fetching reports:', error)
      return NextResponse.json({ error: 'Error al obtener informes' }, { status: 500 })
    }

    return NextResponse.json({ reports: reports || [] })
  } catch (err) {
    console.error('Unexpected error in GET /api/observatorio/reports:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
