/**
 * Hojas de tarifas del Informe de Desempeño (MEM): "Regimen tarifario anterior"
 * (mensual, jul-2013 → dic-2019) y "Nuevo Regimen tarifario" (por períodos, desde 2020).
 *
 * Se construye una serie mensual continua por concepto tarifario, tipo de tarifa y EDE:
 *  - Aplicada: la que se cobra. Hasta oct-2021 fue única para las tres EDEs.
 *  - Referencia: la que cubriría los costos ("indexada" hasta oct-2021; en el régimen
 *    anterior, única para las tres EDEs).
 * Los períodos (trimestres, un mes, dos meses) se expanden a los meses que cubren,
 * sin pasar del mes de la edición. Si dos períodos se solapan deben tener valores
 * idénticos; si no, la carga se detiene.
 */
import * as XLSX from 'xlsx'
import type { CatalogEntry, CatalogRow } from './catalog'
import { normalizeLabel, type CellValue, type SheetRow } from './workbook'

export const NEW_TARIFF_SHEET = 'Nuevo Regimen tarifario'
export const OLD_TARIFF_SHEET = 'Regimen tarifario anterior'
const CATEGORY = 'regimen-tarifario'
const MONTH_ABBR = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

interface Concept { code: string; label: string; key: string; name: string; unit: string }

const ENERGY_BLOCKS: [string, string, string][] = [
  ['(i) Los primeros kwh entre 0 y 200', 'energia-0-200', 'Energía, 0–200 kWh'],
  ['(ii) Los siguientes kwh entre 201 y 300', 'energia-201-300', 'Energía, 201–300 kWh'],
  ['(iii) Los siguientes kwh entre 301 y 700', 'energia-301-700', 'Energía, 301–700 kWh'],
  ['(iv) Consumo de 701 kwh o mayor, todos los kwh a', 'energia-701', 'Energía, desde 701 kWh (todos los kWh)'],
]
const C = (code: string, label: string, key: string, name: string, unit: string): Concept => ({ code, label, key, name, unit })
const FIXED = 'RD$/mes', ENERGY = 'RD$/kWh', POWER = 'RD$/kW-mes'

/** Conceptos en el orden del Excel (filas con valores; los subtítulos terminados en ":" se omiten). */
const CONCEPTS: Concept[] = [
  C('BTS1', '(i) Consumo mensual de 0 hasta 100 kwh', 'cargo-fijo-0-100', 'Cargo fijo, consumo de 0 a 100 kWh', FIXED),
  C('BTS1', '(ii) Consumo mensual de 101 kwh en adelante', 'cargo-fijo-101', 'Cargo fijo, consumo desde 101 kWh', FIXED),
  ...ENERGY_BLOCKS.map(([label, key, name]) => C('BTS1', label, key, name, ENERGY)),
  C('BTS2', 'Cargo Fijo', 'cargo-fijo', 'Cargo fijo', FIXED),
  ...ENERGY_BLOCKS.map(([label, key, name]) => C('BTS2', label, key, name, ENERGY)),
  C('BTD', 'Cargo Fijo', 'cargo-fijo', 'Cargo fijo', FIXED),
  C('BTD', 'Energía', 'energia', 'Energía', ENERGY),
  C('BTD', 'Potencia Máxima', 'potencia', 'Potencia máxima', POWER),
  C('BTH', 'Cargo Fijo', 'cargo-fijo', 'Cargo fijo', FIXED),
  C('BTH', 'Energía', 'energia', 'Energía', ENERGY),
  C('BTH', 'Potencia Máxima fuera de punta', 'potencia-fuera-punta', 'Potencia máxima fuera de punta', POWER),
  C('BTH', 'Potencia Máxima en horas de punta', 'potencia-punta', 'Potencia máxima en horas de punta', POWER),
  C('MTD1', 'Cargo Fijo', 'cargo-fijo', 'Cargo fijo', FIXED),
  C('MTD1', 'Energía', 'energia', 'Energía', ENERGY),
  C('MTD1', 'Potencia Máxima', 'potencia', 'Potencia máxima', POWER),
  C('MTD2', 'Cargo Fijo', 'cargo-fijo', 'Cargo fijo', FIXED),
  C('MTD2', 'Energía', 'energia', 'Energía', ENERGY),
  C('MTD2', 'Potencia Máxima', 'potencia', 'Potencia máxima', POWER),
  C('MTH', 'Cargo Fijo', 'cargo-fijo', 'Cargo fijo', FIXED),
  C('MTH', 'Energía', 'energia', 'Energía', ENERGY),
  C('MTH', 'Potencia Máxima fuera de punta', 'potencia-fuera-punta', 'Potencia máxima fuera de punta', POWER),
  C('MTH', 'Potencia Máxima en horas de punta', 'potencia-punta', 'Potencia máxima en horas de punta', POWER),
]

const EDES = [
  { key: 'edenorte', label: 'Edenorte' },
  { key: 'edesur', label: 'Edesur' },
  { key: 'edeeste', label: 'Edeeste' },
]
const KINDS = [
  { key: 'aplicada', label: 'Aplicada' },
  { key: 'referencia', label: 'Referencia' },
] as const
type Kind = (typeof KINDS)[number]['key']

