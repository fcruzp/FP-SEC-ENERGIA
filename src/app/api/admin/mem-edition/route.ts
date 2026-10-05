import { createHash } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { Client } from 'pg'
import catalogFile from '../../../../../data/mem/catalogo.json'
import knownFile from '../../../../../data/mem/anomalias-conocidas.json'
import type { CatalogEntry } from '@/lib/mem/catalog'
import { compareCatalog, editionFromFilename, extractWorkbook, runChecks, toPoints, type KnownAnomaly } from '@/lib/mem/pipeline'
import { writeEdition } from '@/lib/mem/load-db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const MAX_SIZE = 15 * 1024 * 1024

/**
 * POST /api/admin/mem-edition (protegida por src/proxy.ts)
 * Valida o carga una edición del Informe de Desempeño del MEM con el mismo
 * parser y las mismas verificaciones que scripts/mem-load.ts.
 *
 * multipart/form-data:
 *   file        Excel del MEM (nombre original, p. ej. "Informe-de-Desempeno-Anexos._-agosto-2026.xlsx")
 *   mode        "validate" (por defecto) | "load"
 *   source_url  enlace oficial del Excel en mem.gob.do (opcional)
 *   pdf_url     enlace oficial del PDF de la misma edición (opcional)
 */
export async function POST(request: NextRequest) {
  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Se esperaba un formulario con el archivo.' }, { status: 400 })
  }
  const file = form.get('file')
  if (!(file instanceof File)) return NextResponse.json({ error: 'Falta el archivo.' }, { status: 400 })
  if (!/\.xlsx$/i.test(file.name)) return NextResponse.json({ error: 'El archivo debe ser .xlsx.' }, { status: 400 })
  if (file.size > MAX_SIZE) return NextResponse.json({ error: 'El archivo supera 15 MB.' }, { status: 400 })
  const mode = form.get('mode') === 'load' ? 'load' : 'validate'
  const urlField = (name: string) => {
    const v = String(form.get(name) ?? '').trim()
    if (!v) return null
    if (!/^https:\/\/(www\.)?mem\.gob\.do\//i.test(v)) throw new Error(`El enlace "${name}" debe ser de mem.gob.do`)
    return v
  }

  try {
    const sourceUrl = urlField('source_url')
    const pdfUrl = urlField('pdf_url')
    const buffer = Buffer.from(await file.arrayBuffer())
    const edition = editionFromFilename(file.name)

    // 1. Estructura y catálogo
    const extraction = extractWorkbook(buffer)
    const catalog = extraction.rows.map(r => r.entry)
    const catalogDiffs = compareCatalog(catalog, catalogFile as CatalogEntry[])
    const editionMismatch = extraction.snapshotMonth !== edition
      ? `La foto de deuda del Excel es de ${extraction.snapshotMonth}, pero el nombre del archivo indica la edición ${edition}.`
      : null

    // 2. Verificaciones
    const { outcomes, ok: checksOk } = runChecks(extraction, knownFile as KnownAnomaly[])
    const points = toPoints(extraction.rows)
    const latest = points.reduce((max, p) => (p.date > max ? p.date : max), '')

    const report = {
      file: file.name,
      size: file.size,
      edition,
      latest_month: latest,
      values: points.length,
      indicators: catalog.length,
      sheets: extraction.sheets,
      notes: extraction.notes,
      catalog_diffs: catalogDiffs.slice(0, 50),
      catalog_diff_count: catalogDiffs.length,
      edition_mismatch: editionMismatch,
      checks: outcomes.map(o => ({
        check: o.result.check,
        description: o.result.description,
        compared: o.result.compared,
        mismatches: o.result.mismatches,
        ok: o.ok,
        samples: o.ok ? [] : o.result.samples,
        known: o.known.map(k => ({ key: k.key, explanation: k.explanation })),
      })),
    }
    const canLoad = checksOk && catalogDiffs.length === 0 && !editionMismatch

    if (mode === 'validate') return NextResponse.json({ ...report, can_load: canLoad })
    if (!canLoad) return NextResponse.json({ ...report, can_load: false, error: 'La validación no pasó; no se cargó nada.' }, { status: 422 })

    // 3. Carga (misma escritura que el script)
    if (!process.env.SUPABASE_DB_URL) {
      return NextResponse.json({ error: 'Falta SUPABASE_DB_URL en el servidor: no se puede cargar desde el panel.' }, { status: 500 })
    }
    const db = new Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } })
    await db.connect()
    try {
      const stats = await writeEdition(db, catalog, points, outcomes.map(o => o.result), {
        edition,
        sourceFile: file.name,
        sourceUrl,
        pdfUrl,
        sha256: createHash('sha256').update(buffer).digest('hex'),
        fileSize: file.size,
      })
      return NextResponse.json({ ...report, can_load: true, loaded: true, stats })
    } finally {
      await db.end()
    }
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error al procesar el archivo' }, { status: 422 })
  }
}
