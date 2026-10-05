/**
 * Hoja "Anexo Res Financieros" del Informe de Desempeño (MEM): flujo de caja
 * mensual del año en curso (US$ MM) por empresa.
 *
 * El Excel no marca la jerarquía de las partidas de forma fiable (ni sangría ni
 * formato consistente), así que se define aquí, explícitamente, con plantillas
 * por tipo de empresa. Cada bloque del Excel debe coincidir exactamente con su
 * plantilla; si no, la carga se detiene. La jerarquía permite verificar que las
 * partidas sumen sus totales y que los balances cumplan su fórmula.
 */
import * as XLSX from 'xlsx'
import { slugify, type CatalogEntry, type CatalogRow } from './catalog'
import { normalizeLabel, type CellValue, type SheetRow } from './workbook'

export const ANNEX_SHEET = 'Anexo Res Financieros'
const CATEGORY = 'resultados-financieros'
const UNIT = 'US$ MM'

/** Partida: etiqueta exacta del Excel, índice de la partida padre y cómo se verifica. */
interface Line {
  label: string
  parent: number | null
  /** La partida es la suma de sus hijas directas */
  sum?: boolean
  /** La partida es una combinación de otras: [signo, índice] */
  formula?: [1 | -1, number][]
}

const L = (label: string, parent: number | null = null, extra: Omit<Line, 'label' | 'parent'> = {}): Line => ({ label, parent, ...extra })

const EDE_LINES: Line[] = [
  L('1. Total Ingresos', null, { sum: true }), // 0
  L('1.1 Ingresos por Venta de Energía', 0, { sum: true }),
  L('UNR', 1), L('Instituciones No Cortables', 1), L('Instituciones Gubernamentales Cortables', 1),
  L('Ayuntamientos', 1), L('Grandes Clientes', 1), L('Cartera Regular (Residenciales y Comerciales)', 1),
  L('1.2 Otros Ingresos', 0, { sum: true }), // 8
  L('Otros Cobros Comerciales', 8), L('Otros Ingresos (incl. ingresos financieros y otros)', 8),
  L('2. Total Gastos', null, { sum: true }), // 11
  L('2.1 Compra de Energía', 11, { sum: true }), // 12
  L('GENCOS', 12), L('CDEEE', 12), L('EGEHID', 12), L('ETED', 12), L('CTPC', 12), L('Notas de Débito / (Crédito)', 12),
  L('2.2 Gastos Operativos (Opex)', 11, { sum: true }), // 19
  L('G. Generales & Administrativos', 19, { sum: true }), // 20
  L('Personal', 20), L('Proveedores', 20), L('Impuestos', 20), L('Otros', 20),
  L('Pagos Inst. Regulatorias & Ayuntamientos', 19, { sum: true }), // 25
  L('Pagos a Instituciones Regulatorias', 25), L('Pagos tasa 3% Ayuntamientos', 25),
  L('2.3 Gastos Financieros', 11, { sum: true }), // 28
  L('Intereses por Financiamientos', 28, { sum: true }), // 29
  L('Sobre Préstamos Bancarios', 29), L('Sobre Facturación Corriente', 29), L('Sobre Deuda Congelada', 29),
  L('3. Balance Compra - Venta Energía (1.1-2.1)', null, { formula: [[1, 1], [-1, 12]] }), // 33
  L('4. Balance Operacional (1-2)', null, { formula: [[1, 0], [-1, 11]] }), // 34
  L('5. Inversiones (CAPEX)', null, { sum: true }), // 35
  L('Inversiones con recursos propios', 35), L('Proyecto BID-BM-OFID', 35),
  L('6. Balance con Inversiones (4-5)', null, { formula: [[1, 34], [-1, 35]] }), // 38
  L('7. Financiamiento', null, { sum: true }), // 39
  L('Aportes del gobierno', 39, { sum: true }), // 40
  L('Cubrir Déficit Operacional', 40), L('Acuerdo de Reconocimiento de Deuda y Pago', 40),
  L('Recursos propios del sector', 39, { sum: true }), // 43
  L('Aportes CDEEE', 43), L('Aportes CDEEE para capital', 43),
  L('Balances Banca Comercial', 39, { sum: true }), // 46
  L('Créditos', 46), L('Depósitos', 46),
  L('Cambio en cuentas por pagar', 39, { sum: true }), // 49
  L('Generadores', 49), L('Acuerdo de Reconocimiento de Deuda y Pago', 49), L('Línea de Crédito con Cesión', 49),
  L('CDEEE, EGEHID, ETED', 49), L('Deuda Congelada', 49),
  L('Financiamiento Capital con Fondos Organismos Multilaterales', 39), // 55
  L('8. Balance luego de Financiamiento (6+7)', null, { formula: [[1, 38], [1, 39]] }), // 56
]

