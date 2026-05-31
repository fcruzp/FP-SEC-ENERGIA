/**
 * PASO 6: Seed Masivo — Genera SQL INSERT para data_points
 * 
 * Parsea el XLS y genera un archivo SQL con INSERT statements
 * que se ejecutan directamente en el SQL Editor de Supabase.
 * Esto es mucho más rápido que la API REST para ~70K registros.
 * 
 * Uso:
 *   npx tsx scripts/generate-sql-seed.ts                    # Todas las hojas
 *   npx tsx scripts/generate-sql-seed.ts --sheet "CDEEE"    # Solo una hoja
 */

import * as XLSX from 'xlsx'
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Import shared logic from seed-xls-data.ts
// We'll just duplicate the key functions here for standalone execution

const XLS_PATH = path.resolve(__dirname, '../upload/Informe-de-Desempeno-marzo-2026.xlsx')
const args = process.argv.slice(2)
const sheetIdx = args.indexOf('--sheet')
const sheetArg = sheetIdx >= 0 ? args[sheetIdx + 1] : undefined

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

const ENTITY_SLUG_MAP: Record<string, string> = {
  'edenorte': 'edenorte', 'edesur': 'edesur', 'edeeste': 'edeeste',
  "ede's": 'edes-consolidado', 'total edes': 'edes-consolidado', 'edes': 'edes-consolidado',
  'cdeee': 'cdeee', 'egehid': 'egehid', 'eted': 'eted', 'egpc': 'egpc', 'punta catalina': 'egpc',
  'gsf': 'gsf', 'cespm': 'cespm', 'dpp': 'dpp',
  'egehaina': 'egehaina-larimar', 'larimar': 'egehaina-larimar', 'egehaina-larimar': 'egehaina-larimar',
  'electronic jrc': 'electronic-jrc', 'montecristi solar': 'montecristi-solar',
  'c power': 'c-power', 'cpower': 'c-power', 'c power dr operations': 'c-power',
  'pecasa': 'pecasa', 'matafongo': 'matafongo',
  'wcg energy': 'wcg-energy', 'wcg energy ltd': 'wcg-energy', 'wcg': 'wcg-energy',
  'emerald solar': 'emerald-solar', 'poseidon': 'poseidon',
  'quisqueya ii': 'quisqueya-ii', 'quisqueya': 'quisqueya-ii',
  'falcondo': 'falcondo', 'falcon': 'falcondo', 'rsj': 'rsj',
  'mercado spot': 'mercado-spot', 'spot': 'mercado-spot',
  'unr': 'unr', "ede's consolidado": 'edes-consolidado', "genco's": 'gencos', 'gencos': 'gencos',
}

const VR_NAME_SLUG_MAP: Record<string, string> = {
  'fuel oil no. 2': 'fuel-oil-2-usd-bbl', 'fuel oil no. 6': 'fuel-oil-6-usd-bbl',
  'fuel oil #2': 'fuel-oil-2-usd-bbl', 'fuel oil #6': 'fuel-oil-6-usd-bbl',
  'eòlica': 'generacion-eolica', 'eolica': 'generacion-eolica',
  'hidráulica': 'generacion-hidraulica', 'hidraulica': 'generacion-hidraulica',
  'solar fotovoltaica': 'generacion-solar-fv', 'solar fv': 'generacion-solar-fv',
  'biomasa': 'generacion-biomasa', 'gas natural': 'generacion-gas-natural',
  'carbón mineral': 'generacion-carbon-mineral', 'carbon mineral': 'generacion-carbon-mineral',
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

const SECTION_HEADERS = new Set([
  'precios combustibles',
  'generacion de energia por tipo de combustible', 'generación de energía por tipo de combustible',
  'composicion generacion de energia por tipo de combustible', 'composición generación de energía por tipo de combustible',
  'composicion generacion de energia por tipo',
  'precios del mercado electrico mayorista', 'precios del mercado eléctrico mayorista',
  'precios del mercado eléctrico mayorista (mem)',
  'costos marginal de energía', 'costos marginal de potencia',
  'tasa de cambio', 'total general', 'renovables contratos con cdeee',
  'intereses por financiamientos', 'otros (usd mm)',
])

const CDEEE_SECTION_CONTEXT: Record<string, string> = {
  'energía comprada': 'cdeee-energia-comprada-gwh', 'energia comprada': 'cdeee-energia-comprada-gwh',
  'factura por compra': 'cdeee-factura-compra-energia', 'factura compra': 'cdeee-factura-compra-energia',
  'total energía facturada': 'cdeee-energia-facturada-gwh', 'total energia facturada': 'cdeee-energia-facturada-gwh',
  'total facturado': 'cdeee-total-facturado-usd-mm',
}

function normalizeText(text: string): string {
  return (text || '').toString().trim().toLowerCase().replace(/\s+/g, ' ').replace(/[.,]+$/, '')
}

function slugify(text: string): string {
  let t = text.toLowerCase().trim()
  t = t.replace(/\$/g, 'd').replace(/[()]/g, '-')
  t = t.replace(/ñ/g, 'n').replace(/ó/g, 'o').replace(/ò/g, 'o').replace(/í/g, 'i').replace(/á/g, 'a').replace(/é/g, 'e').replace(/ú/g, 'u')
  t = t.replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
  return t
}

function extractUnitFromName(name: string): [string, string] {
  const match = name.match(/\(([^)]+)\)\s*$/)
  if (match) return [name.slice(0, match.index).trim(), match[1]]
  return [name, '']
}

