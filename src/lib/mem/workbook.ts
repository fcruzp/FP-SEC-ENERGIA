/**
 * Lectura estructural del Excel "Informe de Desempeño de las Empresas
 * Eléctricas Estatales" del MEM.
 *
 * No depende de posiciones fijas: las columnas de meses se detectan por las
 * fechas del encabezado y las filas se identifican por su etiqueta (columna B).
 */
import * as XLSX from 'xlsx'

export interface CellValue {
  value: number
  /** Referencia de la celda, p. ej. "EDE's!HN53" */
  cell: string
}

export interface SheetRow {
  /** Número de fila en Excel (1-based) */
  row: number
  /** Etiqueta normalizada (espacios colapsados) */
  label: string
  /** Valores mensuales por fecha 'YYYY-MM-01' */
  monthly: Map<string, CellValue>
  /** Valores de las columnas anuales por año */
  annual: Map<number, CellValue>
  /** Celdas mensuales con texto en lugar de número (p. ej. "-") */
  nonNumeric: number
}

export interface SheetData {
  name: string
  headerRow: number
  months: string[]
  annualYears: number[]
  rows: SheetRow[]
}

// Seriales de Excel válidos para meses del informe (2005–2035)
const MIN_SERIAL = 38353
const MAX_SERIAL = 49310

export function readWorkbook(data: ArrayBuffer | Buffer): XLSX.WorkBook {
  return XLSX.read(data, { type: Buffer.isBuffer(data) ? 'buffer' : 'array', cellDates: false })
}

export function normalizeLabel(text: unknown): string {
  return String(text ?? '').replace(/\s+/g, ' ').trim()
}

function serialToMonth(serial: number): string {
  const d = XLSX.SSF.parse_date_code(serial)
  return `${d.y}-${String(d.m).padStart(2, '0')}-01`
}

/** Extrae la estructura de una hoja: meses, columnas anuales y filas etiquetadas. */
export function readSheet(wb: XLSX.WorkBook, name: string): SheetData {
  const ws = wb.Sheets[name]
  if (!ws || !ws['!ref']) throw new Error(`La hoja "${name}" no existe en el archivo`)
  const range = XLSX.utils.decode_range(ws['!ref'])
  const at = (r: number, c: number) => ws[XLSX.utils.encode_cell({ r, c })] as XLSX.CellObject | undefined

  // Fila de encabezado: la que tiene más fechas (seriales) a partir de la columna K
  let headerRow = -1
  let best = 0
  for (let r = 3; r <= Math.min(12, range.e.r); r++) {
    let count = 0
    for (let c = 10; c <= range.e.c; c++) {
      const cell = at(r, c)
      if (cell?.t === 'n' && (cell.v as number) > MIN_SERIAL && (cell.v as number) < MAX_SERIAL) count++
    }
    if (count > best) { best = count; headerRow = r }
  }
  if (headerRow < 0 || best < 12) throw new Error(`No se encontraron columnas de meses en "${name}"`)

  const monthCols: { col: number; date: string }[] = []
  const annualCols: { col: number; year: number }[] = []
  for (let c = 10; c <= range.e.c; c++) {
    const cell = at(headerRow, c)
    if (!cell) continue
    if (cell.t === 'n' && (cell.v as number) > MIN_SERIAL && (cell.v as number) < MAX_SERIAL) {
      const date = serialToMonth(cell.v as number)
      if (!date.endsWith('-01')) throw new Error(`Encabezado de mes no cae en día 1: ${name}!${XLSX.utils.encode_cell({ r: headerRow, c })}`)
      monthCols.push({ col: c, date })
      continue
    }
    // Columnas anuales: el año puede estar en esta fila o en la de arriba
    const yearCell = /^\d{4}$/.test(String(cell.v).trim()) ? cell : at(headerRow - 1, c)
    const year = Number(String(yearCell?.v ?? '').trim())
    if (monthCols.length && Number.isInteger(year) && year >= 2005 && year <= 2035) {
      annualCols.push({ col: c, year })
    }
  }

  const dates = monthCols.map(m => m.date)
  if (new Set(dates).size !== dates.length) throw new Error(`Meses duplicados en el encabezado de "${name}"`)
  for (let i = 1; i < dates.length; i++) {
    const [y0, m0] = dates[i - 1].split('-').map(Number)
    const [y1, m1] = dates[i].split('-').map(Number)
    if ((y1 - y0) * 12 + (m1 - m0) !== 1) throw new Error(`Meses no consecutivos en "${name}": ${dates[i - 1]} → ${dates[i]}`)
  }

  const rows: SheetRow[] = []
  for (let r = headerRow + 1; r <= range.e.r; r++) {
    const label = normalizeLabel(at(r, 1)?.v)
    const monthly = new Map<string, CellValue>()
    let nonNumeric = 0
    for (const m of monthCols) {
      const cell = at(r, m.col)
      if (cell?.t === 'n' && Number.isFinite(cell.v)) {
        monthly.set(m.date, { value: cell.v as number, cell: `${name}!${XLSX.utils.encode_cell({ r, c: m.col })}` })
      } else if (cell && String(cell.v ?? '').trim() !== '') {
        nonNumeric++
      }
    }
    const annual = new Map<number, CellValue>()
    for (const a of annualCols) {
      const cell = at(r, a.col)
      if (cell?.t === 'n' && Number.isFinite(cell.v)) {
        annual.set(a.year, { value: cell.v as number, cell: `${name}!${XLSX.utils.encode_cell({ r, c: a.col })}` })
      }
    }
    if (!label && monthly.size === 0) {
      rows.push({ row: r + 1, label: '', monthly, annual, nonNumeric })
      continue
    }
    rows.push({ row: r + 1, label, monthly, annual, nonNumeric })
  }

  return {
    name,
    headerRow: headerRow + 1,
    months: dates,
    annualYears: annualCols.map(a => a.year),
    rows,
  }
}