const NOTE =
  'Tarifa vigente en cada mes, en RD$. "Aplicada": la que se cobra al usuario (hasta octubre 2021, única para las tres EDEs). ' +
  '"Referencia": la que cubriría los costos de abastecimiento (llamada "indexada" hasta octubre 2021; única para las tres EDEs en el régimen anterior a 2020). ' +
  'Las tarifas por trimestre se repiten en cada mes del trimestre.'

const seriesKey = (concept: Concept, kind: Kind, ede: string) => `${concept.code}|${concept.key}|${kind}|${ede}`

export interface TariffResult {
  rows: CatalogRow[]
  /** Períodos solapados verificados como idénticos (para el informe de la carga) */
  overlaps: string[]
}

/** Primer mes y último mes de un período del régimen nuevo ("Ene - Mar 2020", "Oct-21", "Nov - Dic 21"). */
function parsePeriod(cell: XLSX.CellObject): { from: string; to: string } {
  if (cell.t === 'n') {
    const d = XLSX.SSF.parse_date_code(cell.v as number)
    const m = `${d.y}-${String(d.m).padStart(2, '0')}-01`
    return { from: m, to: m }
  }
  const text = normalizeLabel(cell.v).toLowerCase()
  const match = /^([a-zñ]{3})[a-z]*\s*-\s*([a-zñ]{3})[a-z]*\.?\s*(\d{2}|\d{4})$/.exec(text)
  if (!match) throw new Error(`Tarifas: período no reconocido "${normalizeLabel(cell.v)}"`)
  const [a, b] = [MONTH_ABBR.indexOf(match[1]), MONTH_ABBR.indexOf(match[2])]
  if (a < 0 || b < 0 || b < a) throw new Error(`Tarifas: período no reconocido "${normalizeLabel(cell.v)}"`)
  const year = match[3].length === 2 ? 2000 + Number(match[3]) : Number(match[3])
  const ym = (m: number) => `${year}-${String(m + 1).padStart(2, '0')}-01`
  return { from: ym(a), to: ym(b) }
}

function monthsBetween(from: string, to: string): string[] {
  const out: string[] = []
  let [y, m] = from.split('-').map(Number)
  const [ty, tm] = to.split('-').map(Number)
  while (y < ty || (y === ty && m <= tm)) {
    out.push(`${y}-${String(m).padStart(2, '0')}-01`)
    m++
    if (m > 12) { m = 1; y++ }
  }
  return out
}

