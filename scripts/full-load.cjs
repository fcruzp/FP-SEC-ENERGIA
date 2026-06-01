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

// ============================================================
// MANUAL MAPPING
// ============================================================
const MANUAL_MAP = {
  // VR — generation section (first occurrence of "Carbón Mineral" etc.)
  // These are handled via section tracking, not manual map

  // VR — plural/singular + accent differences
  'Costos Marginal de Energía (cUSD$/KWh)': 'costo-marginal-energia',
  'Costos Marginal de Potencia  (cUSD/kW-Mes)': 'costo-marginal-potencia',
  'Peaje de Transmisión (cUSD/KWh)': 'peaje-transmision',
  'Derecho de Conexión Unitario (USD/kW-mes)': 'derecho-conexion-unitario',

  // EDE's — accent differences
  'Otros (USD MM)': 'otros-gastos-edes-usd-mm',
  'Pérdidas - Año Movil (%)': 'perdidas-ano-movil-porcentaje',
  'Cobranzas - Año Movil (%)': 'cobranzas-ano-movil-porcentaje',
  'CRI - Año Movil (%)': 'cri-ano-movil-porcentaje',
  'Indice de Recuperación de Energía (%)': 'ire-porcentaje',
  'Indice de Recuperación de Energía - Año Movil (%)': 'ire-ano-movil-porcentaje',
  // EDE's — DB slugs simplified (removed "de" articles)
  'Precio Medio de Venta de Energía (cUSD/kWh)': 'precio-medio-venta-energia-cusd-kwh',
  'Factura por Venta de Energía (USD MM)': 'factura-venta-energia-usd-mm',
  'Otros Ingresos (USD MM)': 'otros-ingresos-edes-usd-mm',
  'Gastos Operativos (USD MM)': 'gastos-operativos-edes-usd-mm',

  // CDEEE — name variations
  'Cantidad de Empleados Cdeee': 'cdeee-empleados',
  'Cantidad de Empleados CDEEE': 'cdeee-empleados',

  // EGEHID — DB slugs use short names
  'Mercado de Contratos': null,  // skip - this is a text breakdown, handled by child slug

  // EGPC — name variations
  'Total Costos de Producción': 'egpc-costos-produccion',
  'Total de Energía Facturada (GWh)': 'egpc-energia-facturada-gwh',
  'Cargos del Mercado Electrico Mayorista': 'egpc-cargos-mem',
  'Gastos por Aporte Sector Electrico': 'egpc-gastos-aporte-sector',
  'Gastos de  Depreciación y Amortización (USD MM)': 'egpc-depreciacion-amortizacion',

  // Skip — sub-items that don't have their own indicator
  'Intereses por Financiamientos': null,
  'Renovables contratos con CDEEE': null,
};

// VR sheet generation name → slug mapping
const VR_GENERATION_MAP = {
  'Carbón Mineral': 'generacion-carbon-mineral',
  'Gas Natural': 'generacion-gas-natural',
  'Fuel Oil No. 2': 'generacion-fuel-oil-2',
  'Fuel Oil No. 6': 'generacion-fuel-oil-6',
  'Fuel Oil No. 2 y No. 6': 'generacion-fuel-oil-2-y-6',
  'Hidráulica': 'generacion-hidraulica',
  'Eòlica': 'generacion-eolica',
  'Eólica': 'generacion-eolica',
  'Solar Fotovoltaica': 'generacion-solar-fv',
  'Biomasa': 'generacion-biomasa',
  'Total Renovable No Convencional': 'total-renovable-no-convencional',
  'Total Generación': 'total-generacion',
};

// VR sheet composition name → slug mapping
const VR_COMPOSITION_MAP = {
  'Carbón Mineral': 'composicion-carbon-mineral-pp',
  'Gas Natural': 'composicion-gas-natural-pp',
  'Fuel Oil No. 2': 'composicion-fuel-oil-2-pp',
  'Fuel Oil No. 6': 'composicion-fuel-oil-6-pp',
  'Fuel Oil No. 2 y No. 6': 'composicion-fuel-oil-2-y-6-pp',
  'Hidráulica': 'composicion-hidraulica-pp',
  'Eòlica': 'composicion-eolica-pp',
  'Eólica': 'composicion-eolica-pp',
  'Solar Fotovoltaica': 'composicion-solar-fv-pp',
  'Biomasa': 'composicion-biomasa-pp',
  'Total Renovable No Convencional': 'composicion-total-renovable-no-convencional-pp',
};

