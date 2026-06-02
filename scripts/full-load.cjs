/**
 * Carga Completa de Datos Históricos — v5
 * Normalización robusta: sin mayúsculas, sin acentos, slug consistente
 * 
 * Uso: 
 *   node scripts/full-load.cjs              # carga completa
 *   node scripts/full-load.cjs --clean      # limpia data_points antes de cargar
 *   node scripts/full-load.cjs --dry-run    # solo extrae, no inserta
 *   node scripts/full-load.cjs --sheet "CDEEE"  # solo una hoja
 */
const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load env
const envContent = fs.readFileSync(path.resolve(__dirname, '..', '.env.local'), 'utf-8');
for (const line of envContent.split('\n')) {
  const match = line.match(/^([A-Z_]+)=(.*)$/);
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2].trim();
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Parse args
const args = process.argv.slice(2);
const shouldClean = args.includes('--clean');
const dryRun = args.includes('--dry-run');
const sheetArgIdx = args.indexOf('--sheet');
const specificSheet = sheetArgIdx !== -1 ? args[sheetArgIdx + 1] : null;
const INSERT_BATCH_SIZE = 500; // For DB inserts (larger = faster)
const DRY_RUN_BATCH_SIZE = 100; // User requested batch display size

// ============================================================
// NORMALIZATION — The core fix
// ============================================================

/**
 * Strip ALL accents and diacritics from a string.
 * Handles: áéíóú àèìòù äëïöü ñ ç âêîôû etc.
 * Uses NFD decomposition to separate base chars from combining marks.
 */