export function readTariffs(wb: XLSX.WorkBook, lastMonth: string, startOrder: number): TariffResult {
  const series = new Map<string, Map<string, CellValue>>()
  const overlaps: string[] = []
  const conceptRows = new Map<string, number>() // concepto → fila del régimen nuevo (referencia)

  const set = (key: string, date: string, v: CellValue, period: string) => {
    if (date > lastMonth) return
    if (!series.has(key)) series.set(key, new Map())
    const prev = series.get(key)!.get(date)
    if (prev) {
      if (Math.abs(prev.value - v.value) > 1e-9) {
        throw new Error(`Tarifas: períodos solapados con valores distintos en ${date} (${prev.cell} = ${prev.value}, ${v.cell} = ${v.value}, período "${period}")`)
      }
      return
    }
    series.get(key)!.set(date, v)
  }

  for (const sheetName of [OLD_TARIFF_SHEET, NEW_TARIFF_SHEET]) {
    const ws = wb.Sheets[sheetName]
    if (!ws || !ws['!ref']) throw new Error(`La hoja "${sheetName}" no existe en el archivo`)
    const range = XLSX.utils.decode_range(ws['!ref'])
    const at = (r: number, c: number) => ws[XLSX.utils.encode_cell({ r, c })] as XLSX.CellObject | undefined
    const text = (r: number, c: number) => normalizeLabel(at(r, c)?.v)
    const ref = (r: number, c: number) => `${sheetName}!${XLSX.utils.encode_cell({ r, c })}`

    // Encabezados: fila del tipo de tarifa ("Tarifa Aplicada"), arriba los períodos, abajo las EDEs
    let sub = -1
    for (let r = range.s.r; r <= range.s.r + 25 && sub < 0; r++) {
      for (let c = 3; c <= range.e.c; c++) if (/^Tarifa Aplicada/i.test(text(r, c))) { sub = r; break }
    }
    if (sub < 0) throw new Error(`${sheetName}: no se encontró el encabezado "Tarifa Aplicada"`)

    // Filas de conceptos: deben coincidir exactamente con la plantilla
    const rows: number[] = []
    let code = ''
    let i = 0
    for (let r = sub + 1; r <= range.e.r; r++) {
      if (text(r, 1)) code = text(r, 1)
      const label = text(r, 2)
      if (!label || label.endsWith(':')) continue
      const expected = CONCEPTS[i]
      if (!expected || expected.code !== code || label.toLowerCase() !== expected.label.toLowerCase()) {
        throw new Error(`${sheetName}: concepto inesperado en ${ref(r, 2)} ("${code} · ${label}"; se esperaba "${expected ? `${expected.code} · ${expected.label}` : 'fin de tabla'}")`)
      }
      rows.push(r)
      i++
    }
    if (rows.length !== CONCEPTS.length) throw new Error(`${sheetName}: se esperaban ${CONCEPTS.length} conceptos y hay ${rows.length}`)

    if (sheetName === OLD_TARIFF_SHEET) {
      // Pares de columnas por mes: Indexada (referencia) y Aplicada, únicas para las tres EDEs
      for (let c = 3; c <= range.e.c; c++) {
        const p = at(sub - 1, c)
        if (p?.t !== 'n') continue
        if (!/^Tarifa Indexada/i.test(text(sub, c)) || !/^Tarifa Aplicada/i.test(text(sub, c + 1))) {
          throw new Error(`${sheetName}: se esperaban columnas Indexada/Aplicada en ${ref(sub, c)}`)
        }
        const { from } = parsePeriod(p)
        CONCEPTS.forEach((concept, k) => {
          const r = rows[k]
          for (const [kind, col] of [['referencia', c], ['aplicada', c + 1]] as [Kind, number][]) {
            const cell = at(r, col)
            if (cell?.t !== 'n') continue
            const v = { value: cell.v as number, cell: ref(r, col) }
            for (const ede of EDES) set(seriesKey(concept, kind, ede.key), from, v, normalizeLabel(p.w ?? p.v))
          }
        })
      }
      continue
    }

    // Régimen nuevo: bloques por período; el período y el tipo vienen en celdas combinadas
    CONCEPTS.forEach((concept, k) => conceptRows.set(`${concept.code}|${concept.key}`, rows[k] + 1))
    let periodCell: XLSX.CellObject | undefined
    let periodLabel = ''
    let kindText = ''
    const coverage = new Map<string, string>() // mes → período que lo cubre
    for (let c = 3; c <= range.e.c; c++) {
      const p = at(sub - 1, c)
      if (p && normalizeLabel(p.w ?? p.v)) {
        periodCell = p
        periodLabel = normalizeLabel(p.w ?? p.v)
        const { from, to } = parsePeriod(p)
        for (const m of monthsBetween(from, to)) {
          if (coverage.has(m)) overlaps.push(`${m}: "${coverage.get(m)}" y "${periodLabel}"`)
          coverage.set(m, periodLabel)
        }
      }
      if (text(sub, c)) kindText = text(sub, c)
      if (!periodCell) continue
      const kind: Kind | null = /^Tarifa Aplicada/i.test(kindText) ? 'aplicada'
        : /^Tarifa (Indexada|Referencia)/i.test(kindText) ? 'referencia' : null
      if (!kind) throw new Error(`${sheetName}: tipo de tarifa no reconocido en ${ref(sub, c)} ("${kindText}")`)
      const edeText = text(sub + 1, c).toLowerCase()
      const ede = EDES.find(e => e.key === edeText)
      if (!ede && !(kind === 'aplicada' && !edeText)) {
        throw new Error(`${sheetName}: EDE no reconocida en ${ref(sub + 1, c)} ("${text(sub + 1, c)}")`)
      }
      const { from, to } = parsePeriod(periodCell)
      const months = monthsBetween(from, to)
      CONCEPTS.forEach((concept, k) => {
        const r = rows[k]
        const cell = at(r, c)
        if (cell?.t !== 'n') return
        const v = { value: cell.v as number, cell: ref(r, c) }
        // Sin EDE: tarifa aplicada única para las tres
        for (const target of ede ? [ede] : EDES) {
          for (const m of months) set(seriesKey(concept, kind, target.key), m, v, periodLabel)
        }
      })
    }
  }

  // Catálogo: por concepto, la aplicada de Edenorte es la serie principal y las demás su desglose
  const out: CatalogRow[] = []
  let order = startOrder
  for (const concept of CONCEPTS) {
    const base = `Tarifa ${concept.code} · ${concept.name}`
    const slugBase = `tarifa-${concept.code.toLowerCase()}-${concept.key}`
    const parentSlug = `${slugBase}-aplicada-edenorte`
    for (const kind of KINDS) {
      for (const ede of EDES) {
        const slug = `${slugBase}-${kind.key}-${ede.key}`
        const monthly = series.get(seriesKey(concept, kind.key, ede.key)) ?? new Map()
        const row = conceptRows.get(`${concept.code}|${concept.key}`) ?? 0
        const entry: CatalogEntry = {
          slug,
          name: `${base} — ${kind.label} · ${ede.label}`,
          unit: concept.unit,
          sheet: NEW_TARIFF_SHEET,
          label: `${concept.code} · ${concept.label}`,
          row,
          category: CATEGORY,
          entity: ede.key,
          parent: slug === parentSlug ? null : parentSlug,
          order: order++,
          chart: 'line',
          scale: 1,
          note: NOTE,
        }
        const source: SheetRow = { row, label: entry.label, monthly, annual: new Map(), nonNumeric: 0 }
        out.push({ entry, source })
      }
    }
  }
  return { rows: out, overlaps }
}
