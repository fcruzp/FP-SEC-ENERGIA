/**
 * Catálogo de indicadores del Informe de Desempeño (MEM), derivado de la
 * estructura del Excel con reglas explícitas.
 *
 * Estructura de las hojas por bloques:
 *   Fila "total" con unidad entre paréntesis  →  indicador principal
 *   Filas siguientes sin unidad               →  desglose (empresa o componente)
 *   Fila vacía                                →  fin del bloque
 *
 * El resultado se compara con el catálogo versionado (data/mem/catalogo.json):
 * si el Excel cambia (filas nuevas, etiquetas renombradas) la carga se detiene.
 */
import type { SheetData, SheetRow } from './workbook'

export interface SheetConfig {
  sheet: string
  category: string
  /** Entidad dueña de los indicadores de la hoja (null = sistema eléctrico) */
  entity: string | null
  /** Prefijo de slug */
  prefix: string
  kind: 'blocks' | 'sections'
  /** Otros nombres que la hoja ha tenido en alguna edición */
  aliases?: string[]
}

/** Nombre real de la hoja en este archivo (canónico o alias conocido). */
export function resolveSheetName(sheetNames: string[], config: SheetConfig): string {
  const found = [config.sheet, ...(config.aliases ?? [])].find(name => sheetNames.includes(name))
  if (!found) throw new Error(`La hoja "${config.sheet}" no existe en el archivo (hojas: ${sheetNames.join(', ')})`)
  return found
}

export const MEM_SHEETS: SheetConfig[] = [
  { sheet: 'Variables Relevantes', category: 'variables-relevantes', entity: null, prefix: '', kind: 'sections' },
  { sheet: "EDE's", category: 'empresas-distribuidoras', entity: 'edes-consolidado', prefix: 'edes', kind: 'blocks', aliases: ['EDE'] }, // "EDE" en la edición abril 2026
  { sheet: 'CDEEE', category: 'cdeee', entity: 'cdeee', prefix: 'cdeee', kind: 'blocks' },
  { sheet: 'EGEHID', category: 'egehid', entity: 'egehid', prefix: 'egehid', kind: 'blocks' },
  { sheet: 'ETED', category: 'eted', entity: 'eted', prefix: 'eted', kind: 'blocks' },
  { sheet: 'EGPC', category: 'egpc-punta-catalina', entity: 'egpc', prefix: 'egpc', kind: 'blocks' },
]

/** Unidades reconocidas (texto del Excel → unidad normalizada). */
const UNITS: Record<string, string> = {
  'gwh': 'GWh',
  '%': '%',
  'usd mm': 'US$ MM',
  'us$ mm': 'US$ MM',
  'dop mm': 'RD$ MM',
  'cusd/kwh': 'cUS$/kWh',
  'cusd$/kwh': 'cUS$/kWh',
  'uscents/kwh': 'cUS$/kWh',
  'dop/kwh': 'RD$/kWh',
  'dop/usd': 'RD$/US$',
  'us$/bbl': 'US$/bbl',
  'us$/mmbtu': 'US$/MMBTU',
  'us$/ton': 'US$/t',
  'cusd/kw-mes': 'cUS$/kW-mes',
  'usd/kw-mes': 'US$/kW-mes',
}

/** Unidad para filas principales que no la indican en la etiqueta. */
const UNITLESS_DEFAULTS: { match: RegExp; unit: string; note?: string }[] = [
  { match: /clientes/i, unit: 'clientes' },
  { match: /empleados|dieta militares/i, unit: 'empleados' },
  { match: /^disponibilidad$/i, unit: '%' },
  {
    match: /^total costos de producci[oó]n$/i,
    unit: 'US$ MM',
    note: 'El informe no indica la unidad de esta fila; se asume US$ MM por coherencia con las demás partidas financieras de la hoja.',
  },
]

/** Desgloses que corresponden a una entidad del sector. */
const ENTITY_LABELS: Record<string, string> = {
  'edenorte': 'edenorte',
  'edesur': 'edesur',
  'edeeste': 'edeeste',
  'gsf': 'gsf',
  'cespm': 'cespm',
  'dpp': 'dpp',
  'egehaina (larimar) ii': 'egehaina-larimar',
  'electronic jrc (solar fotovoltaica 30 mwp)': 'electronic-jrc',
  'montecristi solar f.v.': 'montecristi-solar',
  'c power dr operations, s.a.s.': 'c-power',
  'pecasa': 'pecasa',
  'matafongo': 'matafongo',
  'wcg energy ltd': 'wcg-energy',
  'emerald solar': 'emerald-solar',
  'poseidon': 'poseidon',
  'quisqueya ii': 'quisqueya-ii',
  'egehid': 'egehid',
  'falcondo': 'falcondo',
  'rsj': 'rsj',
  'mercado spot': 'mercado-spot',
  'cdeee': 'cdeee',
  "ede's": 'edes-consolidado',
  "genco's": 'gencos',
  'unr': 'unr',
}