function parseExcelDate(value: unknown): string | null {
  if (!value) return null
  if (value instanceof Date) { if (!isNaN(value.getTime())) return value.toISOString().split('T')[0] }
  if (typeof value === 'number') { const d = new Date((value - 25569) * 86400 * 1000); if (!isNaN(d.getTime())) return d.toISOString().split('T')[0] }
  if (typeof value === 'string') { const d = new Date(value); if (!isNaN(d.getTime())) return d.toISOString().split('T')[0] }
  return null
}

function findEntitySlug(name: string): string | null {
  const lower = normalizeText(name)
  if (ENTITY_SLUG_MAP[lower]) return ENTITY_SLUG_MAP[lower]
  for (const [key, slug] of Object.entries(ENTITY_SLUG_MAP)) { if (lower === key || lower.includes(key)) return slug }
  return null
}

function getCellValue(sheet: XLSX.WorkSheet, row: number, col: number): unknown {
  const cell = sheet[XLSX.utils.encode_cell({ r: row, c: col })]
  return cell ? cell.v : null
}

function buildIndicatorKeys(indicators: Map<string, IndicatorRow>): void {
  for (const ind of Array.from(indicators.values())) {
    const normName = normalizeText(ind.name)
    if (!indicators.has(`name:${normName}`)) indicators.set(`name:${normName}`, ind)
    const [cleanName] = extractUnitFromName(ind.name)
    const cleanSlug = slugify(cleanName)
    if (!indicators.has(cleanSlug)) indicators.set(cleanSlug, ind)
  }
}

function findIndicatorBySlug(indicators: Map<string, IndicatorRow>, name: string, prefix?: string): IndicatorRow | null {
  const normName = normalizeText(name)
  if (VR_NAME_SLUG_MAP[normName]) { const f = indicators.get(VR_NAME_SLUG_MAP[normName]); if (f) return f }
  const nameSlug = slugify(name)
  if (VR_NAME_SLUG_MAP[nameSlug]) { const f = indicators.get(VR_NAME_SLUG_MAP[nameSlug]); if (f) return f }
  if (prefix) { const f = indicators.get(`${prefix}-${nameSlug}`); if (f) return f }
  const found = indicators.get(nameSlug); if (found) return found
  const [cleanName] = extractUnitFromName(name)
  const cleanSlug = slugify(cleanName)
  const found2 = indicators.get(cleanSlug); if (found2) return found2
  if (prefix) { const f = indicators.get(`${prefix}-${cleanSlug}`); if (f) return f }
  const found4 = indicators.get(`name:${normName}`); if (found4) return found4
  // Fuzzy
  const keyWords = normName.replace(/[()]/g, ' ').replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2)
  if (keyWords.length >= 2) {
    for (const [, ind] of indicators) {
      if (ind.name.startsWith('name:')) continue
      const indNorm = normalizeText(ind.name)
      const matchCount = keyWords.filter(w => indNorm.includes(w)).length
      if (matchCount >= Math.ceil(keyWords.length * 0.7) && matchCount >= 2) return ind
    }
  }
  return null
}

