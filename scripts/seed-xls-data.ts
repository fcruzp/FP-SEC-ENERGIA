/**
 * PASO 6: Seed Masivo — Parse XLS marzo 2026 → data_points en Supabase
 * 
 * Script standalone que lee el XLS directamente y usa Supabase REST API
 * para insertar data_points en lotes. Evita timeouts del navegador.
 * 
 * Uso:
 *   npx tsx scripts/seed-xls-data.ts                    # Full insert
 *   npx tsx scripts/seed-xls-data.ts --dry-run          # Solo analizar, no insertar
 *   npx tsx scripts/seed-xls-data.ts --sheet "CDEEE"    # Solo una hoja
 *   npx tsx scripts/seed-xls-data.ts --batch-size 200   # Tamaño de lote
 */

import * as XLSX from 'xlsx'
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// ============================================================
// CONFIG
// ============================================================
const XLS_PATH = path.resolve(__dirname, '../upload/Informe-de-Desempeno-marzo-2026.xlsx')

// Parse CLI args
const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const sheetIdx = args.indexOf('--sheet')
const sheetArg = sheetIdx >= 0 ? args[sheetIdx + 1] : undefined
const batchSizeIdx = args.indexOf('--batch-size')
const batchSize = batchSizeIdx >= 0 ? parseInt(args[batchSizeIdx + 1]) : 500

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

// ============================================================
// ENTITY NAME → SLUG MAPPING
// ============================================================
const ENTITY_SLUG_MAP: Record<string, string> = {
  'edenorte': 'edenorte',
  'edesur': 'edesur',
  'edeeste': 'edeeste',
  "ede's": 'edes-consolidado',
  'total edes': 'edes-consolidado',
  'edes': 'edes-consolidado',
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
  'egehaina-larimar': 'egehaina-larimar',
  'electronic jrc': 'electronic-jrc',
  'montecristi solar': 'montecristi-solar',
  'c power': 'c-power',
  'cpower': 'c-power',
  'c power dr operations': 'c-power',
  'pecasa': 'pecasa',
  'matafongo': 'matafongo',
  'wcg energy': 'wcg-energy',
  'wcg energy ltd': 'wcg-energy',
  'wcg': 'wcg-energy',
  'emerald solar': 'emerald-solar',
  'poseidon': 'poseidon',
  'quisqueya ii': 'quisqueya-ii',
  'quisqueya': 'quisqueya-ii',
  'falcondo': 'falcondo',
  'falcon': 'falcondo',
  'rsj': 'rsj',
  'mercado spot': 'mercado-spot',
  'spot': 'mercado-spot',
  'unr': 'unr',
  "ede's consolidado": 'edes-consolidado',
  "genco's": 'gencos',
  'gencos': 'gencos',
}

// ============================================================
// EXPLICIT NAME → SLUG MAPPING for tricky VR indicators
// ============================================================
const VR_NAME_SLUG_MAP: Record<string, string> = {
  'fuel oil no. 2': 'fuel-oil-2-usd-bbl',
  'fuel oil no. 6': 'fuel-oil-6-usd-bbl',
  'fuel oil #2': 'fuel-oil-2-usd-bbl',
  'fuel oil #6': 'fuel-oil-6-usd-bbl',
  'eòlica': 'generacion-eolica',
  'eolica': 'generacion-eolica',
  'hidráulica': 'generacion-hidraulica',
  'hidraulica': 'generacion-hidraulica',
  'solar fotovoltaica': 'generacion-solar-fv',
  'solar fv': 'generacion-solar-fv',
  'biomasa': 'generacion-biomasa',
  'gas natural': 'generacion-gas-natural',
  'carbón mineral': 'generacion-carbon-mineral',
  'carbon mineral': 'generacion-carbon-mineral',
  'renovable no convencional': 'generacion-total-renovable-no-convencional',
  'total renovable no convencional': 'generacion-total-renovable-no-convencional',
  'costos marginal de energía': 'costo-marginal-energia',
  'costo marginal de energía': 'costo-marginal-energia',
  'costos marginal de potencia': 'costo-marginal-potencia',
  'costo marginal de potencia': 'costo-marginal-potencia',
  'costos marginal de energia': 'costo-marginal-energia',
  'costo marginal de energia': 'costo-marginal-energia',
  'costos marginal de potencia (cusd/kw-mes)': 'costo-marginal-potencia',
  'costo marginal de potencia (cusd/kw-mes)': 'costo-marginal-potencia',
  'costos marginal de energia (cusd$/kwh)': 'costo-marginal-energia',
  'costo marginal de energia (cusd/kwh)': 'costo-marginal-energia',
}