const EGEHID_LINES: Line[] = [
  L('1. Total Ingresos', null, { sum: true }), // 0
  L('1.1 Ingresos por Venta de Energía', 0, { sum: true }),
  L("EDE'S", 1), L('CDEEE', 1), L('GENCOS', 1), L("UNR'S", 1),
  L('1.2 Otros Ingresos', 0, { sum: true }), // 6
  L('Otros Ingresos (incl. ingresos financieros y otros)', 6),
  L('2. Total Gastos', null, { sum: true }), // 8
  L('2.1 Costo Peaje', 8, { sum: true }), // 9
  L('Pago a Peaje de Transmisión', 9),
  L('2.2 Gastos Operativos (OPEX)', 8, { sum: true }), // 11
  L('Personal', 11), L('Servicios No Personales', 11), L('Materiales y Suministros', 11), L('Otros Gastos', 11),
  L('2.3 Gastos Financieros', 8, { sum: true }), // 16
  L('Intereses por Financiamientos', 16),
  L('3. Balance Operacional (1-2)', null, { formula: [[1, 0], [-1, 8]] }), // 18
  L('4. Inversiones (CAPEX)', null, { sum: true }), // 19
  L('Inversiones EGEHID', 19),
  L('5. Balance con Inversiones', null, { formula: [[1, 18], [-1, 19]] }), // 21
  L('6. Financiamiento Déficit', null, { sum: true }), // 22
  L('Balances Banca Comercial', 22, { sum: true }), // 23
  L('Créditos', 23), L('Depósitos', 23),
  L('Recursos Propios del Sector', 22, { sum: true }), // 26
  L("EDE's", 26), L('CDEEE', 26), L('ETED', 26),
  L('Cambio en cuentas por pagar', 22), L('Línea de Crédito con Cesión', 22),
  L('Financiamiento Capital con fondos externos', 22), L('Aportes del Gobierno para Inversiones', 22),
  L('7. Balance luego de Financiamiento (5+6)', null, { formula: [[1, 21], [1, 22]] }), // 34
]

const ETED_LINES: Line[] = [
  L('1. Total Ingresos', null, { sum: true }), // 0
  L('1.1 Ingresos por Peaje de Transmisión y Compensación de Peaje', 0, { sum: true }),
  L("EDE's", 1), L('CDEEE', 1), L('EGEHID', 1), L('GENCOS', 1), L("UNR'S", 1), L('Compensación-Triangulación GenCo´s', 1),
  L('1.2 Otros Ingresos', 0, { sum: true }), // 8
  L('Otros Ingresos (incl. ingresos financieros y otros)', 8),
  L('2. Total Gastos', null, { sum: true }), // 10
  L('2.1 Gastos Operativos (OPEX)', 10, { sum: true }), // 11
  L('Personal', 11), L('Servicios No Personales', 11), L('Materiales y Suministros', 11), L('Otros Gastos', 11),
  L('2.2 Gastos Financieros', 10, { sum: true }), // 16
  L('Intereses por Financiamientos', 16),
  L('3. Balance Operacional (1-2)', null, { formula: [[1, 0], [-1, 10]] }), // 18
  L('4. Inversiones (CAPEX)', null, { sum: true }), // 19
  L('Inversiones ETED', 19),
  L('5. Balance con Inversiones (3-4)', null, { formula: [[1, 18], [-1, 19]] }), // 21
  L('6. Financiamiento Déficit', null, { sum: true }), // 22
  L('Balances Banca Comercial', 22, { sum: true }), // 23
  L('Créditos', 23), L('Depósitos', 23),
  L('Recursos Propios del Sector', 22, { sum: true }), // 26
  L("EDE's", 26), L('CDEEE', 26), L('EGEHID', 26),
  L('Financiamiento Capital con fondos externos', 22),
  L('7. Balance luego de Financiamiento (5+6)', null, { formula: [[1, 21], [1, 22]] }), // 31
]

