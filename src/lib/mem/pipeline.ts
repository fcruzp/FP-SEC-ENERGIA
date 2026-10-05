/**
 * Pasos de una carga del Informe de Desempeño, sin E/S: extracción del Excel,
 * comparación con el catálogo versionado y verificaciones. Los usan
 * scripts/mem-load.ts, las pruebas y (más adelante) el panel /admin.
 */
import { readSheet, readWorkbook } from './workbook'
import { buildSheetCatalog, MEM_SHEETS, resolveSheetName, type CatalogEntry, type CatalogRow } from './catalog'
import { checkAccumulated, checkAnnualTotals, checkCoverage, checkEdeBreakdowns, checkLineRelations, type CheckResult } from './reconcile'
import { ANNEX_SHEET, readFinancialAnnex, type LineRelation } from './annex-financial'
import type { CellValue } from './workbook'

export const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

/** "Informe-de-Desempeno-Anexos._-julio-2026.xlsx" → "2026-07-01" */
export function editionFromFilename(name: string): string {
  const m = new RegExp(`(${MONTHS.join('|')})[^0-9]*(\\d{4})`, 'i').exec(name)
  if (!m) throw new Error(`No se pudo deducir la edición (mes y año) del nombre "${name}"`)
  return `${m[2]}-${String(MONTHS.indexOf(m[1].toLowerCase()) + 1).padStart(2, '0')}-01`
}

export interface SheetSummary { sheet: string; actualName: string; indicators: number; firstMonth: string; lastMonth: string }

/** Lee el Excel y construye el catálogo con los valores de cada fila. */
export interface Extraction {
  rows: CatalogRow[]
  sheets: SheetSummary[]
  /** Relaciones contables del anexo financiero (totales y balances) */
  relations: LineRelation[]
  /** Columna "Acumulado" del anexo financiero */
  accumulated: Map<string, CellValue>
}

export function extractWorkbook(data: ArrayBuffer | Buffer): Extraction {
  const wb = readWorkbook(data)
  const rows: CatalogRow[] = []
  const sheets: SheetSummary[] = []
  for (const config of MEM_SHEETS) {
    const actualName = resolveSheetName(wb.SheetNames, config)
    const sheet = readSheet(wb, actualName)
    const sheetRows = buildSheetCatalog(config, sheet)
    rows.push(...sheetRows)
    sheets.push({
      sheet: config.sheet,
      actualName,
      indicators: sheetRows.length,
      firstMonth: sheet.months[0],
      lastMonth: sheet.months[sheet.months.length - 1],
    })
  }
  // Anexo de resultados financieros (meses del año en curso)
  const annex = readFinancialAnnex(wb, ANNEX_SHEET, rows.length + 1)
  rows.push(...annex.rows)
  const annexMonths = annex.rows.flatMap(r => [...r.source.monthly.keys()]).sort()
  sheets.push({
    sheet: ANNEX_SHEET,
    actualName: ANNEX_SHEET,
    indicators: annex.rows.length,
    firstMonth: annexMonths[0],
    lastMonth: annexMonths[annexMonths.length - 1],
  })
  return { rows, sheets, relations: annex.relations, accumulated: annex.accumulated }
}

/** Campos del catálogo que deben mantenerse estables entre ediciones. */
const stable = (e: CatalogEntry) => ({
  slug: e.slug, name: e.name, unit: e.unit, sheet: e.sheet, label: e.label, category: e.category,
  entity: e.entity, parent: e.parent, scale: e.scale, chart: e.chart, note: e.note ?? null,
})

/** Diferencias entre el catálogo generado y el versionado (vacío = idénticos). */
export function compareCatalog(current: CatalogEntry[], expected: CatalogEntry[]): string[] {
  const diffs: string[] = []
  const exp = new Map(expected.map(e => [e.slug, e]))
  const cur = new Map(current.map(e => [e.slug, e]))
  for (const [slug, e] of cur) {
    const x = exp.get(slug)
    if (!x) { diffs.push(`+ nuevo: ${slug} (${e.sheet}!B${e.row} "${e.label}")`); continue }
    const a = JSON.stringify(stable(e)), b = JSON.stringify(stable(x))
    if (a !== b) diffs.push(`~ cambia: ${slug}\n    antes: ${b}\n    ahora: ${a}`)
  }
  for (const slug of exp.keys()) if (!cur.has(slug)) diffs.push(`- falta: ${slug}`)
  // El orden de las filas también forma parte del contrato
  const order = (list: CatalogEntry[]) => list.map(e => e.slug).join('|')
  if (!diffs.length && order(current) !== order(expected)) diffs.push('~ cambió el orden de las filas')
  return diffs
}

export interface KnownAnomaly { check: string; key: string; explanation: string }

export interface CheckOutcome {
  result: CheckResult
  known: KnownAnomaly[]
  unexpected: string[]
  ok: boolean
}

/** Ejecuta las verificaciones; una diferencia no registrada como anomalía conocida hace fallar la carga. */
export function runChecks(extraction: Extraction, known: KnownAnomaly[]): { outcomes: CheckOutcome[]; ok: boolean } {
  const { rows } = extraction
  const results = [
    checkCoverage(rows),
    checkAnnualTotals(rows),
    checkEdeBreakdowns(rows),
    checkLineRelations(rows, extraction.relations),
    checkAccumulated(rows, extraction.accumulated),
  ]
  const outcomes = results.map(result => {
    const knownHere = known.filter(k => k.check === result.check && result.keys.includes(k.key))
    const unexpected = result.keys.filter(key => !knownHere.some(k => k.key === key))
    return { result, known: knownHere, unexpected, ok: unexpected.length === 0 }
  })
  return { outcomes, ok: outcomes.every(o => o.ok) }
}

/** Valores mensuales listos para guardar (con la escala aplicada). */
export function toPoints(rows: CatalogRow[]) {
  return rows.flatMap(({ entry, source }) =>
    [...source.monthly].map(([date, v]) => ({
      slug: entry.slug,
      date,
      value: Math.round(v.value * entry.scale * 1e6) / 1e6,
      cell: v.cell,
    })))
}