const ENT_MAP = {
  'edenorte':'edenorte','edesur':'edesur','edeeste':'edeeste',
  "ede's":'edes-consolidado','total edes':'edes-consolidado',
  'cdeee':'cdeee','egehid':'egehid','eted':'eted','egpc':'egpc','punta catalina':'egpc',
  'gsf':'gsf','cespm':'cespm','dpp':'dpp',
  'egehaina':'egehaina-larimar','larimar':'egehaina-larimar',
  'electronic jrc':'electronic-jrc','montecristi solar':'montecristi-solar',
  'c power':'c-power','cpower':'c-power','pecasa':'pecasa','matafongo':'matafongo',
  'wcg energy':'wcg-energy','wcg':'wcg-energy','emerald solar':'emerald-solar',
  'poseidon':'poseidon','quisqueya ii':'quisqueya-ii','quisqueya':'quisqueya-ii',
  'falcondo':'falcondo','rsj':'rsj','mercado spot':'mercado-spot','spot':'mercado-spot',
};

const ENT_PATTERNS = [
  { pattern: /egehaina.*larimar/i, slug: 'egehaina-larimar' },
  { pattern: /electronic\s+jrc/i, slug: 'electronic-jrc' },
  { pattern: /montecristi\s+solar/i, slug: 'montecristi-solar' },
  { pattern: /c\s+power/i, slug: 'c-power' },
  { pattern: /wcg\s+energy/i, slug: 'wcg-energy' },
  { pattern: /emerald\s+solar/i, slug: 'emerald-solar' },
  { pattern: /punta\s+catalina/i, slug: 'egpc' },
  { pattern: /mercado\s+spot/i, slug: 'mercado-spot' },
  { pattern: /quisqueya\s+ii/i, slug: 'quisqueya-ii' },
];

function findEntSlug(name) {
  const l = name.toLowerCase().trim().replace(/\s+/g, ' ');
  for (const [k, s] of Object.entries(ENT_MAP)) { if (l === k) return s; }
  for (const { pattern, slug } of ENT_PATTERNS) { if (pattern.test(l)) return slug; }
  for (const [k, s] of Object.entries(ENT_MAP)) { if (l.includes(k)) return s; }
  return null;
}

function seedSlugify(text) {
  let t = text.toLowerCase().trim();
  t = t.replace(/\([^)]*\)/g, '');
  t = t.replace(/ñ/g,'n').replace(/ó/g,'o').replace(/ò/g,'o').replace(/í/g,'i')
      .replace(/á/g,'a').replace(/é/g,'e').replace(/è/g,'e').replace(/ú/g,'u').replace(/ù/g,'u');
  t = t.replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  return t;
}

function fullSlugify(text) {
  let t = text.toLowerCase().trim();
  t = t.replace(/\$/g, 'd').replace(/[()]/g, '-');
  t = t.replace(/ñ/g,'n').replace(/ó/g,'o').replace(/ò/g,'o').replace(/í/g,'i')
      .replace(/á/g,'a').replace(/é/g,'e').replace(/è/g,'e').replace(/ú/g,'u').replace(/ù/g,'u');
  t = t.replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  return t;
}

function normalizeForMatch(text) {
  let t = text.toLowerCase().trim().replace(/\s+/g, ' ').replace(/[.,]+$/, '');
  t = t.replace(/ñ/g,'n').replace(/ó/g,'o').replace(/ò/g,'o').replace(/í/g,'i')
      .replace(/á/g,'a').replace(/é/g,'e').replace(/è/g,'e').replace(/ú/g,'u').replace(/ù/g,'u');
  return t;
}

function removeUnit(name) {
  const m = name.match(/^(.+?)\s*\([^)]+\)\s*$/);
  return m ? m[1].trim() : name;
}

