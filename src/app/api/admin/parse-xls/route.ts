import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/parse-xls/status
 * Verifica que la service_role key esté configurada.
 */
export async function GET() {
  try {
    // Dynamically import to avoid bundling service_role key in client
    const { supabaseAdmin } = await import('@/lib/supabase-admin')

    // Test connection by counting indicators
    const { count, error } = await supabaseAdmin
      .from('indicators')
      .select('*', { count: 'exact', head: true })

    if (error) {
      console.error('Admin connection test failed:', error)
      return NextResponse.json({
        status: 'error',
        message: 'Error de conexión con Supabase (service_role)',
        error: error.message,
      }, { status: 500 })
    }

    return NextResponse.json({
      status: 'ok',
      message: 'Conexión admin configurada correctamente',
      indicator_count: count,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Admin status check failed:', err)

    if (message.includes('SUPABASE_SERVICE_ROLE_KEY')) {
      return NextResponse.json({
        status: 'not_configured',
        message: 'SUPABASE_SERVICE_ROLE_KEY no está configurada en .env.local',
      }, { status: 503 })
    }

    return NextResponse.json({ status: 'error', message }, { status: 500 })
  }
}

/**
 * POST /api/admin/parse-xls
 * Parsea un archivo XLS y genera data_points.
 * Body: { file_url: string, file_name: string }
 *
 * NOTA: Este endpoint será expandido en el PASO 5 (Backoffice Upload XLS + Parser).
 * Por ahora es un placeholder que verifica permisos.
 */
export async function POST(request: NextRequest) {
  try {
    const { supabaseAdmin } = await import('@/lib/supabase-admin')
    const body = await request.json()

    const fileUrl = body.file_url
    const fileName = body.file_name

    if (!fileUrl || !fileName) {
      return NextResponse.json(
        { error: 'Parámetros requeridos: file_url, file_name' },
        { status: 400 }
      )
    }

    // TODO: Implement XLS parsing logic in PASO 5
    return NextResponse.json({
      message: 'Parser XLS será implementado en PASO 5',
      file_url: fileUrl,
      file_name: fileName,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Error in POST /api/admin/parse-xls:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
