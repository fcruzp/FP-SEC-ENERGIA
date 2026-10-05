/**
 * Hoja "Anexo Deuda" del Informe de Desempeño (MEM), en US$ MM.
 *
 * Se cargan tres tablas:
 *  1. Deuda corriente de las EDEs con las generadoras: saldo al cierre del mes de la
 *     edición (una "foto"; cada edición aporta un mes), total, por EDE y por generadora.
 *  2. Pagos de las EDEs por compra de energía: mensual del año en curso, por EDE y concepto.
 *  3. Balance pendiente de pago por concepto: saldo al cierre del mes, por EDE.
 * No se cargan: el bloque de deuda corriente de la CDEEE (sin datos desde 2022) ni la
 * deuda congelada (en cero en todas las ediciones revisadas).
 *
 * Las generadoras se listan explícitamente: un nombre desconocido detiene la carga.
 */
import * as XLSX from 'xlsx'
import { slugify, type CatalogEntry, type CatalogRow } from './catalog'
import type { LineRelation } from './annex-financial'
import { normalizeLabel, type CellValue, type SheetRow } from './workbook'

export const DEBT_SHEET = 'Anexo Deuda'
const CATEGORY = 'deuda-generadoras'
const UNIT = 'US$ MM'
const MONTH_ABBR = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

/** Generadoras del bloque "Total EDEs", en el orden del Excel (desde mayo 2026 se agregan las dos últimas). */
const GENERATORS = [
  'Grupo AES', 'AES ANDRES', 'AES DPP', 'EGE ITABO', 'EGE HAINA', 'CESPM', 'SAN FELIPE', 'METALDOM', 'MONTERIO',
  'PALAMARA', 'TCC', 'LAESA', 'CEPP', 'BARRICK PV', 'LOS ORIGENES', 'ELECTRONIC JRC', 'LEAR INVESTMENTS', 'BIO-ENERGY',
  'MONTECRISTI SOLAR', 'GRUPO EOLICO DOMINICANO', 'PECASA', 'AGUAS CLARAS', 'EMERALD SOLAR ENERGY, S.R.L.',
  'POSEIDON ENERGIA RENOVABLE', 'WCG ENERGY LTD', 'AES DOMINICANA RENEWABLE ENERGY', 'FALCONDO', 'KOROR BUSINESS', 'SIBA',
  'ENREN', 'KARPOWERSHIP', 'ECONER FOTOVOLTICA DOM.', 'PHINIE & DEVELOPMENT', 'FIDEICOMISO LARIMAR I',
  'ENERGIA RENOVABLE BAS SRL', 'WCGF SOLAR II SRL', 'MARANATHA ENERGY', 'PARQUE EOLICO BEATA', 'DESARROLLO FOTOVOLTAICOS',
  'I E DR PROJECTS I SRL', 'ETERRA GRUPO ENERGETICO DEL CARIBE', 'COTOPERI SOLAR FV', 'COASTAL PETROLEUM',
  'LCV ECOENER SOLARES DOMINICANA', 'RENEWABLE ENERGY WORLD DOMINICUS', 'TROPIGAS DOMINICANA', 'LA REINA S.A.S.',
  'MATERIAS PRIMAS SAS (MAPRICA)',
]
/** "Grupo AES" es un subtotal de estas tres; no entra en la suma del total. */
const AES_GROUP = ['AES ANDRES', 'AES DPP', 'EGE ITABO']

const EDES = [
  { key: 'edenorte', label: 'Edenorte' },
  { key: 'edesur', label: 'Edesur' },
  { key: 'edeeste', label: 'Edeeste' },
]

const PAYMENT_CONCEPTS = [
  { label: 'Generadores Privados', key: 'generadores-privados', name: 'Generadores privados' },
  { label: 'CDEEE, EGEHID ETED', key: 'cdeee-egehid-eted', name: 'CDEEE, EGEHID y ETED' },
  { label: 'Pagos CTPC', key: 'ctpc', name: 'Central Termoeléctrica Punta Catalina (CTPC)' },
]

