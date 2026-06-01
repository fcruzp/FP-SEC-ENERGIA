/**
 * XLS Parser for Observatorio Energético
 * TypeScript/Node.js version — runs in Next.js API routes (Netlify compatible)
 *
 * Reads the "Informe de Desempeño" XLS file and generates data_points
 * directly into Supabase using the service_role admin client.
 */

import * as XLSX from 'xlsx'
import { supabaseAdmin } from '@/lib/supabase-admin'

// ============================================================
// TYPES
// ============================================================
interface DataPointInsert {
  indicator_id: string
  entity_id: string | null
  value: number
  date: string
  period_type: string
  source_file: string
  is_estimated: boolean
}

interface IndicatorRow {
  id: string
  name: string
  slug: string
  category_id: string
  entity_id: string | null
  is_breakdown: boolean
  parent_indicator_id: string | null
  unit: string
}

interface EntityRow {
  id: string
  name: string
  slug: string
  type: string
}

interface CategoryRow {
  id: string
  name: string
  slug: string
  source_sheet: string | null
}

interface ParseResult {
  data_points: DataPointInsert[]
  indicators_matched: number
  indicators_unmatched: string[]
  date_columns: number
}

// ============================================================
// ENTITY NAME → SLUG MAPPING
// ============================================================
const ENTITY_SLUG_MAP: Record<string, string> = {
  'edenorte': 'edenorte',
  'edesur': 'edesur',
  'edeeste': 'edeeste',
  "ede's": 'edes-consolidado',
  'total edes': 'edes-consolidado',
  'cdeee': 'cdeee',
  'egehid': 'egehid',
  'eted': 'eted',
  'egpc': 'egpc',
  'punta catalina': 'egpc',
  'gsf': 'gsf',
  'cespm': 'cespm',
  'dpp': 'dpp',
  'egehaina': 'egehaina-larimar',
  'larimar': 'egehaina-larimar',
  'electronic jrc': 'electronic-jrc',
  'montecristi solar': 'montecristi-solar',
  'c power': 'c-power',
  'cpower': 'c-power',
  'pecasa': 'pecasa',
  'matafongo': 'matafongo',
  'wcg energy': 'wcg-energy',
  'wcg': 'wcg-energy',
  'emerald solar': 'emerald-solar',
  'poseidon': 'poseidon',
  'quisqueya ii': 'quisqueya-ii',
  'quisqueya': 'quisqueya-ii',
  'falcondo': 'falcondo',
  'rsj': 'rsj',
  'mercado spot': 'mercado-spot',
  'spot': 'mercado-spot',
}

// ============================================================
// HELPERS
// ============================================================
function normalizeText(text: string): string {
  return (text || '').toString().trim().toLowerCase().replace(/\s+/g, ' ').replace(/[.,]+$/, '')
}

function slugify(text: string): string {
  let t = text.toLowerCase().trim()
  // Replace $ with 'd' (USD → usd) before removing special chars
  t = t.replace(/\$/g, 'd')
  // Keep content in parentheses but replace parens with hyphens
  t = t.replace(/[()]/g, '-')
  t = t.replace(/ñ/g, 'n').replace(/ó/g, 'o').replace(/í/g, 'i').replace(/á/g, 'a').replace(/é/g, 'e').replace(/ú/g, 'u')
  t = t.replace(/[^a-z0-9]+/g, '-')
  t = t.replace(/-+/g, '-')
  t = t.replace(/^-|-$/g, '')
  return t
}

function extractUnitFromName(name: string): [string, string] {
  const match = name.match(/\(([^)]+)\)\s*$/)
  if (match) {
    return [name.slice(0, match.index).trim(), match[1]]
  }
  return [name, '']
}

function parseExcelDate(value: unknown): string | null {
  if (!value) return null

  // Already a Date object
  if (value instanceof Date) {
    if (isNaN(value.getTime())) return null
    return value.toISOString().split('T')[0]
  }

  // Number (Excel serial date)
  if (typeof value === 'number') {
    // Excel serial date: days since 1899-12-30
    const date = new Date((value - 25569) * 86400 * 1000)
    if (isNaN(date.getTime())) return null
    return date.toISOString().split('T')[0]
  }

  // String
  if (typeof value === 'string') {
    const d = new Date(value)
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]
  }

  return null
}

function findEntitySlug(name: string): string | null {
  const lower = normalizeText(name)
  for (const [key, slug] of Object.entries(ENTITY_SLUG_MAP)) {
    if (lower === key || lower.includes(key)) {
      return slug
    }
  }
  return null
}