/** Nombre visible de algunas etiquetas de desglose del Excel. */
const CHILD_DISPLAY: Record<string, string> = {
  'cdeee': 'CDEEE',
  "ede's": 'EDEs',
  "genco's": 'GenCos',
  'unr': 'Usuarios No Regulados (UNR)',
}

/** Notas metodológicas por etiqueta del Excel (se muestran en la ficha del indicador). */
const LABEL_NOTES: Record<string, string> = {
  'Costos Marginal de Potencia (cUSD/kW-Mes)':
    'El informe del MEM indica la unidad cUS$/kW-mes, pero valores de 9–11 son coherentes con US$/kW-mes (el Organismo Coordinador reporta el costo marginal de potencia en ese orden de magnitud en US$/kW-mes). Unidad pendiente de confirmar con la fuente.',
}

/** Unidades que se pueden sumar (para conciliar meses vs. total anual y desgloses vs. total). */
export const ADDITIVE_UNITS = new Set(['GWh', 'US$ MM', 'RD$ MM'])

export interface CatalogEntry {
  slug: string
  name: string
  unit: string
  sheet: string
  /** Etiqueta exacta del Excel (columna B) */
  label: string
  /** Fila en la edición con la que se generó (referencia, no se usa para leer) */
  row: number
  category: string
  entity: string | null
  parent: string | null
  /** Orden dentro de la hoja */
  order: number
  chart: 'line' | 'bar'
  /** Escala aplicada al valor del Excel (100 para porcentajes guardados como fracción) */
  scale: number
  note?: string
}

export interface CatalogRow {
  entry: CatalogEntry
  source: SheetRow
  /** La partida existe en el catálogo pero no en esta edición del Excel (variante de formato) */
  absent?: boolean
}