// ============================================================
// SECTION HEADERS TO SKIP (not actual indicators)
// ============================================================
const SECTION_HEADERS = new Set([
  'precios combustibles',
  'generacion de energia por tipo de combustible',
  'generación de energía por tipo de combustible',
  'composicion generacion de energia por tipo de combustible',
  'composición generación de energía por tipo de combustible',
  'composicion generacion de energia por tipo',
  'precios del mercado electrico mayorista',
  'precios del mercado eléctrico mayorista',
  'precios del mercado eléctrico mayorista (mem)',
  'costos marginal de energía',
  'costos marginal de potencia',
  'tasa de cambio',
  'total general',
  'renovables contratos con cdeee',
  'intereses por financiamientos',
  'otros (usd mm)',
])

// ============================================================
// CDEEE SECTION HEADER → PARENT INDICATOR CONTEXT
// Used to match generadora rows to their parent indicator
// ============================================================
const CDEEE_SECTION_CONTEXT: Record<string, string> = {
  'energía comprada': 'cdeee-energia-comprada-gwh',
  'energia comprada': 'cdeee-energia-comprada-gwh',
  'factura por compra': 'cdeee-factura-compra-energia',
  'factura compra': 'cdeee-factura-compra-energia',
  'total energía facturada': 'cdeee-energia-facturada-gwh',
  'total energia facturada': 'cdeee-energia-facturada-gwh',
  'total facturado': 'cdeee-total-facturado-usd-mm',
}

// ============================================================
// HELPERS
// ============================================================
function normalizeText(text: string): string {
  return (text || '').toString().trim().toLowerCase().replace(/\s+/g, ' ').replace(/[.,]+$/, '')
}

function slugify(text: string): string {
  let t = text.toLowerCase().trim()
  t = t.replace(/\$/g, 'd')
  t = t.replace(/[()]/g, '-')
  t = t.replace(/ñ/g, 'n').replace(/ó/g, 'o').replace(/ò/g, 'o').replace(/í/g, 'i').replace(/á/g, 'a').replace(/é/g, 'e').replace(/ú/g, 'u')
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
  if (value instanceof Date) {
    if (isNaN(value.getTime())) return null
    return value.toISOString().split('T')[0]
  }
  if (typeof value === 'number') {
    const date = new Date((value - 25569) * 86400 * 1000)
    if (isNaN(date.getTime())) return null
    return date.toISOString().split('T')[0]
  }
  if (typeof value === 'string') {
    const d = new Date(value)
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]
  }
  return null
}

function findEntitySlug(name: string): string | null {
  const lower = normalizeText(name)
  // Exact match first
  if (ENTITY_SLUG_MAP[lower]) return ENTITY_SLUG_MAP[lower]
  // Partial match
  for (const [key, slug] of Object.entries(ENTITY_SLUG_MAP)) {
    if (lower === key || lower.includes(key)) {
      return slug
    }
  }
  return null
}

function getCellValue(sheet: XLSX.WorkSheet, row: number, col: number): unknown {
  const cellAddr = XLSX.utils.encode_cell({ r: row, c: col })
  const cell = sheet[cellAddr]
  return cell ? cell.v : null
}

// ============================================================
// INDICATOR MATCHING
// ============================================================