function findDateColumns(sheet: XLSX.WorkSheet, headerRow: number, startCol: number): Map<number, string> {
  const dateMap = new Map<number, string>()
  if (!sheet['!ref']) return dateMap
  const range = XLSX.utils.decode_range(sheet['!ref'])
  for (let col = startCol; col <= range.e.c; col++) {
    const cell = sheet[XLSX.utils.encode_cell({ r: headerRow, c: col })]
    if (!cell) continue
    const dateStr = parseExcelDate(cell.v)
    if (dateStr) { const y = parseInt(dateStr.split('-')[0], 10); if (y >= 2008 && y <= 2030) dateMap.set(col, dateStr) }
  }
  if (dateMap.size === 0) {
    let currentYear = 0, monthInYear = 0
    for (let col = startCol; col <= range.e.c; col++) {
      const yearVal = getCellValue(sheet, 4, col)
      if (typeof yearVal === 'number' && yearVal >= 2008 && yearVal <= 2030) { currentYear = yearVal; monthInYear = 0 }
      const testVal = getCellValue(sheet, 7, col)
      if (typeof testVal === 'number' && currentYear > 0) { monthInYear++; if (monthInYear <= 12) dateMap.set(col, `${currentYear}-${String(monthInYear).padStart(2, '0')}-01`) }
    }
  }
  return dateMap
}

function parseVariablesRelevantes(sheet: XLSX.WorkSheet, indicators: Map<string, IndicatorRow>, sourceFile: string, unmatched: Set<string>): DataPointInsert[] {
  const dps: DataPointInsert[] = []
  const dateMap = findDateColumns(sheet, 6, 11)
  if (!sheet['!ref'] || dateMap.size === 0) return dps
  const range = XLSX.utils.decode_range(sheet['!ref'])
  for (let row = 7; row <= Math.min(range.e.r, 60); row++) {
    const nameRaw = getCellValue(sheet, row, 1); if (!nameRaw) continue
    const name = String(nameRaw).trim(); if (!name) continue
    if (SECTION_HEADERS.has(normalizeText(name))) continue
    const indicator = findIndicatorBySlug(indicators, name)
    if (!indicator) { unmatched.add(`VR: ${name}`); continue }
    for (const [col, dateStr] of dateMap) {
      const value = getCellValue(sheet, row, col)
      if (value !== null && value !== '' && typeof value === 'number' && isFinite(value))
        dps.push({ indicator_id: indicator.id, entity_id: null, value: Math.round(value * 1e6) / 1e6, date: dateStr, period_type: 'monthly', source_file: sourceFile, is_estimated: false })
    }
  }
  return dps
}

