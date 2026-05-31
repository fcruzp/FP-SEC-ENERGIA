import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * GET /api/observatorio/entities
 * Lista todas las entidades del sector eléctrico.
 */
export async function GET() {
  try {
    const { data: entities, error } = await supabase
      .from('entities')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching entities:', error)
      return NextResponse.json({ error: 'Error al obtener entidades' }, { status: 500 })
    }

    return NextResponse.json({ entities: entities || [] })
  } catch (err) {
    console.error('Unexpected error in GET /api/observatorio/entities:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