function buildIndicatorKeys(indicators: Map<string, IndicatorRow>): void {
  const entries = Array.from(indicators.values())
  for (const ind of entries) {
    const normName = normalizeText(ind.name)
    if (!indicators.has(`name:${normName}`)) {
      indicators.set(`name:${normName}`, ind)
    }
    // Also try without unit
    const [cleanName] = extractUnitFromName(ind.name)
    const cleanSlug = slugify(cleanName)
    if (!indicators.has(cleanSlug)) {
      indicators.set(cleanSlug, ind)
    }
  }
}

function findIndicatorBySlug(
  indicators: Map<string, IndicatorRow>,
  name: string,
  prefix?: string
): IndicatorRow | null {
  const normName = normalizeText(name)

  // 0. Check VR explicit mapping
  if (VR_NAME_SLUG_MAP[normName]) {
    const found = indicators.get(VR_NAME_SLUG_MAP[normName])
    if (found) return found
  }
  // Also try slugified version in VR map
  const nameSlug = slugify(name)
  if (VR_NAME_SLUG_MAP[nameSlug]) {
    const found = indicators.get(VR_NAME_SLUG_MAP[nameSlug])
    if (found) return found
  }

  // 1. Try with prefix
  if (prefix) {
    const prefixedSlug = `${prefix}-${slugify(name)}`
    const found = indicators.get(prefixedSlug)
    if (found) return found
  }

  // 2. Try direct slug
  const directSlug = slugify(name)
  const found = indicators.get(directSlug)
  if (found) return found

  // 3. Try without unit in name
  const [cleanName] = extractUnitFromName(name)
  const cleanSlug = slugify(cleanName)
  const found2 = indicators.get(cleanSlug)
  if (found2) return found2

  // 4. Try prefix + clean slug
  if (prefix) {
    const prefixedClean = `${prefix}-${cleanSlug}`
    const found3 = indicators.get(prefixedClean)
    if (found3) return found3
  }

  // 5. Try normalized name
  const found4 = indicators.get(`name:${normName}`)
  if (found4) return found4

  // 6. Try fuzzy matching: search for indicators whose name contains key words
  // This helps with names like "Fuel Oil No. 2 (US$/BBL)" matching "Fuel Oil #2 (US$/BBL)"
  const keyWords = normName.replace(/[()]/g, ' ').replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2)
  if (keyWords.length >= 2) {
    for (const [, ind] of indicators) {
      if (ind.name.startsWith('name:')) continue
      const indNorm = normalizeText(ind.name)
      const matchCount = keyWords.filter(w => indNorm.includes(w)).length
      if (matchCount >= Math.ceil(keyWords.length * 0.7) && matchCount >= 2) {
        return ind
      }
    }
  }

  return null
}

// ============================================================
// DATE COLUMN DETECTION
// ============================================================
function findDateColumns(sheet: XLSX.WorkSheet, headerRow: number, startCol: number): Map<number, string> {
  const dateMap = new Map<number, string>()
  if (!sheet['!ref']) return dateMap
  const range = XLSX.utils.decode_range(sheet['!ref'])

  // Strategy 1: Try to read dates from the header row directly
  for (let col = startCol; col <= range.e.c; col++) {
    const cellAddr = XLSX.utils.encode_cell({ r: headerRow, c: col })
    const cell = sheet[cellAddr]
    if (!cell) continue

    const dateStr = parseExcelDate(cell.v)
    if (dateStr) {
      const year = parseInt(dateStr.split('-')[0], 10)
      if (year >= 2008 && year <= 2030) {
        dateMap.set(col, dateStr)
      }
    }
  }

  // Strategy 2: If no dates found, try reading from year row (row 5) and 
  // inferring months from column position
  if (dateMap.size === 0) {
    let currentYear = 0
    let monthInYear = 0
    for (let col = startCol; col <= range.e.c; col++) {
      const yearVal = getCellValue(sheet, 4, col)
      if (typeof yearVal === 'number' && yearVal >= 2008 && yearVal <= 2030) {
        currentYear = yearVal
        monthInYear = 0
      }
      
      // Check if this column has numeric data (potential data column)
      const testVal = getCellValue(sheet, 7, col)
      if (typeof testVal === 'number' && currentYear > 0) {
        monthInYear++
        if (monthInYear <= 12) {
          const month = String(monthInYear).padStart(2, '0')
          dateMap.set(col, `${currentYear}-${month}-01`)
        }
      }
    }
  }

  return dateMap
}