export function slugify(text: string): string {
  return text
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/%/g, ' pct ')
    .replace(/\$/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Separa "Pérdidas (%)" en { base: "Pérdidas", unit: "%" } si la unidad es reconocida. */
export function splitUnit(label: string): { base: string; unit: string | null } {
  const match = /\(([^()]*)\)\s*$/.exec(label)
  if (match) {
    const unit = UNITS[match[1].trim().toLowerCase()]
    if (unit) return { base: label.slice(0, match.index).trim(), unit }
  }
  return { base: label, unit: null }
}

function chartFor(unit: string): 'line' | 'bar' {
  return ADDITIVE_UNITS.has(unit) ? 'bar' : 'line'
}

/** Normaliza "Año Movil" → "Año Móvil" y otras erratas menores solo en el nombre visible. */
function displayText(text: string): string {
  const child = CHILD_DISPLAY[text.toLowerCase()]
  if (child) return child
  return text
    .replace(/A[ñn]o Movil/g, 'Año Móvil')
    .replace(/E[òo]lica/g, 'Eólica')
    .replace(/^Indice\b/, 'Índice')
    .replace(/^Costos Marginal\b/, 'Costo Marginal')
}

interface Draft {
  source: SheetRow
  base: string
  unit: string
  note?: string
  parentIndex: number | null
  /** Sub-grupo dentro del desglose (p. ej. "contratos") */
  group: string | null
  section: string | null
}

/** Construye el catálogo de una hoja a partir de su estructura. */
export function buildSheetCatalog(config: SheetConfig, data: SheetData): CatalogRow[] {
  const drafts: Draft[] = []
  let parentIndex: number | null = null
  let group: string | null = null
  let section: string | null = null

  for (const row of data.rows) {
    if (!row.label && row.monthly.size === 0) { // fila vacía: fin de bloque
      parentIndex = null
      group = null
      continue
    }
    if (row.monthly.size === 0) { // encabezado de sección
      section = row.label
      parentIndex = null
      group = null
      continue
    }

    const { base, unit } = splitUnit(row.label)

    if (config.kind === 'sections') {
      const sectionKey = slugify(section ?? '')
      if (sectionKey.startsWith('generacion-de-energia')) {
        const isTotal = /^total generaci[oó]n$/i.test(row.label)
        if (isTotal) {
          drafts.push({ source: row, base: 'Generación total', unit: 'GWh', parentIndex: null, group: null, section })
          parentIndex = drafts.length - 1
        } else {
          drafts.push({ source: row, base: `Generación ${displayText(row.label)}`, unit: 'GWh', parentIndex, group: null, section })
        }
        continue
      }
      if (sectionKey.startsWith('composicion-generacion')) {
        drafts.push({ source: row, base: `Participación ${displayText(row.label)} en la generación`, unit: '%', parentIndex: null, group: null, section })
        continue
      }
      if (!unit) throw new Error(`Fila sin unidad reconocida: ${config.sheet}!B${row.row} "${row.label}"`)
      const isPrice = sectionKey.startsWith('precios-combustibles')
      drafts.push({ source: row, base: (isPrice ? 'Precio ' : '') + displayText(base), unit, note: LABEL_NOTES[row.label], parentIndex: null, group: null, section })
      continue
    }

    // Hojas por bloques
    const startsBlock = parentIndex === null || unit !== null
    if (startsBlock) {
      let resolvedUnit = unit
      let note: string | undefined
      if (!resolvedUnit) {
        const fallback = UNITLESS_DEFAULTS.find(d => d.match.test(row.label))
        if (!fallback) throw new Error(`Fila principal sin unidad reconocida: ${config.sheet}!B${row.row} "${row.label}"`)
        resolvedUnit = fallback.unit
        note = fallback.note
      }
      drafts.push({ source: row, base: displayText(base), unit: resolvedUnit, note, parentIndex: null, group: null, section })
      parentIndex = drafts.length - 1
      group = null
      continue
    }

    const parent = drafts[parentIndex!]
    const key = row.label.toLowerCase()
    if (key === 'mercado de contratos') {
      drafts.push({ source: row, base: 'Mercado de Contratos', unit: parent.unit, parentIndex, group: null, section })
      group = 'contratos'
      continue
    }
    if (key === 'mercado spot') group = null
    drafts.push({ source: row, base: displayText(row.label), unit: parent.unit, parentIndex, group, section })
  }

  // Nombres y slugs de los indicadores principales; si dos comparten nombre se distinguen por unidad
  const topLevel = drafts.filter(d => d.parentIndex === null || config.kind === 'sections')
  const baseCount = new Map<string, number>()
  for (const d of topLevel) baseCount.set(slugify(d.base), (baseCount.get(slugify(d.base)) ?? 0) + 1)

  const result: CatalogRow[] = []
  const slugs = new Set<string>()
  const names: string[] = []
  const slugsByIndex: string[] = []

  drafts.forEach((d, i) => {
    const isChild = d.parentIndex !== null
    const parentSlug = isChild ? slugsByIndex[d.parentIndex!] : null
    const parentName = isChild ? names[d.parentIndex!] : null
    const ambiguous = !isChild && (baseCount.get(slugify(d.base)) ?? 0) > 1

    let slug: string
    let name: string
    if (!isChild || config.kind === 'sections') {
      const unitPart = ambiguous ? `-${slugify(d.unit === '%' ? 'pct' : d.unit)}` : ''
      slug = [config.prefix, slugify(d.base) + unitPart].filter(Boolean).join('-')
      name = ambiguous ? `${d.base} (${d.unit})` : d.base
    } else {
      const childPart = slugify(d.base) + (d.group ? `-${d.group}` : '')
      slug = `${parentSlug}-${childPart}`
      name = `${parentName} — ${d.base}${d.group ? ' (contratos)' : ''}`
    }
    // Etiquetas repetidas en el Excel (p. ej. "EgeHaina (Larimar) II" dos veces en CDEEE)
    let n = 2
    const original = slug
    while (slugs.has(slug)) slug = `${original}-${n++}`
    if (slug !== original) {
      name = `${name} (serie ${n - 1})`
      d.note = `El informe repite la etiqueta "${d.source.label}" en dos filas con valores distintos; esta es la serie de la fila ${d.source.row}.`
    }
    slugs.add(slug)
    slugsByIndex[i] = slug
    names[i] = name

    const entityFromLabel = isChild ? ENTITY_LABELS[d.source.label.toLowerCase()] : undefined
    result.push({
      source: d.source,
      entry: {
        slug,
        name,
        unit: d.unit,
        sheet: config.sheet,
        label: d.source.label,
        row: d.source.row,
        category: config.category,
        entity: entityFromLabel ?? config.entity,
        parent: parentSlug,
        order: i + 1,
        chart: chartFor(d.unit),
        scale: d.unit === '%' ? 100 : 1,
        ...(d.note ? { note: d.note } : {}),
      },
    })
  })

  return result
}
