/**
 * Verificaciones de consistencia de una carga del Informe de Desempeño.
 * Se comparan los valores mensuales contra los totales que trae el propio Excel.
 */
import { ADDITIVE_UNITS, type CatalogRow } from './catalog'

export interface CheckResult {
  check: string
  description: string
  compared: number
  mismatches: number
  /** Primeros casos con diferencia, para revisión */
  samples: string[]
  /** Clave de cada diferencia ("slug|periodo"), para cotejar con las anomalías conocidas */
  keys: string[]
}

const tolerance = (reference: number) => Math.max(0.05, Math.abs(reference) * 0.001)
const fmt = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 3 })

/** Suma de los meses de cada año = columna anual del Excel (para unidades sumables). */
export function checkAnnualTotals(rows: CatalogRow[]): CheckResult {
  const result: CheckResult = {
    check: 'meses_vs_total_anual',
    description: 'La suma de los meses de cada año coincide con la columna anual del Excel (GWh, US$ MM, RD$ MM).',
    compared: 0,
    mismatches: 0,
    samples: [],
    keys: [],
  }
  for (const { entry, source } of rows) {
    if (!ADDITIVE_UNITS.has(entry.unit)) continue
    for (const [year, annual] of source.annual) {
      const months = [...source.monthly].filter(([date]) => date.startsWith(`${year}-`))
      if (months.length === 0) continue
      const sum = months.reduce((s, [, v]) => s + v.value, 0)
      result.compared++
      if (Math.abs(sum - annual.value) > tolerance(annual.value)) {
        result.mismatches++
        result.keys.push(`${entry.slug}|${year}`)
        if (result.samples.length < 15) {
          result.samples.push(`${entry.slug} ${year}: meses=${fmt(sum)} vs anual=${fmt(annual.value)} (${annual.cell}, ${months.length} meses)`)
        }
      }
    }
  }
  return result
}

/** Edenorte + Edesur + Edeeste = total EDEs, mes a mes (para unidades sumables). */
export function checkEdeBreakdowns(rows: CatalogRow[]): CheckResult {
  const result: CheckResult = {
    check: 'edes_suman_total',
    description: 'Edenorte + Edesur + Edeeste suman el total de las EDEs cada mes (unidades sumables).',
    compared: 0,
    mismatches: 0,
    samples: [],
    keys: [],
  }
  const bySlug = new Map(rows.map(r => [r.entry.slug, r]))
  const childrenOf = new Map<string, CatalogRow[]>()
  for (const r of rows) {
    if (!r.entry.parent) continue
    if (!childrenOf.has(r.entry.parent)) childrenOf.set(r.entry.parent, [])
    childrenOf.get(r.entry.parent)!.push(r)
  }
  for (const [parentSlug, children] of childrenOf) {
    const parent = bySlug.get(parentSlug)!
    const edes = children.filter(c => ['edenorte', 'edesur', 'edeeste'].includes(c.entry.entity ?? '') && !c.entry.slug.endsWith('-contratos'))
    if (edes.length !== 3 || children.length !== 3) continue
    if (!ADDITIVE_UNITS.has(parent.entry.unit) && parent.entry.unit !== 'clientes' && parent.entry.unit !== 'empleados') continue
    for (const [date, total] of parent.source.monthly) {
      const parts = edes.map(e => e.source.monthly.get(date)?.value)
      if (parts.some(p => p === undefined)) continue
      const sum = (parts as number[]).reduce((s, v) => s + v, 0)
      result.compared++
      if (Math.abs(sum - total.value) > tolerance(total.value)) {
        result.mismatches++
        result.keys.push(`${parentSlug}|${date}`)
        if (result.samples.length < 15) {
          result.samples.push(`${parentSlug} ${date}: EDEs=${fmt(sum)} vs total=${fmt(total.value)} (${total.cell})`)
        }
      }
    }
  }
  return result
}

/** Relaciones contables del anexo financiero: totales = suma de partidas; balances = su fórmula. */
export function checkLineRelations(rows: CatalogRow[], relations: { slug: string; kind: string; terms: [number, string][] }[]): CheckResult {
  const result: CheckResult = {
    check: 'partidas_cuadran',
    description: 'En los anexos financiero y de deuda, cada total suma sus partidas, cada balance cumple su fórmula y las EDEs suman el total, mes a mes.',
    compared: 0,
    mismatches: 0,
    samples: [],
    keys: [],
  }
  const bySlug = new Map(rows.map(r => [r.entry.slug, r]))
  for (const rel of relations) {
    const target = bySlug.get(rel.slug)
    if (!target) throw new Error(`Relación con indicador inexistente: ${rel.slug}`)
    for (const [date, total] of target.source.monthly) {
      let sum = 0
      let complete = true
      for (const [sign, slug] of rel.terms) {
        const term = bySlug.get(slug)
        if (!term) throw new Error(`Relación ${rel.slug}: término inexistente ${slug}`)
        const v = term.source.monthly.get(date)?.value
        if (v === undefined) { complete = false; break }
        sum += sign * v
      }
      if (!complete) continue
      result.compared++
      if (Math.abs(sum - total.value) > tolerance(total.value)) {
        result.mismatches++
        result.keys.push(`${rel.slug}|${date}`)
        if (result.samples.length < 15) {
          result.samples.push(`${rel.slug} ${date}: ${rel.kind}=${fmt(sum)} vs Excel=${fmt(total.value)} (${total.cell})`)
        }
      }
    }
  }
  return result
}

/** Columna "Acumulado" del Excel = suma de los meses del año. */
export function checkAccumulated(rows: CatalogRow[], accumulated: Map<string, { value: number; cell: string }>): CheckResult {
  const result: CheckResult = {
    check: 'acumulado_anual',
    description: 'Los totales del año del Excel (columna "Acumulado" del anexo financiero y fila "Total" de pagos) coinciden con la suma de los meses.',
    compared: 0,
    mismatches: 0,
    samples: [],
    keys: [],
  }
  for (const { entry, source } of rows) {
    const acc = accumulated.get(entry.slug)
    if (!acc) continue
    const sum = [...source.monthly.values()].reduce((s, v) => s + v.value, 0)
    result.compared++
    if (Math.abs(sum - acc.value) > tolerance(acc.value)) {
      result.mismatches++
      result.keys.push(entry.slug)
      if (result.samples.length < 15) result.samples.push(`${entry.slug}: meses=${fmt(sum)} vs acumulado=${fmt(acc.value)} (${acc.cell})`)
    }
  }
  return result
}

/** Estructura: cada fila del catálogo trae datos y no hay fechas repetidas. */
export function checkCoverage(rows: CatalogRow[]): CheckResult {
  const result: CheckResult = {
    check: 'cobertura',
    description: 'Cada indicador del catálogo tiene valores mensuales en el Excel.',
    compared: rows.filter(r => !r.absent).length,
    mismatches: 0,
    samples: [],
    keys: [],
  }
  for (const { entry, source, absent } of rows) {
    if (absent) continue
    if (source.monthly.size === 0) {
      result.mismatches++
      result.keys.push(entry.slug)
      result.samples.push(`${entry.slug}: sin valores (${entry.sheet}!B${source.row})`)
    }
  }
  return result
}