// ============================================================
// DATA LOADING
// ============================================================
async function loadIndicators(): Promise<Map<string, IndicatorRow>> {
  const { data, error } = await supabaseAdmin
    .from('indicators')
    .select('id, name, slug, category_id, entity_id, is_breakdown, parent_indicator_id, unit')

  if (error) throw new Error(`Error loading indicators: ${error.message}`)

  const map = new Map<string, IndicatorRow>()
  for (const ind of data || []) {
    map.set(ind.slug, ind)
    // Also index by normalized name for fuzzy matching
    const normName = normalizeText(ind.name)
    map.set(`name:${normName}`, ind)
  }

  console.log(`📊 Loaded ${data?.length || 0} indicators`)
  return map
}

async function loadEntities(): Promise<Map<string, EntityRow>> {
  const { data, error } = await supabaseAdmin
    .from('entities')
    .select('id, name, slug, type')

  if (error) throw new Error(`Error loading entities: ${error.message}`)

  const map = new Map<string, EntityRow>()
  for (const ent of data || []) {
    map.set(ent.slug, ent)
  }

  console.log(`🏢 Loaded ${data?.length || 0} entities`)
  return map
}

// ============================================================
// SHEET PARSERS
// ============================================================

function findIndicatorBySlug(indicators: Map<string, IndicatorRow>, name: string, prefix?: string): IndicatorRow | null {
  // Try with prefix first (e.g., "cdeee-energia-comprada-gwh")
  if (prefix) {
    const prefixedSlug = `${prefix}-${slugify(name)}`
    const found = indicators.get(prefixedSlug)
    if (found) return found
  }

  // Try direct slug
  const directSlug = slugify(name)
  const found = indicators.get(directSlug)
  if (found) return found

  // Try without unit in name
  const [cleanName] = extractUnitFromName(name)
  const cleanSlug = slugify(cleanName)
  const found2 = indicators.get(cleanSlug)
  if (found2) return found2

  if (prefix) {
    const prefixedClean = `${prefix}-${cleanSlug}`
    const found3 = indicators.get(prefixedClean)
    if (found3) return found3
  }

  // Try normalized name
  const normName = normalizeText(name)
  const found4 = indicators.get(`name:${normName}`)
  if (found4) return found4

  return null
}

/**
 * Parse date headers from a row.
 * Returns a map of column index → date string (YYYY-MM-DD)
 * Optionally filters by dateFrom/dateTo to limit the range of columns processed.
 */
function findDateColumns(
  sheet: XLSX.WorkSheet,
  headerRow: number,
  startCol: number,
  dateFrom?: string,
  dateTo?: string
): Map<number, string> {
  const dateMap = new Map<number, string>()

  if (!sheet['!ref']) return dateMap
  const range = XLSX.utils.decode_range(sheet['!ref'])

  for (let col = startCol; col <= range.e.c; col++) {
    const cellAddr = XLSX.utils.encode_cell({ r: headerRow, c: col })
    const cell = sheet[cellAddr]
    if (!cell) continue

    const dateStr = parseExcelDate(cell.v)
    if (dateStr) {
      // Filter out invalid dates (before 2008 or after 2030 — likely accumulated/total columns)
      const year = parseInt(dateStr.split('-')[0], 10)
      if (year >= 2008 && year <= 2030) {
        // Apply date range filter if specified
        if (dateFrom && dateStr < dateFrom) continue
        if (dateTo && dateStr > dateTo) continue
        dateMap.set(col, dateStr)
      }
    }
  }

  return dateMap
}

/**
 * Get cell value from sheet
 */
function getCellValue(sheet: XLSX.WorkSheet, row: number, col: number): unknown {
  const cellAddr = XLSX.utils.encode_cell({ r: row, c: col })
  const cell = sheet[cellAddr]
  return cell ? cell.v : null
}

/**
 * Parse "Variables Relevantes" sheet
 */