const EGPC_LINES: Line[] = [
  L('1.Total Ingresos', null, { sum: true }), // 0
  L('1.1 Ingresos por Venta de Energía', 0, { sum: true }),
  L("EDE's", 1), L('ETED', 1), L('EGEHID', 1), L('GENCOS', 1), L('UNRS', 1),
  L('1.2 Total Otros Ingresos', 0), // 7
  L('2. Costos de Produccion', null, { sum: true }), // 8
  L('Costos Directos', 8), L('Cargos del Mercado Electrico Mayorista', 8), L('Costos Personal Producción', 8),
  L('Otros Costos Operativos de Producción', 8),
  L('3. Gastos Totales', null, { sum: true }), // 13
  L('3.1 Gastos Operativos (OPEX)', 13, { sum: true }), // 14
  L('3.1.1 Gastos Generales y Administrativos.', 14, { sum: true }), // 15
  L('Gastos de Personal', 15), L('Servicios No Personales', 15),
  L('3.1.2 Gastos Generales de Operación', 14, { sum: true }), // 18
  L('Materiales y Suministros', 18), L('Gastos por Aporte Sector Electrico', 18),
  L('3.1.3 Gastos de Depreciación y Amortización', 14), // 21
  L('3.2 Otros Gastos', 13), // 22
  L('3.3 Gastos Financieros', 13, { sum: true }), // 23
  L('Cargos Bancarios', 23),
  L('4. Balance Operacional (1.1-2-3.1)', null, { formula: [[1, 1], [-1, 8], [-1, 14]] }), // 25
  L('5. Balance Neto', null, { formula: [[1, 0], [-1, 8], [-1, 13]] }), // 26
  L('6. Inversiones (CAPEX)', null, { sum: true }), // 27
  L('Inversiones Fijas', 27), L('Otras Inversiones', 27),
  L('7. Balance con Inversiones (5-6)', null, { formula: [[1, 26], [-1, 27]] }), // 30
  L('8. Financiamiento', null), // 31 (incluye saldos de banca: no es suma simple de sus partidas)
  L('Balances Banca Comercial', 31), // 32
  L('Balance Final mes anterior', 32), L('Débitos', 32), L('Créditos', 32),
  L('Aportes Accionitas', 31), // 36
  L('Débitos (Aportes al Ministerio de Hacienda)', 36), L('Créditos', 36),
  L('Endeudamiento', 31), // 39
  L('Débitos', 39), L('Créditos', 39),
  L('Efecto Cambiario', 31),
  L('9. Balance luego de Financiamiento', null, { formula: [[1, 30], [1, 31]] }), // 43
]

interface BlockDef {
  /** Texto con el que empieza el título del bloque en el Excel */
  title: RegExp
  key: string
  company: string
  entity: string
  lines: Line[]
  /** Bloque total del que este es desglose por empresa (para las EDEs) */
  breakdownOf?: string
  /** Formatos anteriores del bloque: partidas que no existían y etiquetas distintas */
  variants?: Variant[]
}

interface Variant {
  description: string
  /** Índices de partidas de la plantilla que no aparecen en este formato */
  omit: number[]
  /** Etiqueta de la partida en este formato, por índice de la plantilla */
  labels?: Record<number, string>
}

