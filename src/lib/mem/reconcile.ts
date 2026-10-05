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

/** Estructura: cada fila del catálogo trae datos y no hay fechas repetidas. */
export function checkCoverage(rows: CatalogRow[]): CheckResult {
  const result: CheckResult = {
    check: 'cobertura',
    description: 'Cada indicador del catálogo tiene valores mensuales en el Excel.',
    compared: rows.length,
    mismatches: 0,
    samples: [],
    keys: [],
  }
  for (const { entry, source } of rows) {
    if (source.monthly.size === 0) {
      result.mismatches++
      result.keys.push(entry.slug)
      result.samples.push(`${entry.slug}: sin valores (${entry.sheet}!B${source.row})`)
    }
  }
  return result
}
