import { NextRequest, NextResponse } from 'next/server'
import { parseXls } from '@/lib/parse-xls'

export const dynamic = 'force-dynamic'

// Increase timeout for XLS parsing
export const maxDuration = 120

/**
 * GET /api/admin/parse-xls/status
 * Verifica que la service_role key esté configurada.
 */
export async function GET() {
  try {
    const { supabaseAdmin } = await import('@/lib/supabase-admin')

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
 * Recibe un archivo XLS en base64, lo parsea con el parser TypeScript
 * (Netlify-compatible), y genera data_points en Supabase.
 *
 * Body: {
 *   file_data: string (base64 encoded XLS file),
 *   file_name: string,
 *   mode?: 'full' | 'dry-run' (default: 'full')
 *   sheet?: string (optional sheet name to parse only that sheet)
 *   date_from?: string (YYYY-MM-DD — filter date columns from this date)
 *   date_to?: string (YYYY-MM-DD — filter date columns up to this date)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const fileData = body.file_data
    const fileName = body.file_name
    const dryRun = body.mode === 'dry-run'
    const sheetName = body.sheet || undefined
    const dateFrom = body.date_from || undefined
    const dateTo = body.date_to || undefined

    if (!fileData || !fileName) {
      return NextResponse.json(
        { error: 'Parámetros requeridos: file_data, file_name' },
        { status: 400 }
      )
    }

    // Decode base64 file data
    let base64Data: string
    if (fileData.startsWith('data:')) {
      base64Data = fileData.split(',')[1]
    } else {
      base64Data = fileData
    }

    const fileBuffer = Buffer.from(base64Data, 'base64')
    console.log(`📄 XLS received: ${fileName} (${(fileBuffer.length / 1024).toFixed(1)} KB)`)

    // Run TypeScript parser (Netlify-compatible!)
    const result = await parseXls(fileBuffer, fileName, {
      dryRun,
      sheetName,
      batchSize: 500,
      dateFrom,
      dateTo,
    })

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || 'Error al procesar el archivo',
      }, { status: 500 })
    }

    if (dryRun) {
      return NextResponse.json({
        success: true,
        mode: 'dry-run',
        message: `Análisis completado: ${result.data_points_extracted} data_points serían insertados (${result.date_columns_filtered}/${result.date_columns_total} meses)`,
        data_points_extracted: result.data_points_extracted,
        data_points_inserted: 0,
        date_range: result.date_range,
        date_columns_filtered: result.date_columns_filtered,
        date_columns_total: result.date_columns_total,
        unmatched_indicators: result.unmatched_indicators,
      })
    }

    return NextResponse.json({
      success: true,
      mode: 'full',
      message: `Archivo procesado exitosamente: ${result.data_points_inserted} data_points insertados de ${result.data_points_extracted} extraídos (${result.date_columns_filtered}/${result.date_columns_total} meses)`,
      data_points_extracted: result.data_points_extracted,
      data_points_inserted: result.data_points_inserted,
      date_range: result.date_range,
      date_columns_filtered: result.date_columns_filtered,
      date_columns_total: result.date_columns_total,
      file_name: fileName,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Error in POST /api/admin/parse-xls:', err)
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: 500 })
  }
}