function stripAccents(text) {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Master slugify: fully normalized, no accents, no uppercase.
 * This is the ONE function used for ALL slug operations.
 * - Converts to lowercase
 * - Strips all accents (á→a, é→e, ñ→n, etc.)
 * - Replaces $ with 'd' (for USD)
 * - Removes content in parentheses (units like "(GWh)", "(USD MM)")
 * - Replaces # with "no" (Fuel Oil #2 → fuel-oil-no-2)
 * - Collapses all non-alphanumeric to hyphens
 * - Trims and collapses hyphens
 */
function slugify(text) {
  let t = text.trim();
  // Remove content in parentheses FIRST (units like "(GWh)", "(cUSD/kWh)")
  // But keep parentheses content that's a known code (like "EDE's")
  t = t.replace(/\s*\([^)]*\)\s*/g, ' ');
  // Strip accents
  t = stripAccents(t);
  // Lowercase
  t = t.toLowerCase();
  // Replace $ with 'd'
  t = t.replace(/\$/g, 'd');
  // Replace # with 'no'
  t = t.replace(/#/g, 'no');
  // Remove apostrophes (EDE's → edes)
  t = t.replace(/[''\u2019]/g, '');
  // Remove dots after numbers (No. → No)
  t = t.replace(/\./g, '');
  // Replace all non-alphanumeric with hyphen
  t = t.replace(/[^a-z0-9]+/g, '-');
  // Collapse hyphens
  t = t.replace(/-+/g, '-');
  // Trim hyphens
  t = t.replace(/^-|-$/g, '');
  return t;
}

/**
 * Normalized slug for lookup: same as slugify but also:
 * - Removes "de", "del", "y", "por", "en" articles to improve matching
 * - Removes trailing unit fragments
 */
function normalizeSlug(text) {
  let s = slugify(text);
  // Remove common Spanish connector words that may or may not appear in DB slugs
  // Be careful: only remove when they're standalone segments between hyphens
  const removable = ['de', 'del', 'y', 'por', 'en', 'la', 'el', 'los', 'las'];
  const parts = s.split('-');
  const filtered = parts.filter(p => !removable.includes(p));
  return filtered.join('-');
}

/**
 * Normalize text for name-based matching (more aggressive than slugify).
 */
function normalizeForMatch(text) {
  let t = text.trim();
  t = stripAccents(t);
  t = t.toLowerCase();
  t = t.replace(/[^a-z0-9\s]/g, '');
  t = t.replace(/\s+/g, ' ').trim();
  return t;
}

// ============================================================
// ENTITY MAPPING
// ============================================================
const ENTITY_MAP = {
  'edenorte': 'edenorte', 'edesur': 'edesur', 'edeeste': 'edeeste',
  "ede's": 'edes-consolidado', 'edes': 'edes-consolidado', 'total edes': 'edes-consolidado',
  'cdeee': 'cdeee', 'egehid': 'egehid', 'eted': 'eted', 'egpc': 'egpc',
  'punta catalina': 'egpc', 'gsf': 'gsf', 'cespm': 'cespm', 'dpp': 'dpp',
  'egehaina': 'egehaina-larimar', 'larimar': 'egehaina-larimar',
  'electronic jrc': 'electronic-jrc', 'montecristi solar': 'montecristi-solar',
  'c power': 'c-power', 'cpower': 'c-power', 'pecasa': 'pecasa',
  'matafongo': 'matafongo', 'wcg energy': 'wcg-energy', 'wcg': 'wcg-energy',
  'emerald solar': 'emerald-solar', 'poseidon': 'poseidon',
  'quisqueya ii': 'quisqueya-ii', 'quisqueya': 'quisqueya-ii',
  'falcondo': 'falcondo', 'rsj': 'rsj', 'mercado spot': 'mercado-spot', 'spot': 'mercado-spot',
  'unr': 'unr', 'gencos': 'gencos', 'genco': 'gencos',
};

const ENTITY_PATTERNS = [
  { pattern: /egehaina.*larimar/i, slug: 'egehaina-larimar' },
  { pattern: /electronic\s*jrc/i, slug: 'electronic-jrc' },
  { pattern: /montecristi\s*solar/i, slug: 'montecristi-solar' },
  { pattern: /c\s*power/i, slug: 'c-power' },
  { pattern: /wcg\s*energy/i, slug: 'wcg-energy' },
  { pattern: /emerald\s*solar/i, slug: 'emerald-solar' },
  { pattern: /punta\s*catalina/i, slug: 'egpc' },
  { pattern: /mercado\s*spot/i, slug: 'mercado-spot' },
  { pattern: /quisqueya\s*ii/i, slug: 'quisqueya-ii' },
  { pattern: /renovables\s*contratos/i, slug: 'renovables-contratos-cdeee' },
];

function findEntitySlug(name) {
  const l = name.toLowerCase().trim().replace(/\s+/g, ' ');
  // Exact match first
  for (const [k, s] of Object.entries(ENTITY_MAP)) {
    if (l === k) return s;
  }
  // Pattern match
  for (const { pattern, slug } of ENTITY_PATTERNS) {
    if (pattern.test(l)) return slug;
  }
  // Contains match
  for (const [k, s] of Object.entries(ENTITY_MAP)) {
    if (l.includes(k)) return s;
  }
  return null;
}

// ============================================================
// VR SECTION MAPPING
// ============================================================
const VR_GENERATION_MAP = {
  'total generacion': 'total-generacion',
  'carbon mineral': 'generacion-carbon-mineral',
  'gas natural': 'generacion-gas-natural',
  'fuel oil no 2': 'generacion-fuel-oil-2',
  'fuel oil no 6': 'generacion-fuel-oil-6',
  'fuel oil no 2 y no 6': 'generacion-fuel-oil-2-y-6',
  'fuel oil 2': 'generacion-fuel-oil-2',
  'fuel oil 6': 'generacion-fuel-oil-6',
  'fuel oil 2 y 6': 'generacion-fuel-oil-2-y-6',
  'hidraulica': 'generacion-hidraulica',
  'eolica': 'generacion-eolica',
  'solar fotovoltaica': 'generacion-solar-fv',
  'biomasa': 'generacion-biomasa',
  'total renovable no convencional': 'total-renovable-no-convencional',
};

const VR_COMPOSITION_MAP = {
  'carbon mineral': 'composicion-carbon-mineral-pp',
  'gas natural': 'composicion-gas-natural-pp',
  'fuel oil no 2': 'composicion-fuel-oil-2-pp',
  'fuel oil no 6': 'composicion-fuel-oil-6-pp',
  'fuel oil no 2 y no 6': 'composicion-fuel-oil-2-y-6-pp',
  'fuel oil 2': 'composicion-fuel-oil-2-pp',
  'fuel oil 6': 'composicion-fuel-oil-6-pp',
  'fuel oil 2 y 6': 'composicion-fuel-oil-2-y-6-pp',
  'hidraulica': 'composicion-hidraulica-pp',
  'eolica': 'composicion-eolica-pp',
  'solar fotovoltaica': 'composicion-solar-fv-pp',
  'biomasa': 'composicion-biomasa-pp',
  'total renovable no convencional': 'composicion-total-renovable-no-convencional-pp',
};

// Manual override map: XLS exact text → DB slug (null = skip)
const MANUAL_MAP = {
  // VR — Costos vs Costo (singular in DB)
  'Costos Marginal de Energía (cUSD$/KWh)': 'costo-marginal-energia',
  'Costos Marginal de Potencia  (cUSD/kW-Mes)': 'costo-marginal-potencia',
  'Peaje de Transmisión (cUSD/KWh)': 'peaje-transmision',
  'Derecho de Conexión Unitario (USD/kW-mes)': 'derecho-conexion-unitario',
  // VR — Fuel Oil # notation
  'Fuel Oil # 2 (US$/BBL)': 'fuel-oil-2-usd-bbl',
  'Fuel Oil # 2 (US$/MMBTU)': 'fuel-oil-2-usd-mmbtu',
  'Fuel Oil # 6 (US$/BBL)': 'fuel-oil-6-usd-bbl',
  'Fuel Oil # 6 (US$/MMBTU)': 'fuel-oil-6-usd-mmbtu',
  // EDE's — Movil vs Móvil, Indice vs Índice
  'Pérdidas - Año Movil (%)': 'perdidas-ano-movil-porcentaje',
  'Cobranzas - Año Movil (%)': 'cobranzas-ano-movil-porcentaje',
  'CRI - Año Movil (%)': 'cri-ano-movil-porcentaje',
  'Indice de Recuperación de Energía (%)': 'ire-porcentaje',
  'Indice de Recuperación de Energía - Año Movil (%)': 'ire-ano-movil-porcentaje',
  // EDE's — price/income names
  'Precio Medio de Venta de Energía (cUSD/kWh)': 'precio-medio-venta-energia-cusd-kwh',
  'Precio Medio de Venta de Energía (DOP/kWh)': 'precio-medio-venta-energia-dop-kwh',
  'Precio Medio de Compra de Energía (cUSD/kWh)': 'precio-medio-compra-energia-cusd-kwh',
  'Precio Medio de Compra de Energía CONTRATOS (cUSD/kWh)': 'precio-medio-compra-energia-contratos-cusd-kwh',
  'Precio Medio de Compra de Energía SPOT (cUSD/kWh)': 'precio-medio-compra-energia-spot-cusd-kwh',
  'Factura por Venta de Energía (USD MM)': 'factura-venta-energia-usd-mm',
  'Factura por Venta de Energía (DOP MM)': 'factura-venta-energia-dop-mm',
  'Factura por Compra de Energía (USD MM)': 'factura-compra-energia-usd-mm',
  'Factura por Compra de Energía CONTRATOS (USD MM)': 'factura-compra-energia-contratos-usd-mm',
  'Factura por Compra de Energía SPOT (USD MM)': 'factura-compra-energia-spot-usd-mm',
  'Otros Ingresos (USD MM)': 'otros-ingresos-edes-usd-mm',
  'Otros (USD MM)': 'otros-gastos-edes-usd-mm',
  // EDE's — other names
  'Gastos Operativos (USD MM)': 'gastos-operativos-edes-usd-mm',
  'FETE (USD MM)': 'fete-usd-mm',
  'Otros Cobros (USD MM)': 'otros-cobros-usd-mm',
  'Gastos de Personal (USD MM)': 'gastos-personal-edes-usd-mm',
  'Proveedores (USD MM)': 'proveedores-usd-mm',
  'Impuestos (USD MM)': 'impuestos-usd-mm',
  'Pagos a Instituciones Regulatorias (USD MM)': 'pagos-instituciones-regulatorias-usd-mm',
  'Pagos Ayuntamientos y compensaciones (USD MM)': 'pagos-ayuntamientos-compensaciones-usd-mm',
  'Gastos Financieros (USD MM)': 'gastos-financieros-edes-usd-mm',
  'Inversiones Total (USD MM)': 'inversiones-total-edes-usd-mm',
  'Pérdidas (GWh)': 'perdidas-gwh',
  'Pérdidas (%)': 'perdidas-porcentaje',
  'Cobranzas (%)': 'cobranzas-porcentaje',
  'CRI (%)': 'cri-porcentaje',
  'Disponibilidad': 'disponibilidad-edes',
  'Compra de Energía (GWh)': 'compra-energia-gwh',
  'Energía Facturada (GWh)': 'energia-facturada-gwh',
  'Energía Cobrada (GWh)': 'energia-cobrada-gwh',
  'Cobros por Energía (USD MM)': 'cobros-energia-usd-mm',
  'Cobros por Energía (DOP MM)': 'cobros-energia-dop-mm',
  'Cantidad de Clientes Facturados': 'clientes-facturados',
  'Cantidad de Clientes Bonoluz': 'clientes-bonoluz',
  "Cantidad de Empleados EDE's": 'empleados-edes',
  // CDEEE — name variations
  'Energía Comprada  (GWh)': 'cdeee-energia-comprada-gwh',
  'Precio Medio de Compra (USCents/KWh)': 'cdeee-precio-medio-compra',
  'Factura por Compra de Energía  (US$ MM)': 'cdeee-factura-compra-energia',
  'Total de Energía Facturada (GWh)': 'cdeee-energia-facturada-gwh',
  'Precio Medio de Venta (USCents/KWh)': 'cdeee-precio-medio-venta',
  'Total Facturado (US$ MM)': 'cdeee-total-facturado-usd-mm',
  'Otros Ingresos (US$ MM)': 'cdeee-otros-ingresos-usd-mm',
  'Gastos Operativos (US$ MM)': 'cdeee-gastos-operativos-usd-mm',
  'Gastos de Personal': 'cdeee-gastos-personal',
  'Servicios No Personales': 'cdeee-servicios-no-personales',
  'Materiales y Suministros': 'cdeee-materiales-suministros',
  'Otros Gastos (Incluye Pagos a Instituciones Regulatorias)': 'cdeee-otros-gastos',
  'Egresos Financieros (US$ MM)': 'cdeee-egresos-financieros-usd-mm',
  'Inversiones (US$ MM)': 'cdeee-inversiones-usd-mm',
  'Cantidad de Empleados Cdeee': 'cdeee-empleados',
  'Cantidad de Empleados CDEEE': 'cdeee-empleados',
  // CDEEE skip items (sub-items that don't have their own indicator)
  'Intereses por Financiamientos': null,
  'Renovables contratos con CDEEE': null,
  // EGEHID
  'Energía Facturada  (GWh)': 'egehid-energia-facturada-gwh',
  'Precio Medio de Venta de Energía (cUSD/kWh)': 'egehid-precio-medio-venta',
  'Factura por Venta de Energía (USD MM)': 'egehid-factura-venta-energia',
  'Otros Ingresos (USD MM)': 'egehid-otros-ingresos',
  'Gastos Operativos (USD MM)': 'egehid-gastos-operativos',
  'Egresos Financieros (USD MM)': 'egehid-egresos-financieros',
  'Inversiones (USD MM)': 'egehid-inversiones',
  'Cantidad de Empleados Egehid': 'egehid-empleados',
  'Cantidad de Empleados EGEHID': 'egehid-empleados',
  // EGPC
  'Total de Energía Facturada (GWh)': 'egpc-energia-facturada-gwh',
  'Total Facturado (USD MM)': 'egpc-total-facturado-usd-mm',
  'Total Costos de Producción': 'egpc-costos-produccion',
  'Cargos del Mercado Electrico Mayorista': 'egpc-cargos-mem',
  'Gastos por Aporte Sector Electrico': 'egpc-gastos-aporte-sector',
  'Gastos de  Depreciación y Amortización (USD MM)': 'egpc-depreciacion-amortizacion',
  'Precio Medio de Venta (cUSD/KWh)': 'egpc-precio-medio-venta',
  'Total Gastos Operativos (USD MM)': 'egpc-gastos-operativos',
  'Total Gastos Financieros (USD MM)': 'egpc-gastos-financieros',
  'Total Otros Ingresos (USD MM)': 'egpc-otros-ingresos',
  'Total Otros Gastos (USD MM)': 'egpc-otros-gastos',
  'Total Inversiones (USD MM)': 'egpc-inversiones',
  'Cantidad de Empleados EGEPC': 'egpc-empleados',
  // EGPC skip
  'Costos Directos': null,
  'Costos Personal Producción': null,
  'Otros Costos Operativos de Producción': null,
  'Empleados Fijos': null,
  'Dieta Militares': null,
  // ETED
  'Peaje Total (USD MM)': 'eted-peaje-total',
  'Gastos Operativos (US$ MM)': 'eted-gastos-operativos',
  'Egresos Financieros (USD MM)': 'eted-egresos-financieros',
  'Inversiones (USD MM)': 'eted-inversiones',
  'Total Empleados ETED': 'eted-empleados',
  'Otros Ingresos (USD MM)': 'eted-otros-ingresos',
  // Shared skip
  'Mercado de Contratos': null,
};

// ============================================================
// INDICATOR LOOKUP BUILDER
// ============================================================

/**
 * Build a multi-key lookup map for indicators.
 * For each indicator, we index it by:
 * 1. Its original slug (as stored in DB)
 * 2. A fully normalized version of the slug (strip accents, lowercase)
 * 3. A normalized version without connector words (de, del, y, etc.)
 * 4. The normalized name
 */
function buildIndicatorLookup(indicators) {
  const lookup = new Map(); // key → indicator
  const stats = { byOriginalSlug: 0, byNormalizedSlug: 0, bySimplifiedSlug: 0, byNormName: 0 };

  for (const ind of indicators) {
    // 1. Original slug
    const original = ind.slug;
    if (!lookup.has(original)) {
      lookup.set(original, ind);
      stats.byOriginalSlug++;
    }

    // 2. Normalized slug (in case DB has any accent/uppercase we missed)
    const normalized = slugify(ind.name); // re-slugify from the name
    if (normalized && !lookup.has(normalized)) {
      lookup.set(normalized, ind);
      stats.byNormalizedSlug++;
    }

    // 3. Simplified slug (remove connector words)
    const simplified = normalizeSlug(ind.name);
    if (simplified && simplified !== normalized && !lookup.has(simplified)) {
      lookup.set(simplified, ind);
      stats.bySimplifiedSlug++;
    }

    // 4. Normalized name (for name-based matching)
    const normName = normalizeForMatch(ind.name);
    if (normName && !lookup.has('name:' + normName)) {
      lookup.set('name:' + normName, ind);
      stats.byNormName++;
    }
  }

  console.log(`  Lookup keys: ${lookup.size} (original:${stats.byOriginalSlug} normalized:${stats.byNormalizedSlug} simplified:${stats.bySimplifiedSlug} name:${stats.byNormName})`);
  return lookup;
}

/**
 * Find indicator for an XLS row name.
 * Tries multiple strategies in order of specificity.
 */
function findIndicator(xlsName, prefix, lookup) {
  // Check manual map first
  if (MANUAL_MAP.hasOwnProperty(xlsName)) {
    const mappedSlug = MANUAL_MAP[xlsName];
    if (mappedSlug === null) return { match: null, strategy: 'manual-skip' };
    const found = lookup.get(mappedSlug);
    if (found) return { match: found, strategy: 'manual' };
    // Try with normalized slug of the mapped value
    const normMapped = slugify(mappedSlug);
    const found2 = lookup.get(normMapped);
    if (found2) return { match: found2, strategy: 'manual-norm' };
  }

  // Strategy 1: slugify the XLS name (standard normalization)
  const xlsSlug = slugify(xlsName);
  if (prefix) {
    const prefixed = prefix + '-' + xlsSlug;
    if (lookup.has(prefixed)) return { match: lookup.get(prefixed), strategy: 'prefix-slug' };
  }
  if (lookup.has(xlsSlug)) return { match: lookup.get(xlsSlug), strategy: 'slug' };

  // Strategy 2: simplified slug (remove connector words)
  const xlsSimple = normalizeSlug(xlsName);
  if (xlsSimple !== xlsSlug) {
    if (prefix) {
      const prefixed = prefix + '-' + xlsSimple;
      if (lookup.has(prefixed)) return { match: lookup.get(prefixed), strategy: 'prefix-simple' };
    }
    if (lookup.has(xlsSimple)) return { match: lookup.get(xlsSimple), strategy: 'simple' };
  }

  // Strategy 3: Try keeping parentheses content (for units that are part of the slug)
  const xlsSlugWithParens = (() => {
    let t = xlsName.trim();
    t = stripAccents(t);
    t = t.toLowerCase();
    t = t.replace(/\$/g, 'd');
    t = t.replace(/#/g, 'no');
    t = t.replace(/[''\u2019]/g, '');
    t = t.replace(/\./g, '');
    t = t.replace(/[()]/g, '-');
    t = t.replace(/[^a-z0-9]+/g, '-');
    t = t.replace(/-+/g, '-');
    t = t.replace(/^-|-$/g, '');
    return t;
  })();
  if (xlsSlugWithParens !== xlsSlug) {
    if (prefix) {
      const prefixed = prefix + '-' + xlsSlugWithParens;
      if (lookup.has(prefixed)) return { match: lookup.get(prefixed), strategy: 'prefix-parens' };
    }
    if (lookup.has(xlsSlugWithParens)) return { match: lookup.get(xlsSlugWithParens), strategy: 'parens' };
  }

  // Strategy 4: normalized name match
  const normName = normalizeForMatch(xlsName);
  if (lookup.has('name:' + normName)) return { match: lookup.get('name:' + normName), strategy: 'normName' };

  // Strategy 5: Try singular form (Costos → Costo)
  const singularized = xlsName.replace(/^Costos\s+/, 'Costo ');
  if (singularized !== xlsName) {
    const singSlug = slugify(singularized);
    if (prefix) {
      const prefixed = prefix + '-' + singSlug;
      if (lookup.has(prefixed)) return { match: lookup.get(prefixed), strategy: 'prefix-singular' };
    }
    if (lookup.has(singSlug)) return { match: lookup.get(singSlug), strategy: 'singular' };
  }

  // Strategy 6: Fix common accent mismatches in XLS
  const fixedAccents = xlsName
    .replace(/Movil/g, 'Móvil')
    .replace(/Indice/g, 'Índice')
    .replace(/Electrico/g, 'Eléctrico')
    .replace(/Cdeee/g, 'CDEEE')
    .replace(/Egehid/g, 'EGEHID')
    .replace(/Egepc/g, 'EGEPC');
  if (fixedAccents !== xlsName) {
    const fixedSlug = slugify(fixedAccents);
    if (prefix) {
      const prefixed = prefix + '-' + fixedSlug;
      if (lookup.has(prefixed)) return { match: lookup.get(prefixed), strategy: 'prefix-accent' };
    }
    if (lookup.has(fixedSlug)) return { match: lookup.get(fixedSlug), strategy: 'accent' };
  }

  return { match: null };
}

// ============================================================
// XLS HELPERS
// ============================================================
function parseExcelDate(value) {
  if (!value) return null;
  if (value instanceof Date) {
    if (isNaN(value.getTime())) return null;
    return value.toISOString().split('T')[0];
  }
  if (typeof value === 'number') {
    const date = new Date((value - 25569) * 86400000);
    if (isNaN(date.getTime())) return null;
    return date.toISOString().split('T')[0];
  }
  if (typeof value === 'string') {
    const d = new Date(value);
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  }
  return null;
}

function getCellValue(sheet, row, col) {
  const addr = XLSX.utils.encode_cell({ r: row, c: col });
  const cell = sheet[addr];
  return cell ? cell.v : null;
}

function findDateColumns(sheet, headerRow, startCol) {
  const dateMap = new Map();
  if (!sheet['!ref']) return dateMap;
  const range = XLSX.utils.decode_range(sheet['!ref']);
  for (let col = startCol; col <= range.e.c; col++) {
    const cell = sheet[XLSX.utils.encode_cell({ r: headerRow, c: col })];
    if (!cell) continue;
    const dateStr = parseExcelDate(cell.v);
    if (dateStr) {
      const year = parseInt(dateStr.substring(0, 4), 10);
      if (year >= 2008 && year <= 2030) {
        dateMap.set(col, dateStr);
      }
    }
  }
  return dateMap;
}

function rowHasData(sheet, row, dateCols) {
  for (const col of dateCols.keys()) {
    const v = getCellValue(sheet, row, col);
    if (v !== null && typeof v === 'number' && isFinite(v)) return true;
  }
  return false;
}

// ============================================================
// MAIN
// ============================================================
async function run() {
  const t0 = Date.now();
  console.log('═'.repeat(60));
  console.log('  CARGA COMPLETA DE DATOS HISTÓRICOS — v5');
  console.log('  Normalización: sin mayúsculas, sin acentos');
  console.log('═'.repeat(60) + '\n');

  // 1. Check current state
  const { count: currentDP } = await supabase.from('data_points').select('*', { count: 'exact', head: true });
  const { count: indCount } = await supabase.from('indicators').select('*', { count: 'exact', head: true });
  const { count: entCount } = await supabase.from('entities').select('*', { count: 'exact', head: true });
  console.log(`📊 Estado actual: ${currentDP?.toLocaleString()} data_points, ${indCount} indicadores, ${entCount} entidades\n`);

  // 2. Optionally clean
  if (shouldClean && currentDP > 0) {
    console.log('🗑️  Limpiando data_points existentes...');
    const { error } = await supabase.from('data_points').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) { console.error('❌ Error:', error.message); process.exit(1); }
    console.log('✅ Data_points limpiados\n');
  }

  // 3. Load reference data
  console.log('📥 Cargando datos de referencia...');
  const { data: indicators } = await supabase.from('indicators').select('id, name, slug, category_id, is_breakdown, parent_indicator_id, unit').order('slug');
  const { data: entities } = await supabase.from('entities').select('id, name, slug, type');

  // Build multi-key lookup
  console.log('  Construyendo lookup multi-key...');
  const lookup = buildIndicatorLookup(indicators);

  const entMap = new Map();
  for (const e of entities || []) entMap.set(e.slug, e);

  // 4. Parse XLS
  const xlsPath = path.resolve(__dirname, '..', 'upload', 'Informe-de-Desempeno-marzo-2026.xlsx');
  console.log(`\n📄 Leyendo: ${xlsPath}`);
  const fileBuffer = fs.readFileSync(xlsPath);
  console.log(`   Tamaño: ${(fileBuffer.length / 1024 / 1024).toFixed(1)} MB`);

  const wb = XLSX.read(fileBuffer, { type: 'buffer', cellDates: true });
  console.log(`   Hojas: ${wb.SheetNames.join(', ')}\n`);

  const sheetConfigs = [
    { name: 'Variables Relevantes', parser: 'vr', eSlug: '', prefix: '', headerRow: 6, dataStartRow: 7 },
    { name: "EDE's", parser: 'edes', eSlug: 'edes-consolidado', prefix: '', headerRow: 6, dataStartRow: 7 },
    { name: 'CDEEE', parser: 'ent', eSlug: 'cdeee', prefix: 'cdeee', headerRow: 6, dataStartRow: 7 },
    { name: 'EGEHID', parser: 'ent', eSlug: 'egehid', prefix: 'egehid', headerRow: 6, dataStartRow: 7 },
    { name: 'ETED', parser: 'ent', eSlug: 'eted', prefix: 'eted', headerRow: 6, dataStartRow: 7 },
    { name: 'EGPC', parser: 'ent', eSlug: 'egpc', prefix: 'egpc', headerRow: 7, dataStartRow: 8 },
  ];

  const allDP = []; // Only used for dry-run summary
  let totalMatched = 0;
  let totalInserted = 0;
  let totalErrors = 0;
  const unmatchedDetails = [];
  const strategyCounts = {};
  const edeNames = ['edenorte', 'edesur', 'edeeste'];

  for (const s of sheetConfigs) {
    if (specificSheet && s.name !== specificSheet) continue;

    const sheet = wb.Sheets[s.name];
    if (!sheet) { console.log(`  ⏭️  ${s.name}: no encontrada`); continue; }

    const range = XLSX.utils.decode_range(sheet['!ref']);
    const dateMap = findDateColumns(sheet, s.headerRow, 11);

    console.log(`📊 Parseando: ${s.name}`);
    console.log(`   ${dateMap.size} columnas de fecha, ${range.e.r - s.dataStartRow + 1} filas totales`);

    let matched = 0;
    let lastSlug = null;
    const sheetDP = []; // Data points for THIS sheet only
    const startCount = allDP.length;

    // For VR sheet: track which section we're in
    let vrSection = 'prices';

    for (let r = s.dataStartRow; r <= range.e.r; r++) {
      const nameRaw = getCellValue(sheet, r, 1);
      if (!nameRaw) continue;
      const name = String(nameRaw).trim();
      if (!name) continue;
      const nameLower = name.toLowerCase().trim().replace(/\s+/g, ' ');

      // Check if has data
      const hasData = rowHasData(sheet, r, dateMap);

      // VR section headers (no data rows) — track context
      if (s.parser === 'vr' && !hasData) {
        const nl = stripAccents(nameLower);
        if (nl.includes('composici')) vrSection = 'composition';
        else if (nl.includes('generaci') && nl.includes('tipo')) vrSection = 'generation';
        else if (nl.includes('precios combust')) vrSection = 'prices';
        else if (nl.includes('mercado electrico mayorista') || nl.includes('mercado')) vrSection = 'mem';
        else if (nl.includes('tasa de cambio')) vrSection = 'exchange';
        continue;
      }

      if (!hasData) continue;

      // Check manual skip
      if (MANUAL_MAP.hasOwnProperty(name) && MANUAL_MAP[name] === null) continue;

      let ind = null;
      let eSlug2 = null;

      if (s.parser === 'vr') {
        // Variables Relevantes with section tracking
        // Normalize: strip accents, remove dots (No. → No), collapse spaces
        const nameNoAccent = stripAccents(nameLower).replace(/\./g, '').replace(/\s+/g, ' ').trim();
        
        if (vrSection === 'generation' && VR_GENERATION_MAP[nameNoAccent]) {
          ind = lookup.get(VR_GENERATION_MAP[nameNoAccent]);
          if (ind) { strategyCounts['vr-generation'] = (strategyCounts['vr-generation'] || 0) + 1; }
        } else if (vrSection === 'composition' && VR_COMPOSITION_MAP[nameNoAccent]) {
          ind = lookup.get(VR_COMPOSITION_MAP[nameNoAccent]);
          if (ind) { strategyCounts['vr-composition'] = (strategyCounts['vr-composition'] || 0) + 1; }
        } else {
          const result = findIndicator(name, s.prefix, lookup);
          if (result.match) { ind = result.match; strategyCounts[result.strategy] = (strategyCounts[result.strategy] || 0) + 1; }
        }
      } else if (s.parser === 'edes') {
        const edeM = edeNames.find(e => nameLower === e);
        if (edeM && lastSlug) {
          // Child breakdown (Edenorte/Edesur/Edeeste)
          const childSlug = lastSlug + '-' + edeM;
          ind = lookup.get(childSlug);
          if (ind) {
            eSlug2 = edeM;
          } else {
            // Try with normalized child slug
            const normChild = slugify(name);
            ind = lookup.get(lastSlug + '-' + normChild);
            if (ind) eSlug2 = edeM;
          }
          if (!ind) {
            // EDE breakdown didn't match — don't report as unmatched
            // (the parent was matched, this child just doesn't have its own indicator)
            continue;
          }
        } else {
          const result = findIndicator(name, s.prefix, lookup);
          if (result.match) {
            ind = result.match;
            lastSlug = ind.slug;
            eSlug2 = 'edes-consolidado';
            strategyCounts[result.strategy] = (strategyCounts[result.strategy] || 0) + 1;
          } else {
            lastSlug = null;
            // Don't add to unmatched for EDE names (they're breakdowns)
            if (!edeM) unmatchedDetails.push({ sheet: s.name, name, row: r });
            continue;
          }
        }
      } else {
        // Entity sheets (CDEEE, EGEHID, ETED, EGPC)
        const detectedEntity = findEntitySlug(name);

        if (detectedEntity && lastSlug) {
          // Entity breakdown row
          const childSlug = lastSlug + '-' + detectedEntity;
          ind = lookup.get(childSlug);
          if (ind) {
            eSlug2 = detectedEntity;
          } else {
            // Try as text breakdown
            const textSlug = lastSlug + '-' + slugify(name);
            ind = lookup.get(textSlug);
          }
        }

        if (!ind) {
          // Try as parent indicator
          const result = findIndicator(name, s.prefix, lookup);
          if (result.match) {
            ind = result.match;
            lastSlug = ind.slug;
            eSlug2 = s.eSlug;
            strategyCounts[result.strategy] = (strategyCounts[result.strategy] || 0) + 1;
          } else if (detectedEntity) {
            // This is an entity name that doesn't match as a breakdown
            // Skip it — it's probably a sub-row under the last parent
            continue;
          } else if (lastSlug) {
            // Try as text breakdown of last parent
            const textSlug = lastSlug + '-' + slugify(name);
            ind = lookup.get(textSlug);
            if (!ind) {
              const simpleSlug = lastSlug + '-' + normalizeSlug(name);
              ind = lookup.get(simpleSlug);
            }
            if (!ind) {
              unmatchedDetails.push({ sheet: s.name, name, row: r });
              continue;
            }
          } else {
            unmatchedDetails.push({ sheet: s.name, name, row: r });
            continue;
          }
        }
      }

      if (!ind) {
        unmatchedDetails.push({ sheet: s.name, name, row: r });
        continue;
      }

      matched++;

      const entity = eSlug2 ? entMap.get(eSlug2) : null;
      for (const [col, dateStr] of dateMap) {
        const value = getCellValue(sheet, r, col);
        if (value !== null && typeof value === 'number' && isFinite(value)) {
          const dp = {
            indicator_id: ind.id,
            entity_id: entity?.id || null,
            value: Math.round(value * 1e6) / 1e6,
            date: dateStr,
            period_type: 'monthly',
            source_file: 'Informe-de-Desempeno-marzo-2026.xlsx',
            is_estimated: false,
          };
          sheetDP.push(dp);
          allDP.push(dp);
        }
      }
    }

    totalMatched += matched;
    console.log(`   ✅ ${matched} indicadores matcheados, ${sheetDP.length.toLocaleString()} data_points`);

    // Deduplicate sheet data
    const seen = new Set();
    const dedupedSheet = [];
    for (const dp of sheetDP) {
      const key = dp.indicator_id + '|' + dp.date + '|' + (dp.entity_id || '');
      if (!seen.has(key)) { seen.add(key); dedupedSheet.push(dp); }
    }
    console.log(`   📋 Deduplicados: ${dedupedSheet.length.toLocaleString()} (removidos ${sheetDP.length - dedupedSheet.length})`);

    // Insert this sheet's data immediately (don't wait for all sheets)
    if (!dryRun && dedupedSheet.length > 0) {
      console.log(`   💾 Insertando ${dedupedSheet.length.toLocaleString()} data_points...`);
      let sheetInserted = 0;
      let sheetErrors = 0;

      for (let i = 0; i < dedupedSheet.length; i += INSERT_BATCH_SIZE) {
        const batch = dedupedSheet.slice(i, i + INSERT_BATCH_SIZE);
        const batchNum = Math.floor(i / INSERT_BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(dedupedSheet.length / INSERT_BATCH_SIZE);

        const { data, error } = await supabase
          .from('data_points')
          .insert(batch)
          .select('id');

        if (error) {
          console.error(`      ❌ Lote ${batchNum}/${totalBatches}: ${error.message}`);
          // Try individually
          for (const dp of batch) {
            const { error: e2 } = await supabase.from('data_points').insert(dp);
            if (e2) { if (!e2.message.includes('duplicate')) sheetErrors++; }
            else sheetInserted++;
          }
        } else {
          sheetInserted += data?.length || batch.length;
        }

        if (totalBatches > 1 && (batchNum % 20 === 0 || batchNum === totalBatches)) {
          console.log(`      ${Math.min(100, ((i + INSERT_BATCH_SIZE) / dedupedSheet.length * 100)).toFixed(0)}% — ${sheetInserted.toLocaleString()} insertados`);
        }
      }

      totalInserted += sheetInserted;
      totalErrors += sheetErrors;
      console.log(`   ✅ Insertados: ${sheetInserted.toLocaleString()}, Errores: ${sheetErrors}\n`);
    } else {
      console.log(`   📈 Total acumulado: ${allDP.length.toLocaleString()} data_points\n`);
    }
  }

  // Summary
  const dates = allDP.map(dp => dp.date).sort();
  console.log('═'.repeat(60));
  console.log('📊 RESUMEN DE EXTRACCIÓN:');
  console.log(`   Indicadores matcheados: ${totalMatched}`);
  console.log(`   Data points extraídos: ${allDP.length.toLocaleString()}`);
  if (dates.length > 0) console.log(`   Rango: ${dates[0]} → ${dates[dates.length - 1]}`);
  console.log('═'.repeat(60));

  console.log('\n📊 Estrategias de matching:');
  for (const [s, c] of Object.entries(strategyCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`   ${s}: ${c}`);
  }

  if (unmatchedDetails.length > 0) {
    console.log(`\n⚠️  Indicadores sin match (${unmatchedDetails.length}):`);
    for (const u of unmatchedDetails) {
      console.log(`   [${u.sheet} R${u.row}] "${u.name}" → slug: "${slugify(u.name)}"`);
    }
  }

  if (dryRun) {
    console.log('\n🔧 DRY RUN — No se insertaron datos');
    console.log(`   Tiempo: ${((Date.now() - t0) / 1000).toFixed(1)}s`);
    process.exit(0);
  }

  if (allDP.length === 0) {
    console.log('❌ No se extrajeron data_points. Abortando.');
    process.exit(1);
  }

  const totalTime = ((Date.now() - t0) / 1000).toFixed(1);
  console.log('\n═'.repeat(60));
  console.log('✅ CARGA COMPLETADA');
  console.log(`   Insertados: ${totalInserted.toLocaleString()}`);
  console.log(`   Errores: ${totalErrors}`);
  console.log(`   Tiempo total: ${totalTime}s`);
  console.log('═'.repeat(60));

  // Final verification
  const { count: finalCount } = await supabase.from('data_points').select('*', { count: 'exact', head: true });
  console.log(`\n📊 Total data_points en BD: ${finalCount?.toLocaleString()}`);

  // Count indicators with data
  const { data: distinctInds } = await supabase
    .from('data_points')
    .select('indicator_id');
  const uniqueIndicators = new Set((distinctInds || []).map(d => d.indicator_id));
  console.log(`📊 Indicadores con datos: ${uniqueIndicators.size} de ${indCount}`);

  // Date range
  const { data: minD } = await supabase.from('data_points').select('date').order('date').limit(1);
  const { data: maxD } = await supabase.from('data_points').select('date').order('date', { ascending: false }).limit(1);
  console.log(`📊 Rango: ${minD?.[0]?.date || '?'} → ${maxD?.[0]?.date || '?'}`);
}

run().catch(e => { console.error('❌ Error fatal:', e); process.exit(1); });