function parseVariablesRelevantes(
  sheet: XLSX.WorkSheet,
  indicators: Map<string, IndicatorRow>,
  sourceFile: string,
  dateFrom?: string,
  dateTo?: string
): DataPointInsert[] {
  const dataPoints: DataPointInsert[] = []
  const dateMap = findDateColumns(sheet, 6, 11, dateFrom, dateTo) // Row 7 (0-indexed: 6), col L (0-indexed: 11)
  console.log(`  📅 ${dateMap.size} date columns found`)

  if (!sheet['!ref']) return dataPoints
  const range = XLSX.utils.decode_range(sheet['!ref'])

  for (let row = 7; row <= Math.min(range.e.r, 49); row++) {
    const nameRaw = getCellValue(sheet, row, 1) // Column B
    if (!nameRaw) continue

    const name = String(nameRaw).trim()
    if (!name) continue

    // Find matching indicator
    const indicator = findIndicatorBySlug(indicators, name)
    if (!indicator) {
      console.log(`  ⚠️ No match: "${name}"`)
      continue
    }

    // Extract data from monthly columns
    for (const [col, dateStr] of dateMap) {
      const value = getCellValue(sheet, row, col)
      if (value !== null && value !== '' && typeof value === 'number' && isFinite(value)) {
        dataPoints.push({
          indicator_id: indicator.id,
          entity_id: null,
          value: Math.round(value * 1e6) / 1e6,
          date: dateStr,
          period_type: 'monthly',
          source_file: sourceFile,
          is_estimated: false,
        })
      }
    }
  }

  return dataPoints
}

/**
 * Parse "EDE's" sheet — 42 main indicators + Edenorte/Edesur/Edeeste breakdowns
 */
function parseEdesSheet(
  sheet: XLSX.WorkSheet,
  indicators: Map<string, IndicatorRow>,
  entities: Map<string, EntityRow>,
  sourceFile: string,
  dateFrom?: string,
  dateTo?: string
): DataPointInsert[] {
  const dataPoints: DataPointInsert[] = []
  const dateMap = findDateColumns(sheet, 6, 11, dateFrom, dateTo)
  console.log(`  📅 ${dateMap.size} date columns found`)

  if (!sheet['!ref']) return dataPoints
  const range = XLSX.utils.decode_range(sheet['!ref'])

  const edeNames = ['edenorte', 'edesur', 'edeeste']
  let lastParentSlug: string | null = null

  for (let row = 7; row <= Math.min(range.e.r, 215); row++) {
    const nameRaw = getCellValue(sheet, row, 1) // Column B
    if (!nameRaw) continue

    const name = String(nameRaw).trim()
    if (!name) continue
    const nameLower = normalizeText(name)

    // Check if this is an EDE breakdown row
    const edeMatch = edeNames.find(ede => nameLower === ede)

    if (edeMatch && lastParentSlug) {
      // This is a child breakdown
      const childSlug = `${lastParentSlug}-${edeMatch}`
      const indicator = indicators.get(childSlug)
      if (indicator) {
        const entity = entities.get(edeMatch)
        for (const [col, dateStr] of dateMap) {
          const value = getCellValue(sheet, row, col)
          if (value !== null && typeof value === 'number' && isFinite(value)) {
            dataPoints.push({
              indicator_id: indicator.id,
              entity_id: entity?.id || null,
              value: Math.round(value * 1e6) / 1e6,
              date: dateStr,
              period_type: 'monthly',
              source_file: sourceFile,
              is_estimated: false,
            })
          }
        }
      }
      continue
    }

    // This is a parent indicator row
    const indicator = findIndicatorBySlug(indicators, name)
    if (indicator) {
      lastParentSlug = indicator.slug
      const entity = entities.get('edes-consolidado')
      for (const [col, dateStr] of dateMap) {
        const value = getCellValue(sheet, row, col)
        if (value !== null && typeof value === 'number' && isFinite(value)) {
          dataPoints.push({
            indicator_id: indicator.id,
            entity_id: entity?.id || null,
            value: Math.round(value * 1e6) / 1e6,
            date: dateStr,
            period_type: 'monthly',
            source_file: sourceFile,
            is_estimated: false,
          })
        }
      }
    } else {
      lastParentSlug = null
    }
  }

  return dataPoints
}

/**
 * Parse simple entity sheets (CDEEE, EGEHID, ETED, EGPC)
 */