/**
 * EGPC en las ediciones de marzo y abril 2026: no existe "3. Gastos Totales"; el OPEX es
 * la partida 3 y las demás se numeran 3.1–3.5. Los importes son los mismos conceptos
 * (verificado: OPEX = 3.1 + 3.2 + 3.3 y los balances cumplen las fórmulas actuales).
 */
const EGPC_VARIANT_2026_Q1: Variant = {
  description: 'Formato EGPC sin "3. Gastos Totales" (ediciones marzo–abril 2026)',
  omit: [13],
  labels: { 14: '3. Total Gastos Operativos (OPEX)' },
}

const BLOCKS: BlockDef[] = [
  { title: /^Resultado Financiero Total Empresas Distribuidoras/i, key: 'edes', company: 'EDEs', entity: 'edes-consolidado', lines: EDE_LINES },
  { title: /^Resultado Financiero Empresa Distribuidora de Electricidad del Norte/i, key: 'edenorte', company: 'Edenorte', entity: 'edenorte', lines: EDE_LINES, breakdownOf: 'edes' },
  { title: /^Resultado Financiero Empresa Distribuidora de Electricidad del Sur/i, key: 'edesur', company: 'Edesur', entity: 'edesur', lines: EDE_LINES, breakdownOf: 'edes' },
  { title: /^Resultado Financiero Empresa Distribuidora de Electricidad del Este/i, key: 'edeeste', company: 'Edeeste', entity: 'edeeste', lines: EDE_LINES, breakdownOf: 'edes' },
  { title: /^Resultado Financiero Empresa de Generación Hidroeléctrica/i, key: 'egehid', company: 'EGEHID', entity: 'egehid', lines: EGEHID_LINES },
  { title: /^Resultado Financiero Empresa de Transmisi[oó]n/i, key: 'eted', company: 'ETED', entity: 'eted', lines: ETED_LINES },
  { title: /^Resultado Financiero Empresa de Generación Eléctrica Punta Catalina/i, key: 'egpc', company: 'EGPC', entity: 'egpc', lines: EGPC_LINES, variants: [EGPC_VARIANT_2026_Q1] },
]

const MONTH_ABBR = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

/** "1.1 Ingresos por Venta" → "Ingresos por Venta"; "1.Total Ingresos" → "Total Ingresos". */
function cleanLabel(label: string): string {
  return label
    .replace(/^\d+(\.\d+)*\.?\s*/, '') // numeración "1.1 "
    .replace(/\s*\([\d.+\-\s]+\)\s*$/, '') // fórmula "(1.1-2.1)"
    .replace(/\.$/, '')
    .trim()
}

/** Relaciones a verificar: total = suma de hijas, o fórmula entre partidas. */
export interface LineRelation {
  slug: string
  kind: 'suma' | 'formula'
  terms: [1 | -1, string][]
}

export interface AnnexResult {
  rows: CatalogRow[]
  relations: LineRelation[]
  /** Columna "Acumulado" del Excel por slug, para verificar la suma de los meses */
  accumulated: Map<string, CellValue>
  year: number
}