export interface DebtResult {
  rows: CatalogRow[]
  relations: LineRelation[]
  /** Columna/fila "Total" del año en la tabla de pagos, para verificar la suma de los meses */
  accumulated: Map<string, CellValue>
  /** Mes de la foto de deuda (debe coincidir con la edición) */
  snapshotMonth: string
}

export function readDebtAnnex(wb: XLSX.WorkBook, sheetName: string, startOrder: number): DebtResult {
  const ws = wb.Sheets[sheetName]
  if (!ws || !ws['!ref']) throw new Error(`La hoja "${sheetName}" no existe en el archivo`)
  const range = XLSX.utils.decode_range(ws['!ref'])
  const at = (r: number, c: number) => ws[XLSX.utils.encode_cell({ r, c })] as XLSX.CellObject | undefined
  const labelAt = (r: number) => normalizeLabel(at(r, 1)?.v)
  const ref = (r: number, c: number) => `${sheetName}!${XLSX.utils.encode_cell({ r, c })}`
  const num = (r: number, c: number): CellValue | undefined => {
    const cell = at(r, c)
    return cell?.t === 'n' && Number.isFinite(cell.v) ? { value: cell.v as number, cell: ref(r, c) } : undefined
  }
  const findRow = (from: number, test: (label: string) => boolean, limit = range.e.r) => {
    for (let r = from; r <= limit; r++) if (test(labelAt(r))) return r
    return -1
  }

  const rows: CatalogRow[] = []
  const relations: LineRelation[] = []
  const accumulated = new Map<string, CellValue>()
  let order = startOrder
  const note = (text: string) => text

  const add = (slug: string, name: string, label: string, row: number, entity: string, parent: string | null,
    monthly: Map<string, CellValue>, entryNote: string, absent = false) => {
    const entry: CatalogEntry = {
      slug, name, unit: UNIT, sheet: DEBT_SHEET, label, row, category: CATEGORY, entity, parent,
      order: order++, chart: 'bar', scale: 1, note: entryNote,
    }
    const source: SheetRow = { row, label, monthly, annual: new Map(), nonNumeric: 0 }
    rows.push(absent ? { entry, source, absent: true } : { entry, source })
  }

  // ── 1. Deuda corriente (foto al cierre del mes) ──
  const debtNote = note('Saldo adeudado al cierre del mes (foto). Cada edición del informe aporta el saldo de su mes.')
  const blocks = new Map<string, number>() // "Total EDEs" | "Edenorte" ... → fila del título
  for (let r = 0; r <= range.e.r; r++) {
    if (/^Deuda Corriente/i.test(labelAt(r))) blocks.set(labelAt(r + 2), r)
  }
  for (const who of ['Total EDEs', ...EDES.map(e => e.label)]) {
    if (!blocks.has(who)) throw new Error(`Anexo Deuda: no se encontró el bloque de deuda corriente "${who}"`)
  }

  let snapshotMonth = ''
  const readDebtBlock = (who: string) => {
    const title = blocks.get(who)!
    const header = findRow(title, l => l === 'Empresa', title + 8)
    if (header < 0) throw new Error(`Anexo Deuda (${who}): no se encontró el encabezado "Empresa"`)
    const serial = at(header, 2)
    if (serial?.t !== 'n') throw new Error(`Anexo Deuda (${who}): la fecha del saldo no es una fecha`)
    const d = XLSX.SSF.parse_date_code(serial.v as number)
    const month = `${d.y}-${String(d.m).padStart(2, '0')}-01`
    if (snapshotMonth && month !== snapshotMonth) throw new Error('Anexo Deuda: los bloques tienen fechas distintas')
    snapshotMonth = month
    const total = findRow(header + 1, l => l === 'Total', header + 80)
    if (total < 0) throw new Error(`Anexo Deuda (${who}): no se encontró la fila "Total"`)
    const lines = new Map<string, { row: number; value?: CellValue }>()
    for (let r = header + 1; r < total; r++) if (labelAt(r)) lines.set(labelAt(r), { row: r, value: num(r, 2) })
    return { month, total: { row: total, value: num(total, 2) }, lines }
  }

  const totalBlock = readDebtBlock('Total EDEs')
  const unknown = [...totalBlock.lines.keys()].filter(n => !GENERATORS.includes(n))
  if (unknown.length) throw new Error(`Anexo Deuda: generadoras no reconocidas (agregar a la lista): ${unknown.join(', ')}`)

  const point = (v: CellValue | undefined) => new Map(v ? [[totalBlock.month, v]] : [])
  const debtSlug = 'deuda-edes-corriente'
  const debtName = 'Deuda corriente de las EDEs con generadoras'
  add(debtSlug, debtName, 'Total', totalBlock.total.row + 1, 'edes-consolidado', null, point(totalBlock.total.value), debtNote)

  for (const ede of EDES) {
    const block = readDebtBlock(ede.label)
    add(`${debtSlug}-${ede.key}`, `${debtName} — ${ede.label}`, 'Total', block.total.row + 1, ede.key, debtSlug,
      point(block.total.value), debtNote)
  }
  relations.push({ slug: debtSlug, kind: 'suma', terms: EDES.map(e => [1, `${debtSlug}-${e.key}`] as [1, string]) })

  for (const gen of GENERATORS) {
    const line = totalBlock.lines.get(gen)
    const name = gen === 'Grupo AES' ? 'Grupo AES (subtotal de AES Andrés, AES DPP y EGE Itabo)' : gen
    add(`${debtSlug}-${slugify(gen)}`, `${debtName} — ${name}`, gen, line ? line.row + 1 : 0, 'edes-consolidado', debtSlug,
      point(line?.value), debtNote, !line)
  }
  relations.push({
    slug: debtSlug,
    kind: 'suma',
    terms: GENERATORS.filter(g => g !== 'Grupo AES' && totalBlock.lines.has(g)).map(g => [1, `${debtSlug}-${slugify(g)}`] as [1, string]),
  })
  relations.push({ slug: `${debtSlug}-${slugify('Grupo AES')}`, kind: 'suma', terms: AES_GROUP.map(g => [1, `${debtSlug}-${slugify(g)}`] as [1, string]) })

  // ── 2. Pagos de las EDEs por compra de energía (mensual, año en curso) ──
  const payNote = note('Pagos de las EDEs por compra de energía, potencia y derecho de conexión (base caja). Cada edición trae los meses del año en curso.')
  const payTitle = findRow(0, l => /^Pagos EDEs Por Compra/i.test(l))
  if (payTitle < 0) throw new Error('Anexo Deuda: no se encontró la tabla de pagos de las EDEs')
  const payHeader = findRow(payTitle, l => l === 'Mes', payTitle + 8)
  const cols = ['Edenorte', 'Edesur', 'Edeeste', 'Total'].map((name, k) => {
    const c = 2 + k
    if (normalizeLabel(at(payHeader, c)?.v).toLowerCase() !== name.toLowerCase()) {
      throw new Error(`Anexo Deuda: columna de pagos inesperada (${ref(payHeader, c)}: "${normalizeLabel(at(payHeader, c)?.v)}")`)
    }
    return c
  })
  const year = Number(snapshotMonth.slice(0, 4))
  const lastMonth = Number(snapshotMonth.slice(5, 7))
  // [columna] → { mes: valor } para el total del mes y cada concepto
  const series = new Map<string, Map<string, CellValue>>()
  const put = (key: string, date: string, v: CellValue | undefined) => {
    if (!series.has(key)) series.set(key, new Map())
    if (v) series.get(key)!.set(date, v)
  }
  let r = payHeader + 1
  for (let m = 0; m < 12; m++, r += 4) {
    if (labelAt(r).toLowerCase().slice(0, 3) !== MONTH_ABBR[m]) throw new Error(`Anexo Deuda: se esperaba el mes "${MONTH_ABBR[m]}" en ${ref(r, 1)}`)
    PAYMENT_CONCEPTS.forEach((concept, k) => {
      if (labelAt(r + 1 + k) !== concept.label) throw new Error(`Anexo Deuda: se esperaba "${concept.label}" en ${ref(r + 1 + k, 1)}`)
    })
    if (m + 1 > lastMonth) continue // meses aún no ejecutados (vienen en cero)
    const date = `${year}-${String(m + 1).padStart(2, '0')}-01`
    cols.forEach((c, i) => {
      put(`${i}|total`, date, num(r, c))
      PAYMENT_CONCEPTS.forEach((concept, k) => put(`${i}|${concept.key}`, date, num(r + 1 + k, c)))
    })
  }
  const totalRow = r
  if (labelAt(totalRow) !== 'Total') throw new Error(`Anexo Deuda: se esperaba la fila "Total" de pagos en ${ref(totalRow, 1)}`)

  const paySlug = 'pagos-edes-compra-energia'
  const payName = 'Pagos de las EDEs por compra de energía'
  const colKeys = [...EDES.map(e => e.key), 'total']
  const slugFor = (i: number, concept?: string) =>
    [paySlug, colKeys[i] === 'total' ? null : colKeys[i], concept ?? null].filter(Boolean).join('-')
  const nameFor = (i: number, concept?: string) =>
    [payName, colKeys[i] === 'total' ? null : EDES[i].label, concept ? PAYMENT_CONCEPTS.find(p => p.key === concept)!.name : null]
      .filter(Boolean).join(' — ')
  const entityFor = (i: number) => (colKeys[i] === 'total' ? 'edes-consolidado' : colKeys[i])
  const T = 3 // índice de la columna Total

  add(slugFor(T), nameFor(T), 'Total', payHeader + 1, entityFor(T), null, series.get(`${T}|total`)!, payNote)
  accumulated.set(slugFor(T), num(totalRow, cols[T])!)
  for (const concept of PAYMENT_CONCEPTS) {
    add(slugFor(T, concept.key), nameFor(T, concept.key), concept.label, payHeader + 2, entityFor(T), slugFor(T), series.get(`${T}|${concept.key}`)!, payNote)
  }
  EDES.forEach((_, i) => {
    add(slugFor(i), nameFor(i), EDES[i].label, payHeader + 1, entityFor(i), slugFor(T), series.get(`${i}|total`)!, payNote)
    accumulated.set(slugFor(i), num(totalRow, cols[i])!)
    for (const concept of PAYMENT_CONCEPTS) {
      add(slugFor(i, concept.key), nameFor(i, concept.key), concept.label, payHeader + 2, entityFor(i), slugFor(i), series.get(`${i}|${concept.key}`)!, payNote)
    }
  })
  // Conceptos = total del mes (por columna); EDEs = total (por concepto)
  colKeys.forEach((_, i) => relations.push({ slug: slugFor(i), kind: 'suma', terms: PAYMENT_CONCEPTS.map(p => [1, slugFor(i, p.key)] as [1, string]) }))
  for (const concept of [undefined, ...PAYMENT_CONCEPTS.map(p => p.key)]) {
    relations.push({ slug: slugFor(T, concept), kind: 'suma', terms: EDES.map((_, i) => [1, slugFor(i, concept)] as [1, string]) })
  }

  // ── 3. Balance pendiente de pago por concepto (foto al cierre del mes) ──
  const pendNote = note('Balance pendiente de pago de las EDEs por concepto, al cierre del mes (foto).')
  const pendTitle = findRow(0, l => /^Balance Pendiente de Pago/i.test(l))
  if (pendTitle < 0) throw new Error('Anexo Deuda: no se encontró la tabla de balance pendiente de pago')
  const pendHeader = findRow(pendTitle, l => l === 'Empresas', pendTitle + 8)
  const pendTotal = findRow(pendHeader + 1, l => l === 'Total', pendHeader + 80)
  if (pendHeader < 0 || pendTotal < 0) throw new Error('Anexo Deuda: tabla de balance pendiente incompleta')
  const pendSlug = 'deuda-edes-balance-pendiente'
  const pendName = 'Balance pendiente de pago de las EDEs'
  add(pendSlug, pendName, 'Total', pendTotal + 1, 'edes-consolidado', null, point(num(pendTotal, 5)), pendNote)
  EDES.forEach((ede, i) => {
    add(`${pendSlug}-${ede.key}`, `${pendName} — ${ede.label}`, 'Total', pendTotal + 1, ede.key, pendSlug, point(num(pendTotal, 2 + i)), pendNote)
  })
  relations.push({ slug: pendSlug, kind: 'suma', terms: EDES.map(e => [1, `${pendSlug}-${e.key}`] as [1, string]) })

  return { rows, relations, accumulated, snapshotMonth }
}