// ============================================================
// SHEET PARSERS
// ============================================================

function parseVariablesRelevantes(
  sheet: XLSX.WorkSheet,
  indicators: Map<string, IndicatorRow>,
  sourceFile: string,
  unmatchedTracker: Set<string>
): DataPointInsert[] {
  const dataPoints: DataPointInsert[] = []
  const dateMap = findDateColumns(sheet, 6, 11)
  console.log(`  📅 ${dateMap.size} columnas de fecha encontradas`)

  if (!sheet['!ref'] || dateMap.size === 0) return dataPoints
  const range = XLSX.utils.decode_range(sheet['!ref'])

  for (let row = 7; row <= Math.min(range.e.r, 60); row++) {
    const nameRaw = getCellValue(sheet, row, 1)
    if (!nameRaw) continue
    const name = String(nameRaw).trim()
    if (!name) continue

    // Skip section headers
    const normName = normalizeText(name)
    if (SECTION_HEADERS.has(normName)) continue

    const indicator = findIndicatorBySlug(indicators, name)
    if (!indicator) {
      unmatchedTracker.add(`VR: ${name}`)
      continue
    }

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

function parseEdesSheet(
  sheet: XLSX.WorkSheet,
  indicators: Map<string, IndicatorRow>,
  entities: Map<string, EntityRow>,
  sourceFile: string,
  unmatchedTracker: Set<string>
): DataPointInsert[] {
  const dataPoints: DataPointInsert[] = []
  const dateMap = findDateColumns(sheet, 6, 11)
  console.log(`  📅 ${dateMap.size} columnas de fecha encontradas`)

  if (!sheet['!ref'] || dateMap.size === 0) return dataPoints
  const range = XLSX.utils.decode_range(sheet['!ref'])

  const edeNames = ['edenorte', 'edesur', 'edeeste']
  let lastParentSlug: string | null = null

  for (let row = 7; row <= Math.min(range.e.r, 220); row++) {
    const nameRaw = getCellValue(sheet, row, 1)
    if (!nameRaw) continue
    const name = String(nameRaw).trim()
    if (!name) continue
    const nameLower = normalizeText(name)

    // Check if this is an EDE breakdown row
    const edeMatch = edeNames.find(ede => nameLower === ede)

    if (edeMatch && lastParentSlug) {
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
      } else {
        unmatchedTracker.add(`EDE's child: ${childSlug}`)
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
      unmatchedTracker.add(`EDE's: ${name}`)
      lastParentSlug = null
    }
  }

  return dataPoints
}

function parseEntitySheet(
  sheet: XLSX.WorkSheet,
  sheetName: string,
  entitySlug: string,
  indicatorPrefix: string,
  indicators: Map<string, IndicatorRow>,
  entities: Map<string, EntityRow>,
  sourceFile: string,
  unmatchedTracker: Set<string>
): DataPointInsert[] {
  const dataPoints: DataPointInsert[] = []
  let headerRow = 6
  let dataStartRow = 7
  let maxRow = 100

  if (sheetName === 'EGPC') {
    headerRow = 7
    dataStartRow = 8
    maxRow = 150
  } else if (sheetName === 'CDEEE') {
    maxRow = 200
  } else if (sheetName === 'EGEHID') {
    maxRow = 120
  }

  const dateMap = findDateColumns(sheet, headerRow, 11)
  console.log(`  📅 ${dateMap.size} columnas de fecha encontradas`)

  if (!sheet['!ref'] || dateMap.size === 0) return dataPoints
  const range = XLSX.utils.decode_range(sheet['!ref'])

  let lastParentSlug: string | null = null
  let cdeeeSectionContext: string | null = null  // For CDEEE generadora context

  for (let row = dataStartRow; row <= Math.min(range.e.r, maxRow); row++) {
    const nameRaw = getCellValue(sheet, row, 1)
    if (!nameRaw) continue
    const name = String(nameRaw).trim()
    if (!name) continue
    const nameLower = normalizeText(name)

    // Skip section headers
    if (SECTION_HEADERS.has(nameLower)) continue

    // Check if this row has any numeric data
    let hasData = false
    for (const col of dateMap.keys()) {
      const v = getCellValue(sheet, row, col)
      if (v !== null && typeof v === 'number' && isFinite(v)) {
        hasData = true
        break
      }
    }

    // For CDEEE: detect section headers to set context for generadora rows
    if (sheetName === 'CDEEE') {
      let newContext: string | null = null
      for (const [key, slug] of Object.entries(CDEEE_SECTION_CONTEXT)) {
        if (nameLower.includes(key)) {
          newContext = slug
          break
        }
      }
      if (newContext) {
        cdeeeSectionContext = newContext
        lastParentSlug = newContext
        // If this row also has data, process it as a parent indicator
        if (hasData) {
          const parentIndicator = indicators.get(newContext)
          if (parentIndicator) {
            const entity = entities.get(entitySlug)
            for (const [col, dateStr] of dateMap) {
              const value = getCellValue(sheet, row, col)
              if (value !== null && typeof value === 'number' && isFinite(value)) {
                dataPoints.push({
                  indicator_id: parentIndicator.id,
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
        }
        continue  // Section header processed
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

      // For CDEEE: also try other indicator patterns for generadora rows
      if (sheetName === 'CDEEE' && cdeeeSectionContext) {
        // Try direct section context + entity slug
        const contextChildSlug = `${cdeeeSectionContext}-${matchedEntitySlug}`
        const contextIndicator = indicators.get(contextChildSlug)
        if (contextIndicator) {
          const entity = entities.get(matchedEntitySlug)
          for (const [col, dateStr] of dateMap) {
            const value = getCellValue(sheet, row, col)
            if (value !== null && typeof value === 'number' && isFinite(value)) {
              dataPoints.push({
                indicator_id: contextIndicator.id,
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

        // Try EGEHID match (some generadoras in CDEEE sheet are actually EGEHID)
        if (matchedEntitySlug === 'egehid') {
          // Skip EGEHID row in CDEEE (it's a cross-reference, not a CDEEE indicator)
          continue
        }
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

        // Try with prefix + text slug
        const prefixTextSlug = `${indicatorPrefix}-${slugify(name)}`
        const prefixTextIndicator = indicators.get(prefixTextSlug)
        if (prefixTextIndicator) {
          for (const [col, dateStr] of dateMap) {
            const value = getCellValue(sheet, row, col)
            if (value !== null && typeof value === 'number' && isFinite(value)) {
              dataPoints.push({
                indicator_id: prefixTextIndicator.id,
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

      unmatchedTracker.add(`${sheetName}: ${name}`)
      // Don't reset lastParentSlug — keep context for subsequent rows
    }
  }

  return dataPoints
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  console.log('═'.repeat(60))
  console.log('  PASO 6: Seed Masivo — Parse XLS marzo 2026')
  console.log('═'.repeat(60))
  console.log()

  // Load env vars from .env.local
  const envPath = path.resolve(__dirname, '../.env.local')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8')
    for (const line of envContent.split('\n')) {
      const match = line.match(/^([A-Z_]+)=(.*)$/)
      if (match) {
        process.env[match[1]] = match[2].trim()
      }
    }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    console.error('❌ Faltan variables de entorno: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Check XLS file exists
  if (!fs.existsSync(XLS_PATH)) {
    console.error(`❌ No se encontró el archivo XLS: ${XLS_PATH}`)
    process.exit(1)
  }

  console.log(`📄 Archivo: ${XLS_PATH}`)
  console.log(`📊 Modo: ${dryRun ? 'DRY-RUN (solo análisis)' : 'INSERT (escritura real)'}`)
  if (sheetArg) console.log(`📋 Hoja: ${sheetArg}`)
  console.log()

  // Load reference data from Supabase
  console.log('🔄 Cargando datos de referencia desde Supabase...')

  const [indRes, entRes] = await Promise.all([
    supabase.from('indicators').select('id, name, slug, category_id, entity_id, is_breakdown, parent_indicator_id, unit'),
    supabase.from('entities').select('id, name, slug, type'),
  ])

  if (indRes.error) {
    console.error('❌ Error cargando indicadores:', indRes.error.message)
    process.exit(1)
  }
  if (entRes.error) {
    console.error('❌ Error cargando entidades:', entRes.error.message)
    process.exit(1)
  }

  // Build lookup maps
  const indicators = new Map<string, IndicatorRow>()
  for (const ind of indRes.data || []) {
    indicators.set(ind.slug, ind)
  }
  buildIndicatorKeys(indicators)

  const entities = new Map<string, EntityRow>()
  for (const ent of entRes.data || []) {
    entities.set(ent.slug, ent)
  }

  console.log(`✅ ${indRes.data?.length || 0} indicadores (${indicators.size} keys incluyendo aliases)`)
  console.log(`✅ ${entities.size} entidades`)
  console.log()

  // Print indicator slugs for debugging
  const allSlugs = (indRes.data || []).map((i: IndicatorRow) => i.slug).sort()
  console.log(`📋 Muestra de slugs de indicadores (primeros 30):`)
  allSlugs.slice(0, 30).forEach((s: string) => console.log(`   - ${s}`))
  console.log(`   ... y ${allSlugs.length - 30} más`)
  console.log()

  // Parse XLS
  console.log('📊 Parseando archivo XLS...')
  const xlsBuffer = fs.readFileSync(XLS_PATH)
  const workbook = XLSX.read(xlsBuffer, { type: 'buffer', cellDates: true })
  console.log(`📋 Hojas encontradas: ${workbook.SheetNames.join(', ')}`)
  console.log()

  const sourceFile = 'Informe-de-Desempeno-marzo-2026.xlsx'
  const allDataPoints: DataPointInsert[] = []
  const unmatchedTracker = new Set<string>()
  const matchedIndicatorIds = new Set<string>()

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
    if (sheetArg && config.name !== sheetArg) continue

    const sheet = workbook.Sheets[config.name]
    if (!sheet) {
      console.log(`⏭️  ${config.name}: no encontrada en el workbook`)
      continue
    }

    console.log(`\n📊 Parseando: ${config.name}`)

    let dps: DataPointInsert[] = []

    switch (config.parser) {
      case 'variables':
        dps = parseVariablesRelevantes(sheet, indicators, sourceFile, unmatchedTracker)
        break
      case 'edes':
        dps = parseEdesSheet(sheet, indicators, entities, sourceFile, unmatchedTracker)
        break
      case 'entity':
        dps = parseEntitySheet(sheet, config.name, config.entitySlug, config.prefix, indicators, entities, sourceFile, unmatchedTracker)
        break
    }

    // Track matched indicators
    for (const dp of dps) {
      matchedIndicatorIds.add(dp.indicator_id)
    }

    console.log(`  📈 ${dps.length} data_points extraídos`)
    allDataPoints.push(...dps)
  }

  // Summary
  console.log('\n' + '═'.repeat(60))
  console.log('  RESUMEN DEL ANÁLISIS')
  console.log('═'.repeat(60))
  console.log(`  Total data_points extraídos: ${allDataPoints.length.toLocaleString()}`)
  console.log(`  Indicadores con datos: ${matchedIndicatorIds.size}`)
  console.log(`  Indicadores sin match: ${unmatchedTracker.size}`)

  if (unmatchedTracker.size > 0) {
    console.log('\n  ⚠️  Indicadores sin match del XLS:')
    const unmatched = Array.from(unmatchedTracker).sort()
    unmatched.slice(0, 50).forEach(name => console.log(`     - ${name}`))
    if (unmatched.length > 50) {
      console.log(`     ... y ${unmatched.length - 50} más`)
    }
  }

  // Date range
  const dates = allDataPoints.map(dp => dp.date).sort()
  if (dates.length > 0) {
    console.log(`\n  📅 Rango de fechas: ${dates[0]} → ${dates[dates.length - 1]}`)
  }

  // Entity distribution
  const withEntity = allDataPoints.filter(dp => dp.entity_id !== null).length
  const withoutEntity = allDataPoints.filter(dp => dp.entity_id === null).length
  console.log(`  🏢 Con entidad: ${withEntity.toLocaleString()} | Sin entidad: ${withoutEntity.toLocaleString()}`)

  if (dryRun) {
    console.log('\n🔧 DRY RUN — No se insertaron datos')
    console.log('═'.repeat(60))

    // Save unmatched list to file for analysis
    const unmatchedList = Array.from(unmatchedTracker).sort()
    const reportPath = path.resolve(__dirname, '../download/dry-run-report.txt')
    fs.writeFileSync(reportPath, [
      `DRY RUN REPORT — ${new Date().toISOString()}`,
      `Total data_points: ${allDataPoints.length}`,
      `Matched indicators: ${matchedIndicatorIds.size}`,
      `Unmatched: ${unmatchedTracker.size}`,
      '',
      'UNMATCHED INDICATORS:',
      ...unmatchedList,
    ].join('\n'))
    console.log(`\n📝 Reporte guardado en: ${reportPath}`)
    return
  }

  // ============================================================
  // INSERT INTO SUPABASE
  // ============================================================
  console.log('\n💾 Insertando data_points en Supabase...')
  console.log(`   Lotes de ${batchSize} registros`)
  console.log()

  let totalInserted = 0
  let totalErrors = 0

  for (let i = 0; i < allDataPoints.length; i += batchSize) {
    const batch = allDataPoints.slice(i, i + batchSize)
    const batchNum = Math.floor(i / batchSize) + 1
    const totalBatches = Math.ceil(allDataPoints.length / batchSize)

    // Use insert — duplicates will fail on the unique index
    // This works correctly with the COALESCE-based unique index
    const { data, error } = await supabase
      .from('data_points')
      .insert(batch)
      .select('id')

    if (error) {
      // If batch insert fails, try individual inserts
      if (error.message.includes('duplicate') || error.message.includes('unique') || error.message.includes('conflict')) {
        console.log(`  ⚠️  Lote ${batchNum}/${totalBatches}: duplicados detectados, insertando individualmente...`)
        let batchInserted = 0
        for (const dp of batch) {
          const { error: singleError } = await supabase
            .from('data_points')
            .insert(dp)
          if (singleError) {
            if (!singleError.message.includes('duplicate') && !singleError.message.includes('unique')) {
              totalErrors++
              if (totalErrors <= 5) {
                console.error(`     Error: ${singleError.message}`)
              }
            }
          } else {
            batchInserted++
          }
        }
        totalInserted += batchInserted
        console.log(`  ✅ Lote ${batchNum}/${totalBatches}: ${batchInserted} insertados individualmente`)
      } else {
        console.error(`  ❌ Lote ${batchNum}/${totalBatches}: ${error.message}`)
        totalErrors++
      }
    } else {
      totalInserted += data?.length || batch.length
      console.log(`  ✅ Lote ${batchNum}/${totalBatches}: ${data?.length || batch.length} insertados`)
    }
  }

  console.log('\n' + '═'.repeat(60))
  console.log('  RESULTADO FINAL')
  console.log('═'.repeat(60))
  console.log(`  Data points extraídos: ${allDataPoints.length.toLocaleString()}`)
  console.log(`  Data points insertados: ${totalInserted.toLocaleString()}`)
  console.log(`  Errores: ${totalErrors}`)
  console.log(`  Indicadores con datos: ${matchedIndicatorIds.size}`)

  // Verify count in DB
  const { count: dbCount } = await supabase
    .from('data_points')
    .select('*', { count: 'exact', head: true })

  console.log(`\n  📊 Total data_points en BD: ${dbCount?.toLocaleString() || '?'}`)
  console.log('═'.repeat(60))
}

main().catch(err => {
  console.error('❌ Error fatal:', err)
  process.exit(1)
})
