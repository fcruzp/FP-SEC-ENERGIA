/**
 * Carga una edición del "Informe de Desempeño de las Empresas Eléctricas
 * Estatales" (MEM) en la base de datos.
 *
 * Uso (con bun):
 *   bun scripts/mem-load.ts --file data/mem/<archivo>.xlsx --source-url <url> [--pdf-url <url>] [--published AAAA-MM-DD]
 *   bun scripts/mem-load.ts --file ... --dry-run          # solo verifica, no escribe
 *   bun scripts/mem-load.ts --file ... --accept-catalog   # acepta cambios de estructura del Excel
 *
 * Garantías:
 *   - El catálogo generado debe coincidir con data/mem/catalogo.json (versionado en git).
 *   - Verificaciones de conciliación antes de escribir; si fallan, no se escribe nada.
 *   - Todo se escribe en una transacción: o se carga completo o no se carga.
 *   - Cada valor guarda su edición, hoja y celda de origen; los cambios respecto
 *     a la edición anterior quedan en data_point_revisions.
 * La escritura es la misma que usa el panel /admin (src/lib/mem/load-db.ts).
 */
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Client } from 'pg'
import { compareCatalog, editionFromFilename, extractWorkbook, runChecks, toPoints, type KnownAnomaly } from '../src/lib/mem/pipeline'
import { writeEdition } from '../src/lib/mem/load-db'

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..')
const CATALOG_FILE = resolve(ROOT, 'data/mem/catalogo.json')
const KNOWN_FILE = resolve(ROOT, 'data/mem/anomalias-conocidas.json')

// ── Argumentos ──
const args = process.argv.slice(2)
const arg = (name: string) => {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : undefined
}
const file = arg('--file')
const sourceUrl = arg('--source-url') ?? null
const pdfUrl = arg('--pdf-url') ?? null
const publishedAt = arg('--published') ?? null // fecha de publicación del MEM, AAAA-MM-DD
if (publishedAt && !/^\d{4}-\d{2}-\d{2}$/.test(publishedAt)) {
  console.error('--published debe tener el formato AAAA-MM-DD')
  process.exit(1)
}
const dryRun = args.includes('--dry-run')
const acceptCatalog = args.includes('--accept-catalog')
if (!file) {
  console.error('Uso: bun scripts/mem-load.ts --file <xlsx> --source-url <url> [--pdf-url <url>] [--dry-run] [--accept-catalog]')
  process.exit(1)
}

// ── Entorno ──
for (const line of readFileSync(resolve(ROOT, '.env.local'), 'utf-8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^"|"$/g, '')
}

async function main() {
  const filePath = resolve(ROOT, file!)
  const buffer = readFileSync(filePath)
  const sha256 = createHash('sha256').update(buffer).digest('hex')
  const sourceFile = basename(filePath)
  const edition = editionFromFilename(sourceFile)
  console.log(`📄 ${sourceFile}\n   edición ${edition} · sha256 ${sha256.slice(0, 16)}…`)

  // ── 1. Estructura y catálogo ──
  const extraction = extractWorkbook(buffer)
  const { rows, sheets } = extraction
  for (const s of sheets) {
    const alias = s.actualName !== s.sheet ? ` (hoja "${s.actualName}")` : ''
    console.log(`   ${s.sheet.padEnd(22)} ${String(s.indicators).padStart(3)} indicadores · ${s.firstMonth} → ${s.lastMonth}${alias}`)
  }
  extraction.notes.forEach(n => console.log(`   ℹ️  ${n}`))
  if (extraction.snapshotMonth !== edition) {
    console.error(`\n❌ La foto de deuda del Excel es de ${extraction.snapshotMonth}, pero el archivo dice ser la edición ${edition}.`)
    process.exit(4)
  }
  const catalog = rows.map(r => r.entry)

  if (!existsSync(CATALOG_FILE) || acceptCatalog) {
    writeFileSync(CATALOG_FILE, JSON.stringify(catalog, null, 2) + '\n')
    console.log(`📝 Catálogo escrito en data/mem/catalogo.json (${catalog.length} indicadores). Revísalo y versiónalo en git.`)
  } else {
    const diffs = compareCatalog(catalog, JSON.parse(readFileSync(CATALOG_FILE, 'utf-8')))
    if (diffs.length) {
      console.error(`\n❌ La estructura del Excel no coincide con data/mem/catalogo.json (${diffs.length} diferencias):`)
      diffs.slice(0, 40).forEach(d => console.error('   ' + d))
      console.error('\nRevisa los cambios. Si son correctos, vuelve a ejecutar con --accept-catalog.')
      process.exit(2)
    }
    console.log(`✅ Catálogo idéntico al versionado (${catalog.length} indicadores)`)
  }

  // ── 2. Verificaciones ──
  const known: KnownAnomaly[] = existsSync(KNOWN_FILE) ? JSON.parse(readFileSync(KNOWN_FILE, 'utf-8')) : []
  const { outcomes, ok: checksOk } = runChecks(extraction, known)
  const checks = outcomes.map(o => o.result)
  console.log('\n🔎 Verificaciones')
  for (const { result: c, known: knownHere, ok } of outcomes) {
    const knownNote = knownHere.length ? ` (${knownHere.length} anomalías conocidas de la fuente)` : ''
    console.log(`   ${ok ? '✅' : '❌'} ${c.check}: ${c.compared} comparaciones, ${c.mismatches} diferencias${knownNote} — ${c.description}`)
    if (!ok) c.samples.forEach(s => console.log(`      · ${s}`))
    knownHere.forEach(k => console.log(`      ℹ️  ${k.key}: ${k.explanation}`))
  }

  const points = toPoints(rows)
  const latest = points.reduce((max, p) => (p.date > max ? p.date : max), '')
  console.log(`\n📊 ${points.length.toLocaleString('es-DO')} valores mensuales · último mes ${latest}`)
  const nonNumeric = rows.reduce((s, r) => s + r.source.nonNumeric, 0)
  if (nonNumeric) console.log(`   ℹ️  ${nonNumeric} celdas mensuales con texto (p. ej. "-") se omitieron`)

  if (!checksOk) {
    console.error('\n❌ Hay verificaciones con diferencias. No se escribe nada en la base de datos.')
    process.exit(3)
  }
  if (dryRun) {
    console.log('\n🔧 Modo prueba: no se escribió nada.')
    return
  }

  // ── 3. Escritura transaccional ──
  const db = new Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } })
  await db.connect()
  try {
    const stats = await writeEdition(db, catalog, points, checks, {
      edition, sourceFile, sourceUrl, pdfUrl, sha256, fileSize: buffer.length, publishedAt,
    })
    console.log('\n✅ Carga completada')
    console.log(`   ${stats.indicators} indicadores · ${stats.values.toLocaleString('es-DO')} valores · último mes ${stats.latest_month}`)
    console.log(`   ${stats.inserted.toLocaleString('es-DO')} valores nuevos · ${stats.revisions} valores revisados respecto a la edición anterior · ${stats.unchanged.toLocaleString('es-DO')} sin cambios · ${stats.removed_indicators} indicadores obsoletos eliminados`)
  } catch (err) {
    console.error('\n❌ Error; no se escribió nada:', (err as Error).message)
    process.exitCode = 1
  } finally {
    await db.end()
  }
}

main()
