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

const MANUAL_MAP = {
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
  'Costos Marginal de Energía (cUSD$/KWh)': 'costo-marginal-energia',
  'Costos Marginal de Potencia  (cUSD/kW-Mes)': 'costo-marginal-potencia',
  'Costo Marginal de Energía (cUSD$/KWh)': 'costo-marginal-energia',
  'Costo Marginal de Potencia (cUSD/kW-Mes)': 'costo-marginal-potencia',
  'Peaje de Transmisión (cUSD/KWh)': 'peaje-transmision',
  'Derecho de Conexión Unitario (USD/kW-mes)': 'derecho-conexion-unitario',
  'Otros (USD MM)': 'otros-gastos-edes-usd-mm',
  'Pérdidas - Año Movil (%)': 'perdidas-ano-movil-porcentaje',
  'Cobranzas - Año Movil (%)': 'cobranzas-ano-movil-porcentaje',
  'CRI - Año Movil (%)': 'cri-ano-movil-porcentaje',
  'Indice de Recuperación de Energía (%)': 'ire-porcentaje',
  'Indice de Recuperación de Energía - Año Movil (%)': 'ire-ano-movil-porcentaje',
  'Índice de Recuperación de Energía (%)': 'ire-porcentaje',
  'Índice de Recuperación de Energía - Año Móvil (%)': 'ire-ano-movil-porcentaje',
  'Intereses por Financiamientos': null,
  'Total Costos de Producción': 'egpc-costos-produccion',
  'Cargos del Mercado Electrico Mayorista': 'egpc-cargos-mem',
  'Cargos del Mercado Eléctrico Mayorista': 'egpc-cargos-mem',
  'Gastos por Aporte Sector Electrico': 'egpc-gastos-aporte-sector',
  'Gastos por Aporte Sector Eléctrico': 'egpc-gastos-aporte-sector',
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
    strategies.push({ slug: fullSlugify(nameWithNo), label: 'hash-to-no-full' });
    strategies.push({ slug: seedSlugify(nameWithNo), label: 'hash-to-no-seed' });
  }

  const singularized = xlsName.replace(/^Costos\s+/, 'Costo ');
  if (singularized !== xlsName) {
    strategies.push({ slug: seedSlugify(singularized), label: 'singular-seed' });
    strategies.push({ slug: fullSlugify(singularized), label: 'singular-full' });
    const sNoUnit = removeUnit(singularized);
    if (sNoUnit !== singularized) strategies.push({ slug: seedSlugify(sNoUnit), label: 'singular-noUnit-seed' });
  }

  const fixedAccents = xlsName.replace(/Movil/g, 'Móvil').replace(/Indice/g, 'Índice').replace(/Electrico/g, 'Eléctrico');
  if (fixedAccents !== xlsName) {
    strategies.push({ slug: seedSlugify(fixedAccents), label: 'accent-fix-seed' });
    strategies.push({ slug: fullSlugify(fixedAccents), label: 'accent-fix-full' });
  }

  for (const { slug: s, label } of strategies) {
    if (prefix) { const p = prefix + '-' + s; if (indBySlug.has(p)) return { match: indBySlug.get(p), strategy: 'prefix-' + label }; }
    if (indBySlug.has(s)) return { match: indBySlug.get(s), strategy: label };
  }

  const nn = normalizeForMatch(xlsName);
  if (indByNormName.has(nn)) return { match: indByNormName.get(nn), strategy: 'normName' };

  return { match: null };
}