function parseEntitySheet(
  sheet: XLSX.WorkSheet,
  sheetName: string,
  entitySlug: string,
  indicatorPrefix: string,
  indicators: Map<string, IndicatorRow>,
  entities: Map<string, EntityRow>,
  sourceFile: string,
  dateFrom?: string,
  dateTo?: string
): DataPointInsert[] {
  const dataPoints: DataPointInsert[] = []
  const headerRow = sheetName === 'EGPC' ? 7 : 6
  const dateMap = findDateColumns(sheet, headerRow, 11, dateFrom, dateTo)
  console.log(`  📅 ${dateMap.size} date columns found`)

  if (!sheet['!ref']) return dataPoints
  const range = XLSX.utils.decode_range(sheet['!ref'])

  const dataStartRow = sheetName === 'EGPC' ? 8 : 7
  let lastParentSlug: string | null = null

  for (let row = dataStartRow; row <= Math.min(range.e.r, 100); row++) {
    const nameRaw = getCellValue(sheet, row, 1) // Column B
    if (!nameRaw) continue

    const name = String(nameRaw).trim()
    if (!name) continue
    const nameLower = normalizeText(name)

    // Check if this row has any data
    let hasData = false
    for (const col of dateMap.keys()) {
      const v = getCellValue(sheet, row, col)
      if (v !== null && typeof v === 'number' && isFinite(v)) {
        hasData = true
        break
      }
    }

    if (!hasData) continue

    // Check if this is a breakdown entity name
    const matchedEntitySlug = findEntitySlug(name)

    if (matchedEntitySlug && lastParentSlug) {
      // Try as a child of the last parent
      const childSlug = `${lastParentSlug}-${matchedEntitySlug}`
      const indicator = indicators.get(childSlug)
      if (indicator) {
        const entity = entities.get(matchedEntitySlug)
        for (const [col, dateStr] of dateMap) {
          const value = getCellValue(sheet, row, col)
          if (value !== null && typeof value === 'number' && isFinite(value)) {
            dataPoints.push({
              indicator_id: indicator.id,
              entity_id: entity?.id || null,
              value: Math.round(value * 1e6) / 1e6,
              date: dateStr,
              period_type: 'monthly',
              source_file: sourceFile,
              is_estimated: false,
            })
          }
        }
        continue
      }
    }

    // Try as a parent indicator
    const indicator = findIndicatorBySlug(indicators, name, indicatorPrefix)
    if (indicator) {
      lastParentSlug = indicator.slug
      const entity = entities.get(entitySlug)
      for (const [col, dateStr] of dateMap) {
        const value = getCellValue(sheet, row, col)
        if (value !== null && typeof value === 'number' && isFinite(value)) {
          dataPoints.push({
            indicator_id: indicator.id,
            entity_id: entity?.id || null,
            value: Math.round(value * 1e6) / 1e6,
            date: dateStr,
            period_type: 'monthly',
            source_file: sourceFile,
            is_estimated: false,
          })
        }
      }
    } else {
      // Try as a text breakdown (no entity, just sub-indicator)
      if (lastParentSlug) {
        const textSlug = `${lastParentSlug}-${slugify(name)}`
        const textIndicator = indicators.get(textSlug)
        if (textIndicator) {
          for (const [col, dateStr] of dateMap) {
            const value = getCellValue(sheet, row, col)
            if (value !== null && typeof value === 'number' && isFinite(value)) {
              dataPoints.push({
                indicator_id: textIndicator.id,
                entity_id: null,
                value: Math.round(value * 1e6) / 1e6,
                date: dateStr,
                period_type: 'monthly',
                source_file: sourceFile,
                is_estimated: false,
              })
            }
          }
          continue
        }
      }

      lastParentSlug = null
    }
  }

  return dataPoints
}