function findIndicator(xlsName, prefix, indBySlug, indByNormName) {
  if (MANUAL_MAP.hasOwnProperty(xlsName)) {
    const mappedSlug = MANUAL_MAP[xlsName];
    if (mappedSlug === null) return { match: null, strategy: 'manual-skip' };
    const found = indBySlug.get(mappedSlug);
    if (found) return { match: found, strategy: 'manual' };
  }

  const strategies = [];
  strategies.push({ slug: fullSlugify(xlsName), label: 'full' });
  strategies.push({ slug: seedSlugify(xlsName), label: 'seed' });
  const noUnit = removeUnit(xlsName);
  if (noUnit !== xlsName) {
    strategies.push({ slug: fullSlugify(noUnit), label: 'noUnit-full' });
    strategies.push({ slug: seedSlugify(noUnit), label: 'noUnit-seed' });
  }
  const nameWithNo = xlsName.replace(/\s*#\s*/g, ' No. ');
  if (nameWithNo !== xlsName) {
    strategies.push({ slug: fullSlugify(nameWithNo), label: 'hash-full' });
    strategies.push({ slug: seedSlugify(nameWithNo), label: 'hash-seed' });
  }
  const singularized = xlsName.replace(/^Costos\s+/, 'Costo ');
  if (singularized !== xlsName) {
    strategies.push({ slug: seedSlugify(singularized), label: 'singular-seed' });
    strategies.push({ slug: fullSlugify(singularized), label: 'singular-full' });
  }
  const fixedAccents = xlsName.replace(/Movil/g, 'Móvil').replace(/Indice/g, 'Índice').replace(/Electrico/g, 'Eléctrico').replace(/Cdeee/g, 'CDEEE');
  if (fixedAccents !== xlsName) {
    strategies.push({ slug: seedSlugify(fixedAccents), label: 'accent-seed' });
    strategies.push({ slug: fullSlugify(fixedAccents), label: 'accent-full' });
  }

  for (const { slug: s, label } of strategies) {
    if (prefix) { const p = prefix + '-' + s; if (indBySlug.has(p)) return { match: indBySlug.get(p), strategy: 'prefix-' + label }; }
    if (indBySlug.has(s)) return { match: indBySlug.get(s), strategy: label };
  }
  const nn = normalizeForMatch(xlsName);
  if (indByNormName.has(nn)) return { match: indByNormName.get(nn), strategy: 'normName' };
  return { match: null };
}

// ============================================================
// MAIN
// ============================================================
async function run() {
  const t0 = Date.now();
  console.log('═'.repeat(60));
  console.log('  FULL DATA LOAD — Enhanced Matching v4');
  console.log('═'.repeat(60) + '\n');

  // 1. Load reference data
  console.log('📥 Loading reference data...');
  const { data: indicators } = await supabase.from('indicators').select('id, name, slug, category_id, is_breakdown, parent_indicator_id, unit').order('slug');
  const { data: entities } = await supabase.from('entities').select('id, slug');

  const indBySlug = new Map();
  for (const i of indicators) indBySlug.set(i.slug, i);
  const indByNormName = new Map();
  for (const i of indicators) { const nn = normalizeForMatch(i.name); if (!indByNormName.has(nn)) indByNormName.set(nn, i); }
  const entMap = new Map();
  for (const e of entities || []) entMap.set(e.slug, e);
  console.log('  ' + indicators.length + ' indicators, ' + entities.length + ' entities');

  // 2. Parse XLS
  console.log('\n📊 Parsing XLS...');
  const wb = XLSX.readFile('upload/Informe-de-Desempeno-marzo-2026.xlsx', { cellDates: true });
  const sheetConfigs = [
    { name: 'Variables Relevantes', parser: 'vr', eSlug: '', prefix: '', headerRow: 6, dataStartRow: 7 },
    { name: "EDE's", parser: 'edes', eSlug: 'edes-consolidado', prefix: '', headerRow: 6, dataStartRow: 7 },
    { name: 'CDEEE', parser: 'ent', eSlug: 'cdeee', prefix: 'cdeee', headerRow: 6, dataStartRow: 7 },
    { name: 'EGEHID', parser: 'ent', eSlug: 'egehid', prefix: 'egehid', headerRow: 6, dataStartRow: 7 },
    { name: 'ETED', parser: 'ent', eSlug: 'eted', prefix: 'eted', headerRow: 6, dataStartRow: 7 },
    { name: 'EGPC', parser: 'ent', eSlug: 'egpc', prefix: 'egpc', headerRow: 7, dataStartRow: 8 },
  ];

  const allDP = [];
  let totalMatched = 0;
  const unmatchedDetails = [];
  const strategyCounts = {};
  const edeNames = ['edenorte', 'edesur', 'edeeste'];

  for (const s of sheetConfigs) {
    const sheet = wb.Sheets[s.name];
    if (!sheet) continue;
    const rng = XLSX.utils.decode_range(sheet['!ref']);

    const dates = new Map();
    for (let c = 11; c <= rng.e.c; c++) {
      const cell = sheet[XLSX.utils.encode_cell({ r: s.headerRow, c })];
      if (!cell) continue;
      let ds = null;
      if (cell.v instanceof Date && !isNaN(cell.v)) ds = cell.v.toISOString().split('T')[0];
      else if (typeof cell.v === 'number') { const d = new Date((cell.v - 25569) * 86400000); if (!isNaN(d)) ds = d.toISOString().split('T')[0]; }
      if (ds) { const y = +ds.substring(0, 4); if (y >= 2008 && y <= 2030) dates.set(c, ds); }
    }

    let matched = 0, lastSlug = null;
    const startCount = allDP.length;

    // For VR sheet: track which section we're in
    let vrSection = 'prices'; // 'prices', 'generation', 'composition', 'mem', 'exchange'

    for (let r = s.dataStartRow; r <= rng.e.r; r++) {
      const nr = sheet[XLSX.utils.encode_cell({ r, c: 1 })];
      if (!nr) continue;
      const name = String(nr.v).trim();
      if (!name) continue;
      const nl = name.toLowerCase().trim().replace(/\s+/g, ' ');

      let hasData = false;
      for (const [col] of dates) {
        const cell = sheet[XLSX.utils.encode_cell({ r, c: col })];
        if (cell && typeof cell.v === 'number' && isFinite(cell.v)) { hasData = true; break; }
      }

      // VR section headers (no data) — track context
      if (s.parser === 'vr' && !hasData) {
        if (nl.includes('composici')) vrSection = 'composition'; // Check BEFORE generation (composition header also contains "generación")
        else if (nl.includes('generaci') && nl.includes('tipo')) vrSection = 'generation';
        else if (nl.includes('precios combust')) vrSection = 'prices';
        else if (nl.includes('mercado eléctrico mayorista')) vrSection = 'mem';
        else if (nl.includes('tasa de cambio')) vrSection = 'exchange';
        continue;
      }

      if (!hasData) continue;

      let ind = null, eSlug2 = null;

      // Manual skip check
      if (MANUAL_MAP.hasOwnProperty(name) && MANUAL_MAP[name] === null) continue;

      if (s.parser === 'vr') {
        // Variables Relevantes with section tracking
        if (vrSection === 'generation' && VR_GENERATION_MAP[name]) {
          ind = indBySlug.get(VR_GENERATION_MAP[name]);
          if (ind) { strategyCounts['vr-generation'] = (strategyCounts['vr-generation'] || 0) + 1; }
        } else if (vrSection === 'composition' && VR_COMPOSITION_MAP[name]) {
          ind = indBySlug.get(VR_COMPOSITION_MAP[name]);
          if (ind) { strategyCounts['vr-composition'] = (strategyCounts['vr-composition'] || 0) + 1; }
        } else {
          const result = findIndicator(name, s.prefix, indBySlug, indByNormName);
          if (result.match) { ind = result.match; strategyCounts[result.strategy] = (strategyCounts[result.strategy] || 0) + 1; }
        }
      } else if (s.parser === 'edes') {
        const edeM = edeNames.find(e => nl === e);
        if (edeM && lastSlug) {
          ind = indBySlug.get(lastSlug + '-' + edeM);
          if (ind) eSlug2 = edeM; else continue;
        } else {
          const result = findIndicator(name, s.prefix, indBySlug, indByNormName);
          if (result.match) { ind = result.match; lastSlug = ind.slug; eSlug2 = 'edes-consolidado'; strategyCounts[result.strategy] = (strategyCounts[result.strategy] || 0) + 1; }
          else { unmatchedDetails.push({ sheet: s.name, name }); continue; }
        }
      } else {
        // Entity sheets
        const detE = findEntSlug(name);
        if (detE && lastSlug) {
          ind = indBySlug.get(lastSlug + '-' + detE);
          if (ind) { eSlug2 = detE; }
          else {
            ind = indBySlug.get(lastSlug + '-' + seedSlugify(name));
            if (ind) { eSlug2 = null; }
            else {
              ind = indBySlug.get(lastSlug + '-' + fullSlugify(name));
              if (ind) { eSlug2 = null; } else continue;
            }
          }
        } else {
          const result = findIndicator(name, s.prefix, indBySlug, indByNormName);
          if (result.match) { ind = result.match; lastSlug = ind.slug; eSlug2 = s.eSlug; strategyCounts[result.strategy] = (strategyCounts[result.strategy] || 0) + 1; }
          else if (detE) { continue; }
          else if (lastSlug) {
            ind = indBySlug.get(lastSlug + '-' + seedSlugify(name));
            if (ind) { eSlug2 = null; }
            else {
              ind = indBySlug.get(lastSlug + '-' + fullSlugify(name));
              if (ind) { eSlug2 = null; } else { unmatchedDetails.push({ sheet: s.name, name }); continue; }
            }
          } else { unmatchedDetails.push({ sheet: s.name, name }); continue; }
        }
      }

      if (!ind) { unmatchedDetails.push({ sheet: s.name, name }); continue; }
      matched++;

      const ent = eSlug2 ? entMap.get(eSlug2) : null;
      for (const [c, ds] of dates) {
        const v = sheet[XLSX.utils.encode_cell({ r, c })];
        if (v && typeof v.v === 'number' && isFinite(v.v)) {
          allDP.push({
            indicator_id: ind.id,
            entity_id: ent?.id || null,
            value: Math.round(v.v * 1e6) / 1e6,
            date: ds,
            period_type: 'monthly',
            source_file: 'Informe-de-Desempeno-marzo-2026.xlsx',
            is_estimated: false,
          });
        }
      }
    }

    totalMatched += matched;
    console.log('  ✅ ' + s.name + ': ' + matched + ' matched, ' + (allDP.length - startCount).toLocaleString() + ' dps');
  }

  console.log('\n📊 EXTRACTION SUMMARY:');
  console.log('  Matched indicators: ' + totalMatched);
  console.log('  Data points: ' + allDP.length.toLocaleString());

  // Deduplicate
  const seen = new Set();
  const deduped = [];
  for (const dp of allDP) {
    const key = dp.indicator_id + '|' + dp.date + '|' + (dp.entity_id || '');
    if (!seen.has(key)) { seen.add(key); deduped.push(dp); }
  }
  console.log('  After dedup: ' + deduped.length.toLocaleString() + ' (removed ' + (allDP.length - deduped.length) + ')');

  console.log('\n  Strategies:');
  for (const [s, c] of Object.entries(strategyCounts).sort((a, b) => b[1] - a[1])) console.log('    ' + s + ': ' + c);

  if (unmatchedDetails.length > 0) {
    console.log('\n  Unmatched (' + unmatchedDetails.length + '):');
    for (const u of unmatchedDetails) console.log('    [' + u.sheet + '] "' + u.name + '"');
  }

  // 3. Insert
  console.log('\n💾 Inserting ' + deduped.length.toLocaleString() + ' data points...');
  const BATCH = 500;
  let inserted = 0, errors = 0;

  for (let i = 0; i < deduped.length; i += BATCH) {
    const batch = deduped.slice(i, i + BATCH);
    const batchNum = Math.floor(i / BATCH) + 1;
    const totalBatches = Math.ceil(deduped.length / BATCH);

    const { data, error } = await supabase.from('data_points').insert(batch).select('id');
    if (error) {
      for (const dp of batch) {
        const { error: e2 } = await supabase.from('data_points').insert(dp);
        if (e2) { if (!e2.message.includes('duplicate')) errors++; } else inserted++;
      }
    } else {
      inserted += data?.length || batch.length;
    }

    if (batchNum % 10 === 0 || batchNum === totalBatches) {
      const pct = Math.min(100, ((i + BATCH) / deduped.length * 100)).toFixed(0);
      console.log('  ' + pct + '% — ' + inserted.toLocaleString() + ' inserted (' + ((Date.now() - t0) / 1000).toFixed(0) + 's)');
    }
  }

  console.log('\n  Inserted: ' + inserted.toLocaleString() + ', Errors: ' + errors);
  console.log('  Total time: ' + ((Date.now() - t0) / 1000).toFixed(1) + 's');

  // 4. Quick verification
  const { count } = await supabase.from('data_points').select('*', { count: 'exact', head: true });
  console.log('\n  Total data_points in DB: ' + count?.toLocaleString());

  // Date range
  const { data: minD } = await supabase.from('data_points').select('date').order('date').limit(1);
  const { data: maxD } = await supabase.from('data_points').select('date').order('date', { ascending: false }).limit(1);
  console.log('  Date range: ' + (minD?.[0]?.date || '?') + ' → ' + (maxD?.[0]?.date || '?'));
}

run().catch(e => console.error('❌', e));