async function run() {
  const t0 = Date.now();
  console.log('═'.repeat(50));
  console.log('  DRY RUN — Extraction Only');
  console.log('═'.repeat(50));

  const { data: indicators } = await supabase.from('indicators').select('id, name, slug, category_id, is_breakdown, parent_indicator_id, unit').order('slug');
  const { data: entities } = await supabase.from('entities').select('id, slug');

  const indBySlug = new Map();
  for (const i of indicators) indBySlug.set(i.slug, i);
  const indByNormName = new Map();
  for (const i of indicators) { const nn = normalizeForMatch(i.name); if (!indByNormName.has(nn)) indByNormName.set(nn, i); }
  const entMap = new Map();
  for (const e of entities || []) entMap.set(e.slug, e);

  console.log(indicators.length + ' indicators, ' + entities.length + ' entities');

  const wb = XLSX.readFile('upload/Informe-de-Desempeno-marzo-2026.xlsx', { cellDates: true });
  const sheetConfigs = [
    { name: 'Variables Relevantes', parser: 'v', eSlug: '', prefix: '', headerRow: 6, dataStartRow: 7 },
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
      if (!hasData) continue;

      let ind = null, eSlug2 = null;

      if (s.parser === 'v') {
        const result = findIndicator(name, s.prefix, indBySlug, indByNormName);
        if (result.match) { ind = result.match; strategyCounts[result.strategy] = (strategyCounts[result.strategy] || 0) + 1; }
      } else if (s.parser === 'edes') {
        const edeM = edeNames.find(e => nl === e);
        if (edeM && lastSlug) {
          const childSlug = lastSlug + '-' + edeM;
          ind = indBySlug.get(childSlug);
          if (ind) eSlug2 = edeM; else { lastSlug = null; continue; }
        } else {
          const result = findIndicator(name, s.prefix, indBySlug, indByNormName);
          if (result.match) { ind = result.match; lastSlug = ind.slug; eSlug2 = 'edes-consolidado'; strategyCounts[result.strategy] = (strategyCounts[result.strategy] || 0) + 1; }
          else { lastSlug = null; unmatchedDetails.push({ sheet: s.name, name, prefix: s.prefix }); continue; }
        }
      } else {
        const detE = findEntSlug(name);
        if (detE && lastSlug) {
          const childSlug = lastSlug + '-' + detE;
          ind = indBySlug.get(childSlug);
          if (ind) eSlug2 = detE;
          else {
            const textSlug = lastSlug + '-' + seedSlugify(name);
            ind = indBySlug.get(textSlug);
            if (ind) eSlug2 = null;
            else {
              const textSlug2 = lastSlug + '-' + fullSlugify(name);
              ind = indBySlug.get(textSlug2);
              if (ind) eSlug2 = null;
              else { lastSlug = null; continue; }
            }
          }
        } else {
          const result = findIndicator(name, s.prefix, indBySlug, indByNormName);
          if (result.match) { ind = result.match; lastSlug = ind.slug; eSlug2 = s.eSlug; strategyCounts[result.strategy] = (strategyCounts[result.strategy] || 0) + 1; }
          else if (lastSlug) {
            const textSlug = lastSlug + '-' + seedSlugify(name);
            ind = indBySlug.get(textSlug);
            if (ind) eSlug2 = null;
            else {
              const textSlug2 = lastSlug + '-' + fullSlugify(name);
              ind = indBySlug.get(textSlug2);
              if (ind) eSlug2 = null;
              else { lastSlug = null; unmatchedDetails.push({ sheet: s.name, name, prefix: s.prefix }); continue; }
            }
          } else { unmatchedDetails.push({ sheet: s.name, name, prefix: s.prefix }); continue; }
        }
      }

      if (!ind) { unmatchedDetails.push({ sheet: s.name, name }); continue; }
      matched++;

      for (const [c, ds] of dates) {
        const v = sheet[XLSX.utils.encode_cell({ r, c })];
        if (v && typeof v.v === 'number' && isFinite(v.v)) {
          allDP.push({ indicator_id: ind.id, entity_id: eSlug2 ? (entMap.get(eSlug2)?.id || null) : null, value: Math.round(v.v * 1e6) / 1e6, date: ds });
        }
      }
    }

    totalMatched += matched;
    console.log('  ' + s.name + ': ' + matched + ' matched, ' + (allDP.length - startCount).toLocaleString() + ' dps');
  }

  console.log('\nMatched: ' + totalMatched);
  console.log('Data points: ' + allDP.length.toLocaleString());
  console.log('\nStrategies:');
  for (const [s, c] of Object.entries(strategyCounts).sort((a, b) => b[1] - a[1])) console.log('  ' + s + ': ' + c);
  console.log('\nUnmatched (' + unmatchedDetails.length + '):');
  for (const u of unmatchedDetails) console.log('  [' + u.sheet + '] "' + u.name + '"');
  console.log('\nTime: ' + ((Date.now() - t0) / 1000).toFixed(1) + 's');

  // Save data points to JSON for the insert step
  fs.writeFileSync('/tmp/data-points-extract.json', JSON.stringify(allDP));
  console.log('\nSaved to /tmp/data-points-extract.json (' + (allDP.length) + ' records)');
}

run().catch(e => console.error(e));
