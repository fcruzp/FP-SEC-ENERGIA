import { NextRequest, NextResponse } from 'next/server'
import { execFile } from 'child_process'
import { writeFile, unlink, mkdir } from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'

export const dynamic = 'force-dynamic'

// Increase timeout for XLS parsing (can be large files)
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
 * Recibe un archivo XLS en base64, lo guarda temporalmente,
 * ejecuta el parser Python, y retorna los resultados.
 *
 * Body: {
 *   file_data: string (base64 encoded XLS file),
 *   file_name: string,
 *   dry_run?: boolean,
 *   sheet?: string (optional sheet name to parse only that sheet),
 *   mode?: 'full' | 'dry-run' (default: 'full')
 * }
 */
export async function POST(request: NextRequest) {
  const tmpDir = '/tmp/observatorio-uploads'
  let tmpFilePath = ''

  try {
    const { supabaseAdmin } = await import('@/lib/supabase-admin')
    const body = await request.json()

    const fileData = body.file_data
    const fileName = body.file_name
    const dryRun = body.mode === 'dry-run' || body.dry_run === true
    const sheetName = body.sheet || ''

    if (!fileData || !fileName) {
      return NextResponse.json(
        { error: 'Parámetros requeridos: file_data, file_name' },
        { status: 400 }
      )
    }

    // Decode base64 file data
    let base64Data: string
    if (fileData.startsWith('data:')) {
      // Remove data URI prefix (e.g., "data:application/octet-stream;base64,")
      base64Data = fileData.split(',')[1]
    } else {
      base64Data = fileData
    }

    const fileBuffer = Buffer.from(base64Data, 'base64')

    // Ensure tmp directory exists
    await mkdir(tmpDir, { recursive: true })

    // Save to temp file
    const uniqueId = randomUUID()
    tmpFilePath = path.join(tmpDir, `${uniqueId}-${fileName}`)
    await writeFile(tmpFilePath, fileBuffer)

    console.log(`📄 XLS saved to: ${tmpFilePath} (${(fileBuffer.length / 1024).toFixed(1)} KB)`)

    // Verify admin connection
    const { count: indCount, error: indError } = await supabaseAdmin
      .from('indicators')
      .select('*', { count: 'exact', head: true })

    if (indError) {
      throw new Error(`Error de conexión admin: ${indError.message}`)
    }

    console.log(`✅ Admin connection verified (${indCount} indicators in DB)`)

    // Run Python parser
    const parserScript = path.join(process.cwd(), 'download', 'parse_xls_to_supabase.py')
    const args = [
      parserScript,
      tmpFilePath,
      '--batch-size', '500',
    ]
    if (dryRun) {
      args.push('--dry-run')
    }
    if (sheetName) {
      args.push('--sheet', sheetName)
    }

    console.log(`🐍 Running parser: python3 ${args.join(' ')}`)

    const result = await new Promise<{ stdout: string; stderr: string; exitCode: number }>(
      (resolve, reject) => {
        const env = {
          ...process.env,
          NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
          SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
        }

        execFile(
          'python3',
          args,
          {
            timeout: 180000, // 3 minutes max
            maxBuffer: 5 * 1024 * 1024, // 5MB output buffer
            env,
          },
          (error, stdout, stderr) => {
            if (error && !stdout) {
              reject(error)
              return
            }
            resolve({
              stdout: stdout || '',
              stderr: stderr || '',
              exitCode: error ? (error as NodeJS.ErrnoException).code ? 1 : 0 : 0,
            })
          }
        )
      }
    )

    // Parse the output to extract results
    const output = result.stdout
    console.log('🐍 Parser output (last 500 chars):', output.slice(-500))
    if (result.stderr) {
      console.warn('🐍 Parser stderr (last 300 chars):', result.stderr.slice(-300))
    }

    // Extract data_points count from output
    const matchCount = output.match(/Total data_points extraídos:\s*(\d+)/)
    const matchInserted = output.match(/(\d+)\s+data_points insertados exitosamente/)
    const matchRange = output.match(/Rango de fechas:\s*(.+)/)

    const extracted = matchCount ? parseInt(matchCount[1], 10) : 0
    const inserted = matchInserted ? parseInt(matchInserted[1], 10) : 0
    const dateRange = matchRange ? matchRange[1].trim() : ''

    // Clean up temp file
    try {
      await unlink(tmpFilePath)
    } catch {
      // Ignore cleanup errors
    }

    if (dryRun) {
      return NextResponse.json({
        success: true,
        mode: 'dry-run',
        message: `Análisis completado: ${extracted} data_points serían insertados`,
        data_points_extracted: extracted,
        date_range: dateRange,
        parser_output: output.split('\n').slice(-20).join('\n'),
      })
    }

    return NextResponse.json({
      success: true,
      mode: 'full',
      message: `Archivo procesado exitosamente: ${inserted} data_points insertados`,
      data_points_extracted: extracted,
      data_points_inserted: inserted,
      date_range: dateRange,
      file_name: fileName,
      parser_output: output.split('\n').slice(-10).join('\n'),
    })
  } catch (err: unknown) {
    // Clean up temp file on error
    if (tmpFilePath) {
      try {
        await unlink(tmpFilePath)
      } catch {
        // Ignore
      }
    }

    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Error in POST /api/admin/parse-xls:', err)
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: 500 })
  }
}