function parseEdesSheet(sheet: XLSX.WorkSheet, indicators: Map<string, IndicatorRow>, entities: Map<string, EntityRow>, sourceFile: string, unmatched: Set<string>): DataPointInsert[] {
  const dps: DataPointInsert[] = []
  const dateMap = findDateColumns(sheet, 6, 11)
  if (!sheet['!ref'] || dateMap.size === 0) return dps
  const range = XLSX.utils.decode_range(sheet['!ref'])
  const edeNames = ['edenorte', 'edesur', 'edeeste']
  let lastParentSlug: string | null = null
  for (let row = 7; row <= Math.min(range.e.r, 220); row++) {
    const nameRaw = getCellValue(sheet, row, 1); if (!nameRaw) continue
    const name = String(nameRaw).trim(); if (!name) continue
    const nameLower = normalizeText(name)
    const edeMatch = edeNames.find(ede => nameLower === ede)
    if (edeMatch && lastParentSlug) {
      const indicator = indicators.get(`${lastParentSlug}-${edeMatch}`)
      if (indicator) { const entity = entities.get(edeMatch); for (const [col, dateStr] of dateMap) { const v = getCellValue(sheet, row, col); if (v !== null && typeof v === 'number' && isFinite(v)) dps.push({ indicator_id: indicator.id, entity_id: entity?.id || null, value: Math.round(v * 1e6) / 1e6, date: dateStr, period_type: 'monthly', source_file: sourceFile, is_estimated: false }) } }
      continue
    }
    const indicator = findIndicatorBySlug(indicators, name)
    if (indicator) { lastParentSlug = indicator.slug; const entity = entities.get('edes-consolidado'); for (const [col, dateStr] of dateMap) { const v = getCellValue(sheet, row, col); if (v !== null && typeof v === 'number' && isFinite(v)) dps.push({ indicator_id: indicator.id, entity_id: entity?.id || null, value: Math.round(v * 1e6) / 1e6, date: dateStr, period_type: 'monthly', source_file: sourceFile, is_estimated: false }) } }
    else { unmatched.add(`EDE's: ${name}`); lastParentSlug = null }
  }
  return dps
}

function parseEntitySheet(sheet: XLSX.WorkSheet, sheetName: string, entitySlug: string, indicatorPrefix: string, indicators: Map<string, IndicatorRow>, entities: Map<string, EntityRow>, sourceFile: string, unmatched: Set<string>): DataPointInsert[] {
  const dps: DataPointInsert[] = []
  let headerRow = 6, dataStartRow = 7, maxRow = 100
  if (sheetName === 'EGPC') { headerRow = 7; dataStartRow = 8; maxRow = 150 }
  else if (sheetName === 'CDEEE') maxRow = 200
  else if (sheetName === 'EGEHID') maxRow = 120
  const dateMap = findDateColumns(sheet, headerRow, 11)
  if (!sheet['!ref'] || dateMap.size === 0) return dps
  const range = XLSX.utils.decode_range(sheet['!ref'])
  let lastParentSlug: string | null = null
  let cdeeeSectionContext: string | null = null
  for (let row = dataStartRow; row <= Math.min(range.e.r, maxRow); row++) {
    const nameRaw = getCellValue(sheet, row, 1); if (!nameRaw) continue
    const name = String(nameRaw).trim(); if (!name) continue
    const nameLower = normalizeText(name)
    if (SECTION_HEADERS.has(nameLower)) continue
    let hasData = false
    for (const col of dateMap.keys()) { const v = getCellValue(sheet, row, col); if (v !== null && typeof v === 'number' && isFinite(v)) { hasData = true; break } }
    if (sheetName === 'CDEEE') {
      let newContext: string | null = null
      for (const [key, slug] of Object.entries(CDEEE_SECTION_CONTEXT)) { if (nameLower.includes(key)) { newContext = slug; break } }
      if (newContext) {
        cdeeeSectionContext = newContext; lastParentSlug = newContext
        if (hasData) { const pi = indicators.get(newContext); if (pi) { const e = entities.get(entitySlug); for (const [col, dateStr] of dateMap) { const v = getCellValue(sheet, row, col); if (v !== null && typeof v === 'number' && isFinite(v)) dps.push({ indicator_id: pi.id, entity_id: e?.id || null, value: Math.round(v * 1e6) / 1e6, date: dateStr, period_type: 'monthly', source_file: sourceFile, is_estimated: false }) } } }
        continue
      }
    }
    if (!hasData) continue
    const matchedEntitySlug = findEntitySlug(name)
    if (matchedEntitySlug && lastParentSlug) {
      const childSlug = `${lastParentSlug}-${matchedEntitySlug}`
      const indicator = indicators.get(childSlug)
      if (indicator) { const e = entities.get(matchedEntitySlug); for (const [col, dateStr] of dateMap) { const v = getCellValue(sheet, row, col); if (v !== null && typeof v === 'number' && isFinite(v)) dps.push({ indicator_id: indicator.id, entity_id: e?.id || null, value: Math.round(v * 1e6) / 1e6, date: dateStr, period_type: 'monthly', source_file: sourceFile, is_estimated: false }) } continue }
      if (sheetName === 'CDEEE' && cdeeeSectionContext) {
        const ci = indicators.get(`${cdeeeSectionContext}-${matchedEntitySlug}`)
        if (ci) { const e = entities.get(matchedEntitySlug); for (const [col, dateStr] of dateMap) { const v = getCellValue(sheet, row, col); if (v !== null && typeof v === 'number' && isFinite(v)) dps.push({ indicator_id: ci.id, entity_id: e?.id || null, value: Math.round(v * 1e6) / 1e6, date: dateStr, period_type: 'monthly', source_file: sourceFile, is_estimated: false }) } continue }
        if (matchedEntitySlug === 'egehid') continue
      }
    }
    const indicator = findIndicatorBySlug(indicators, name, indicatorPrefix)
    if (indicator) { lastParentSlug = indicator.slug; const e = entities.get(entitySlug); for (const [col, dateStr] of dateMap) { const v = getCellValue(sheet, row, col); if (v !== null && typeof v === 'number' && isFinite(v)) dps.push({ indicator_id: indicator.id, entity_id: e?.id || null, value: Math.round(v * 1e6) / 1e6, date: dateStr, period_type: 'monthly', source_file: sourceFile, is_estimated: false }) } }
    else {
      if (lastParentSlug) {
        const ti = indicators.get(`${lastParentSlug}-${slugify(name)}`) || indicators.get(`${indicatorPrefix}-${slugify(name)}`)
        if (ti) { for (const [col, dateStr] of dateMap) { const v = getCellValue(sheet, row, col); if (v !== null && typeof v === 'number' && isFinite(v)) dps.push({ indicator_id: ti.id, entity_id: null, value: Math.round(v * 1e6) / 1e6, date: dateStr, period_type: 'monthly', source_file: sourceFile, is_estimated: false }) } continue }
      }
      unmatched.add(`${sheetName}: ${name}`)
    }
  }
  return dps
}