/** Extrae el anexo financiero: catálogo, valores mensuales y relaciones contables. */
export function readFinancialAnnex(wb: XLSX.WorkBook, sheetName: string, startOrder: number): AnnexResult {
  const ws = wb.Sheets[sheetName]
  if (!ws || !ws['!ref']) throw new Error(`La hoja "${sheetName}" no existe en el archivo`)
  const range = XLSX.utils.decode_range(ws['!ref'])
  const at = (r: number, c: number) => ws[XLSX.utils.encode_cell({ r, c })] as XLSX.CellObject | undefined
  const labelAt = (r: number) => normalizeLabel(at(r, 1)?.v)

  // Localizar los bloques por su título
  const found: { def: BlockDef; titleRow: number }[] = []
  for (let r = 0; r <= range.e.r; r++) {
    const def = BLOCKS.find(b => b.title.test(labelAt(r)))
    if (def) found.push({ def, titleRow: r })
  }
  const missing = BLOCKS.filter(b => !found.some(f => f.def === b))
  if (missing.length) throw new Error(`Anexo financiero: no se encontraron los bloques ${missing.map(m => m.company).join(', ')}`)
  if (found.length !== BLOCKS.length) throw new Error(`Anexo financiero: se esperaban ${BLOCKS.length} bloques y hay ${found.length}`)

  const rows: CatalogRow[] = []
  const relations: LineRelation[] = []
  const accumulated = new Map<string, CellValue>()
  const slugByBlockLine = new Map<string, string>()
  let year = 0
  let order = startOrder

  for (const { def, titleRow } of found) {
    // Encabezado: fila "DESCRIPCION" (con el año en "Ejecutado Enero - Julio 2026") y debajo los meses
    let headerRow = -1
    for (let r = titleRow; r <= titleRow + 8; r++) if (labelAt(r).toUpperCase() === 'DESCRIPCION') { headerRow = r; break }
    if (headerRow < 0) throw new Error(`Anexo financiero (${def.company}): no se encontró la fila DESCRIPCION`)
    const headerText = Array.from({ length: range.e.c + 1 }, (_, c) => normalizeLabel(at(headerRow, c)?.v)).join(' ')
    // "Ejecutado Enero - Julio 2026": año y último mes ejecutado (los meses siguientes traen ceros)
    const yearMatch = /Ejecutado\s+Enero\s*-\s*(\S+)\s+(\d{4})/i.exec(headerText)
    if (!yearMatch) throw new Error(`Anexo financiero (${def.company}): no se encontró el período en el encabezado`)
    const blockYear = Number(yearMatch[2])
    const lastMonth = MONTH_ABBR.indexOf(yearMatch[1].toLowerCase().slice(0, 3)) + 1
    if (lastMonth < 1) throw new Error(`Anexo financiero (${def.company}): mes no reconocido "${yearMatch[1]}"`)
    if (year && blockYear !== year) throw new Error('Anexo financiero: los bloques tienen años distintos')
    year = blockYear

    const monthCols: { col: number; date: string }[] = []
    let accumulatedCol = -1
    for (let c = 2; c <= range.e.c; c++) {
      const m = MONTH_ABBR.indexOf(normalizeLabel(at(headerRow + 1, c)?.v).toLowerCase().slice(0, 3))
      if (m >= 0 && m + 1 <= lastMonth) monthCols.push({ col: c, date: `${year}-${String(m + 1).padStart(2, '0')}-01` })
      if (/^Acumulado/i.test(normalizeLabel(at(headerRow, c)?.v))) accumulatedCol = c
    }
    if (monthCols.length !== lastMonth) throw new Error(`Anexo financiero (${def.company}): se esperaban ${lastMonth} columnas de meses (enero a ${yearMatch[1]})`)

    // Filas con datos del bloque, en orden, hasta el siguiente título
    const nextTitle = found.find(f => f.titleRow > titleRow)?.titleRow ?? range.e.r + 1
    const dataRows: number[] = []
    for (let r = headerRow + 2; r < nextTitle; r++) {
      if (labelAt(r) && monthCols.some(m => at(r, m.col)?.t === 'n')) dataRows.push(r)
    }
    // Se compara sin numeración ni fórmula entre paréntesis: el Excel las escribe con erratas
    // entre ediciones (p. ej. "(7+8)" en lugar de "(6+7)"); se guarda la etiqueta de la plantilla
    const labels = dataRows.map(labelAt)
    const same = (a: string, b: string) => cleanLabel(a).toLowerCase() === cleanLabel(b).toLowerCase()
    // Fila del Excel de cada partida de la plantilla; se prueba el formato actual y luego los anteriores
    let rowOf: Map<number, number> | null = null
    let firstMismatch = ''
    for (const variant of [{ description: 'actual', omit: [] as number[] }, ...(def.variants ?? [])] as Variant[]) {
      const indices = def.lines.map((_, k) => k).filter(k => !variant.omit.includes(k))
      const expected = indices.map(k => variant.labels?.[k] ?? def.lines[k].label)
      if (labels.length === expected.length && labels.every((l, p) => same(l, expected[p]))) {
        rowOf = new Map(indices.map((k, p) => [k, dataRows[p]]))
        break
      }
      if (!firstMismatch) {
        const p = labels.findIndex((l, q) => !same(l, expected[q] ?? ''))
        firstMismatch = p >= 0 ? `fila ${dataRows[p] + 1}: "${labels[p]}" ≠ "${expected[p]}"` : `${labels.length} filas, se esperaban ${expected.length}`
      }
    }
    if (!rowOf) {
      throw new Error(`Anexo financiero (${def.company}): las partidas no coinciden con la plantilla ni con sus formatos anteriores (${firstMismatch})`)
    }

    def.lines.forEach((line, i) => {
      const r = rowOf!.get(i)
      const lineName = line.parent === null ? cleanLabel(line.label) : `${cleanLabel(def.lines[line.parent].label)} — ${cleanLabel(line.label)}`
      const slug = `rf-${def.key}-${slugify(lineName)}`
      slugByBlockLine.set(`${def.key}|${i}`, slug)

      const monthly = new Map<string, CellValue>()
      for (const m of r === undefined ? [] : monthCols) {
        const cell = at(r!, m.col)
        if (cell?.t === 'n' && Number.isFinite(cell.v)) {
          monthly.set(m.date, { value: cell.v as number, cell: `${sheetName}!${XLSX.utils.encode_cell({ r: r!, c: m.col })}` })
        }
      }
      const acc = r !== undefined && accumulatedCol >= 0 ? at(r, accumulatedCol) : undefined
      if (r !== undefined && acc?.t === 'n') {
        accumulated.set(slug, { value: acc.v as number, cell: `${sheetName}!${XLSX.utils.encode_cell({ r, c: accumulatedCol })}` })
      }

      // Padre: en las EDEs individuales, la misma partida del total EDEs; si no, la partida superior
      const parent = def.breakdownOf
        ? slugByBlockLine.get(`${def.breakdownOf}|${i}`)!
        : line.parent !== null ? slugByBlockLine.get(`${def.key}|${line.parent}`)! : null

      const entry: CatalogEntry = {
        slug,
        name: `${def.company} · ${lineName}`,
        unit: UNIT,
        sheet: ANNEX_SHEET,
        label: line.label,
        row: r === undefined ? 0 : r + 1,
        category: CATEGORY,
        entity: def.entity,
        parent,
        order: order++,
        chart: 'bar',
        scale: 1,
        note: 'Flujo de caja (base percibido). Cada edición del informe trae solo los meses del año en curso.',
      }
      const source: SheetRow = { row: r === undefined ? 0 : r + 1, label: line.label, monthly, annual: new Map(), nonNumeric: 0 }
      rows.push(r === undefined ? { entry, source, absent: true } : { entry, source })

      if (line.sum) {
        const children = def.lines.map((l, k) => (l.parent === i ? k : -1)).filter(k => k >= 0)
        relations.push({ slug, kind: 'suma', terms: children.map(k => [1, `rf-${def.key}-${slugify(`${cleanLabel(line.label)} — ${cleanLabel(def.lines[k].label)}`)}`] as [1, string]) })
      }
      if (line.formula) {
        relations.push({ slug, kind: 'formula', terms: line.formula.map(([sign, k]) => [sign, slugByBlockLine.get(`${def.key}|${k}`)!] as [1 | -1, string]) })
      }
    })
  }

  // Cada partida del total EDEs = Edenorte + Edesur + Edeeste
  EDE_LINES.forEach((_, i) => {
    relations.push({
      slug: slugByBlockLine.get(`edes|${i}`)!,
      kind: 'suma',
      terms: ['edenorte', 'edesur', 'edeeste'].map(k => [1, slugByBlockLine.get(`${k}|${i}`)!] as [1, string]),
    })
  })

  return { rows, relations, accumulated, year }
}