// ============================================================
// MAIN PARSER FUNCTION
// ============================================================
export async function parseXls(
  fileBuffer: Buffer,
  fileName: string,
  options?: { dryRun?: boolean; sheetName?: string; batchSize?: number; dateFrom?: string; dateTo?: string }
): Promise<{
  success: boolean
  data_points_extracted: number
  data_points_inserted: number
  date_range: string
  date_columns_filtered: number
  date_columns_total: number
  unmatched_indicators: string[]
  error?: string
}> {
  const dryRun = options?.dryRun ?? false
  const sheetName = options?.sheetName
  const batchSize = options?.batchSize ?? 500
  const dateFrom = options?.dateFrom
  const dateTo = options?.dateTo

  try {
    // Load reference data from Supabase
    const [indicators, entities] = await Promise.all([
      loadIndicators(),
      loadEntities(),
    ])

    // Parse XLS
    console.log(`📄 Parsing: ${fileName} (${(fileBuffer.length / 1024).toFixed(1)} KB)`)
    const workbook = XLSX.read(fileBuffer, { type: 'buffer', cellDates: true })
    console.log(`📊 Sheets: ${workbook.SheetNames.join(', ')}`)

    const allDataPoints: DataPointInsert[] = []
    const unmatched: string[] = []

    // Sheet configurations
    const sheetConfigs: Array<{
      name: string
      entitySlug: string
      prefix: string
      parser: 'variables' | 'edes' | 'entity'
    }> = [
      { name: 'Variables Relevantes', entitySlug: '', prefix: '', parser: 'variables' },
      { name: "EDE's", entitySlug: 'edes-consolidado', prefix: '', parser: 'edes' },
      { name: 'CDEEE', entitySlug: 'cdeee', prefix: 'cdeee', parser: 'entity' },
      { name: 'EGEHID', entitySlug: 'egehid', prefix: 'egehid', parser: 'entity' },
      { name: 'ETED', entitySlug: 'eted', prefix: 'eted', parser: 'entity' },
      { name: 'EGPC', entitySlug: 'egpc', prefix: 'egpc', parser: 'entity' },
    ]

    for (const config of sheetConfigs) {
      if (sheetName && config.name !== sheetName) continue

      const sheet = workbook.Sheets[config.name]
      if (!sheet) {
        console.log(`  ⏭️ ${config.name}: not found in workbook`)
        continue
      }

      console.log(`\n📊 Parsing: ${config.name}`)

      let dps: DataPointInsert[] = []

      switch (config.parser) {
        case 'variables':
          dps = parseVariablesRelevantes(sheet, indicators, fileName, dateFrom, dateTo)
          break
        case 'edes':
          dps = parseEdesSheet(sheet, indicators, entities, fileName, dateFrom, dateTo)
          break
        case 'entity':
          dps = parseEntitySheet(sheet, config.name, config.entitySlug, config.prefix, indicators, entities, fileName, dateFrom, dateTo)
          break
      }

      console.log(`  📈 ${dps.length} data_points extracted`)
      allDataPoints.push(...dps)
    }

    // Calculate date range
    const dates = allDataPoints.map(dp => dp.date).sort()
    const dateRange = dates.length > 0 ? `${dates[0]} → ${dates[dates.length - 1]}` : 'N/A'

    // Count total date columns across all parsed sheets (before filtering)
    let totalDateColumns = 0
    let filteredDateColumns = 0
    for (const config of sheetConfigs) {
      if (sheetName && config.name !== sheetName) continue
      const sheet = workbook.Sheets[config.name]
      if (!sheet) continue
      const headerRow = config.name === 'EGPC' ? 7 : 6
      const allDateCols = findDateColumns(sheet, headerRow, 11)
      totalDateColumns += allDateCols.size
      // Count how many remain after filter
      for (const [, dateStr] of allDateCols) {
        if (!dateFrom || dateStr >= dateFrom) {
          if (!dateTo || dateStr <= dateTo) {
            filteredDateColumns++
          }
        }
      }
    }

    // Insert into Supabase
    let inserted = 0
    if (!dryRun && allDataPoints.length > 0) {
      console.log(`\n💾 Inserting ${allDataPoints.length} data_points in batches of ${batchSize}...`)

      for (let i = 0; i < allDataPoints.length; i += batchSize) {
        const batch = allDataPoints.slice(i, i + batchSize)
        const { data, error } = await supabaseAdmin
          .from('data_points')
          .upsert(batch, {
            onConflict: 'indicator_id,date,entity_id',
            ignoreDuplicates: true,
          })
          .select('id')

        if (error) {
          console.error(`  ❌ Batch ${Math.floor(i / batchSize) + 1} error:`, error.message)
          // Try individual inserts for this batch
          for (const dp of batch) {
            const { error: singleError } = await supabaseAdmin
              .from('data_points')
              .upsert(dp, { onConflict: 'indicator_id,date,entity_id', ignoreDuplicates: true })
            if (!singleError) inserted++
          }
        } else {
          inserted += data?.length || batch.length
        }

        console.log(`  ✅ Batch ${Math.floor(i / batchSize) + 1}: processed`)
      }
    } else if (dryRun) {
      console.log(`\n🔧 DRY RUN — No data inserted`)
    }

    return {
      success: true,
      data_points_extracted: allDataPoints.length,
      data_points_inserted: dryRun ? 0 : inserted,
      date_range: dateRange,
      date_columns_filtered: filteredDateColumns,
      date_columns_total: totalDateColumns,
      unmatched_indicators: unmatched,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('❌ Parser error:', message)
    return {
      success: false,
      data_points_extracted: 0,
      data_points_inserted: 0,
      date_range: '',
      date_columns_filtered: 0,
      date_columns_total: 0,
      unmatched_indicators: [],
      error: message,
    }
  }
}