// ============================================================
// SQL GENERATION
// ============================================================
function escapeSqlValue(val: unknown): string {
  if (val === null || val === undefined) return 'NULL'
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE'
  if (typeof val === 'number') return String(val)
  if (typeof val === 'string') return "'" + val.replace(/'/g, "''") + "'"
  return "'" + String(val).replace(/'/g, "''") + "'"
}

async function main() {
  console.log('═'.repeat(60))
  console.log('  PASO 6: Generador SQL — data_points desde XLS')
  console.log('═'.repeat(60))

  const envPath = path.resolve(__dirname, '../.env.local')
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
      const m = line.match(/^([A-Z_]+)=(.*)$/)
      if (m) process.env[m[1]] = m[2].trim()
    }
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } })

  // Load reference data
  console.log('🔄 Cargando datos de referencia...')
  const [indRes, entRes] = await Promise.all([
    supabase.from('indicators').select('id, name, slug, category_id, entity_id, is_breakdown, parent_indicator_id, unit'),
    supabase.from('entities').select('id, name, slug, type'),
  ])
  if (indRes.error) { console.error('❌', indRes.error.message); process.exit(1) }

  const indicators = new Map<string, IndicatorRow>()
  for (const ind of indRes.data || []) indicators.set(ind.slug, ind)
  buildIndicatorKeys(indicators)
  const entities = new Map<string, EntityRow>()
  for (const ent of entRes.data || []) entities.set(ent.slug, ent)
  console.log(`✅ ${indRes.data?.length} indicadores, ${entities.size} entidades`)

  // Parse XLS
  const xlsBuffer = fs.readFileSync(XLS_PATH)
  const workbook = XLSX.read(xlsBuffer, { type: 'buffer', cellDates: true })
  console.log(`📋 Hojas: ${workbook.SheetNames.join(', ')}`)

  const sourceFile = 'Informe-de-Desempeno-marzo-2026.xlsx'
  const allDps: DataPointInsert[] = []
  const unmatched = new Set<string>()

  const sheetConfigs = [
    { name: 'Variables Relevantes', entitySlug: '', prefix: '', parser: 'variables' as const },
    { name: "EDE's", entitySlug: 'edes-consolidado', prefix: '', parser: 'edes' as const },
    { name: 'CDEEE', entitySlug: 'cdeee', prefix: 'cdeee', parser: 'entity' as const },
    { name: 'EGEHID', entitySlug: 'egehid', prefix: 'egehid', parser: 'entity' as const },
    { name: 'ETED', entitySlug: 'eted', prefix: 'eted', parser: 'entity' as const },
    { name: 'EGPC', entitySlug: 'egpc', prefix: 'egpc', parser: 'entity' as const },
  ]

  for (const config of sheetConfigs) {
    if (sheetArg && config.name !== sheetArg) continue
    const sheet = workbook.Sheets[config.name]
    if (!sheet) { console.log(`⏭️  ${config.name}: no encontrada`); continue }
    console.log(`📊 Parseando: ${config.name}`)
    let dps: DataPointInsert[] = []
    if (config.parser === 'variables') dps = parseVariablesRelevantes(sheet, indicators, sourceFile, unmatched)
    else if (config.parser === 'edes') dps = parseEdesSheet(sheet, indicators, entities, sourceFile, unmatched)
    else dps = parseEntitySheet(sheet, config.name, config.entitySlug, config.prefix, indicators, entities, sourceFile, unmatched)
    console.log(`  📈 ${dps.length} data_points`)
    allDps.push(...dps)
  }

  console.log(`\n📊 Total: ${allDps.length.toLocaleString()} data_points, ${unmatched.size} sin match`)
  if (unmatched.size > 0) { console.log('  Sin match:'); for (const u of Array.from(unmatched).slice(0, 10)) console.log(`    - ${u}`) }

  // Generate SQL
  console.log('\n📝 Generando archivo SQL...')
  const sqlLines: string[] = [
    '-- ============================================',
    '-- PASO 6: Seed de data_points desde XLS',
    `-- Generado: ${new Date().toISOString()}`,
    `-- Total data_points: ${allDps.length}`,
    `-- Fuente: ${sourceFile}`,
    '-- ============================================',
    '',
    '-- Usar ON CONFLICT para evitar duplicados',
    '-- El unique index usa COALESCE para manejar entity_id NULL',
    '',
  ]

  // Generate in batches of 1000 for readability
  const BATCH = 1000
  for (let i = 0; i < allDps.length; i += BATCH) {
    const batch = allDps.slice(i, i + BATCH)
    sqlLines.push(`-- Batch ${Math.floor(i / BATCH) + 1} / ${Math.ceil(allDps.length / BATCH)} (${batch.length} registros)`)
    sqlLines.push('INSERT INTO data_points (indicator_id, entity_id, value, date, period_type, source_file, is_estimated)')
    sqlLines.push('VALUES')
    const values = batch.map((dp, j) => {
      const vals = [
        escapeSqlValue(dp.indicator_id),
        escapeSqlValue(dp.entity_id),
        escapeSqlValue(dp.value),
        escapeSqlValue(dp.date),
        escapeSqlValue(dp.period_type),
        escapeSqlValue(dp.source_file),
        escapeSqlValue(dp.is_estimated),
      ].join(', ')
      return `  (${vals})${j < batch.length - 1 ? ',' : ''}`
    })
    sqlLines.push(values.join('\n'))
    sqlLines.push('ON CONFLICT (indicator_id, date, COALESCE(entity_id, ' + "'00000000-0000-0000-0000-000000000000'" + ')) DO NOTHING;')
    sqlLines.push('')
  }

  const outputPath = path.resolve(__dirname, '../download/003_seed_data_points.sql')
  fs.writeFileSync(outputPath, sqlLines.join('\n'))
  console.log(`✅ SQL generado: ${outputPath}`)
  console.log(`   Tamaño: ${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(1)} MB`)
  console.log(`   Líneas: ${sqlLines.length}`)
  console.log('\n📋 Ejecuta este archivo en el SQL Editor de Supabase:')
  console.log('   https://supabase.com/dashboard/project/vdkifczcjezcfqmdzkow/sql')
}

main().catch(err => { console.error('❌', err); process.exit(1) })
