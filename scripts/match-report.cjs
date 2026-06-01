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

async function run() {
  // 1. Load all indicators from DB
  const { data: indicators, error } = await supabase
    .from('indicators')
    .select('id, name, slug, category_id, is_breakdown, parent_indicator_id, unit')
    .order('slug');
  if (error) { console.error('DB error:', error); return; }
  console.log(`Loaded ${indicators.length} indicators from DB\n`);

  // 2. Load categories
  const { data: categories } = await supabase
    .from('indicator_categories')
    .select('id, name, slug, source_sheet');
  const catMap = new Map();
  for (const c of categories || []) catMap.set(c.id, c);

  // 3. Load entities
  const { data: entities } = await supabase.from('entities').select('id, slug');
  const entMap = new Map();
  for (const e of entities || []) entMap.set(e.slug, e);

  // 4. Read XLS and extract all row names
  const wb = XLSX.readFile('upload/Informe-de-Desempeno-marzo-2026.xlsx', { cellDates: true });
  const sheets = [
    { name: 'Variables Relevantes', parser: 'v', prefix: '', headerRow: 6, dataStartRow: 7 },
    { name: "EDE's", parser: 'edes', prefix: '', headerRow: 6, dataStartRow: 7 },
    { name: 'CDEEE', parser: 'ent', prefix: 'cdeee', headerRow: 6, dataStartRow: 7 },
    { name: 'EGEHID', parser: 'ent', prefix: 'egehid', headerRow: 6, dataStartRow: 7 },
    { name: 'ETED', parser: 'ent', prefix: 'eted', headerRow: 6, dataStartRow: 7 },
    { name: 'EGPC', parser: 'ent', prefix: 'egpc', headerRow: 7, dataStartRow: 8 },
  ];

  // Slugify functions - matching the SEED script behavior
  function seedSlugify(text) {
    // The seed script removes content in parentheses for cleaner slugs
    let t = text.toLowerCase().trim();
    t = t.replace(/\([^)]*\)/g, '');  // Remove parentheses content
    t = t.replace('ñ', 'n').replace('ó', 'o').replace('í', 'i').replace('á', 'a').replace('é', 'e').replace('ú', 'u');
    t = t.replace('à', 'a').replace('è', 'e').replace('ù', 'u');
    t = t.replace(/[^a-z0-9]+/g, '-');
    t = t.replace(/-+/g, '-');
    t = t.replace(/^-|-$/g, '');
    return t;
  }

  function fullSlugify(text) {
    // The full-load.cjs slug function (keeps parens as hyphens)
    let t = text.toLowerCase().trim();
    t = t.replace(/\$/g, 'd');
    t = t.replace(/[()]/g, '-');
    t = t.replace(/ñ/g, 'n').replace(/ó/g, 'o').replace(/í/g, 'i').replace(/á/g, 'a').replace(/é/g, 'e').replace(/ú/g, 'u');
    t = t.replace(/[^a-z0-9]+/g, '-');
    t = t.replace(/-+/g, '-');
    t = t.replace(/^-|-$/g, '');
    return t;
  }

  // Collect all XLS row names per sheet
  const xlsRows = [];
  const edeNames = ['edenorte', 'edesur', 'edeeste'];
  const ENT_MAP = {
    'edenorte':'edenorte','edesur':'edesur','edeeste':'edeeste',
    "ede's":'edes-consolidado','total edes':'edes-consolidado',
    'cdeee':'cdeee','egehid':'egehid','eted':'eted','egpc':'egpc','punta catalina':'egpc',
    'gsf':'gsf','cespm':'cespm','dpp':'dpp','egehaina':'egehaina-larimar','larimar':'egehaina-larimar',
    'electronic jrc':'electronic-jrc','montecristi solar':'montecristi-solar',
    'c power':'c-power','cpower':'c-power','pecasa':'pecasa','matafongo':'matafongo',
    'wcg energy':'wcg-energy','wcg':'wcg-energy','emerald solar':'emerald-solar',
    'poseidon':'poseidon','quisqueya ii':'quisqueya-ii','quisqueya':'quisqueya-ii',
    'falcondo':'falcondo','rsj':'rsj','mercado spot':'mercado-spot','spot':'mercado-spot',
  };

  function findEntSlug(name) {
    const l = name.toLowerCase().trim().replace(/\s+/g, ' ');
    for (const [k, s] of Object.entries(ENT_MAP)) { if (l === k || l.includes(k)) return s; }
    return null;
  }

  for (const s of sheets) {
    const sheet = wb.Sheets[s.name];
    if (!sheet) continue;
    const rng = XLSX.utils.decode_range(sheet['!ref']);

    let lastParentSlug = null;
    for (let r = s.dataStartRow; r <= rng.e.r; r++) {
      const nr = sheet[XLSX.utils.encode_cell({ r, c: 1 })];
      if (!nr) continue;
      const name = String(nr.v).trim();
      if (!name) continue;
      const nl = name.toLowerCase().trim().replace(/\s+/g, ' ');

      // Check if has any data
      let hasData = false;
      for (let c = 11; c <= Math.min(rng.e.c, 50); c++) {
        const cell = sheet[XLSX.utils.encode_cell({ r, c })];
        if (cell && typeof cell.v === 'number' && isFinite(cell.v)) { hasData = true; break; }
      }
      if (!hasData) continue;

      if (s.parser === 'edes') {
        const edeM = edeNames.find(e => nl === e);
        if (edeM) {
          xlsRows.push({ sheet: s.name, name, prefix: s.prefix, type: 'ede-breakdown', edeSlug: edeM, parentContext: lastParentSlug });
          continue;
        }
      }

      if (s.parser === 'ent') {
        const detE = findEntSlug(name);
        if (detE && lastParentSlug) {
          xlsRows.push({ sheet: s.name, name, prefix: s.prefix, type: 'entity-breakdown', entitySlug: detE, parentContext: lastParentSlug });
          continue;
        }
      }

      xlsRows.push({ sheet: s.name, name, prefix: s.prefix, type: 'parent' });
      lastParentSlug = null; // will be set if matched
    }
  }

  console.log(`Found ${xlsRows.length} XLS rows with data\n`);

  // 5. Now try matching each XLS row against DB indicators
  const indBySlug = new Map();
  for (const i of indicators) indBySlug.set(i.slug, i);

  // Also build a normalized name index
  const indByNormName = new Map();
  for (const i of indicators) {
    const nn = i.name.toLowerCase().trim().replace(/\s+/g, ' ');
    indByNormName.set(nn, i);
  }

  function tryMatch(xlsName, prefix) {
    const attempts = [];

    // a. Full slug (with unit portion)
    const full = fullSlugify(xlsName);
    if (prefix) { const p = prefix + '-' + full; attempts.push(['prefix-full', p]); if (indBySlug.has(p)) return { match: indBySlug.get(p), strategy: 'prefix-full', attempt: p }; }
    attempts.push(['full', full]);
    if (indBySlug.has(full)) return { match: indBySlug.get(full), strategy: 'full', attempt: full };

    // b. Seed-style slug (without unit portion)
    const seed = seedSlugify(xlsName);
    if (prefix) { const p = prefix + '-' + seed; attempts.push(['prefix-seed', p]); if (indBySlug.has(p)) return { match: indBySlug.get(p), strategy: 'prefix-seed', attempt: p }; }
    attempts.push(['seed', seed]);
    if (indBySlug.has(seed)) return { match: indBySlug.get(seed), strategy: 'seed', attempt: seed };

    // c. Without unit, full slug
    const unitMatch = xlsName.match(/^(.+?)\s*\([^)]+\)\s*$/);
    if (unitMatch) {
      const noUnit = unitMatch[1].trim();
      const noUnitFull = fullSlugify(noUnit);
      if (prefix) { const p = prefix + '-' + noUnitFull; attempts.push(['prefix-noUnit-full', p]); if (indBySlug.has(p)) return { match: indBySlug.get(p), strategy: 'prefix-noUnit-full', attempt: p }; }
      attempts.push(['noUnit-full', noUnitFull]);
      if (indBySlug.has(noUnitFull)) return { match: indBySlug.get(noUnitFull), strategy: 'noUnit-full', attempt: noUnitFull };

      const noUnitSeed = seedSlugify(noUnit);
      if (prefix) { const p = prefix + '-' + noUnitSeed; attempts.push(['prefix-noUnit-seed', p]); if (indBySlug.has(p)) return { match: indBySlug.get(p), strategy: 'prefix-noUnit-seed', attempt: p }; }
      attempts.push(['noUnit-seed', noUnitSeed]);
      if (indBySlug.has(noUnitSeed)) return { match: indBySlug.get(noUnitSeed), strategy: 'noUnit-seed', attempt: noUnitSeed };
    }

    // d. Normalized name match
    const nn = xlsName.toLowerCase().trim().replace(/\s+/g, ' ');
    if (indByNormName.has(nn)) return { match: indByNormName.get(nn), strategy: 'normName', attempt: nn };

    return { match: null, attempts };
  }

  let matched = 0, unmatched = 0;
  const matchedList = [];
  const unmatchedList = [];

  for (const row of xlsRows) {
    if (row.type === 'ede-breakdown' || row.type === 'entity-breakdown') {
      // These are matched via parent + child pattern, skip for now
      continue;
    }

    const result = tryMatch(row.name, row.prefix);
    if (result.match) {
      matched++;
      matchedList.push({ xlsName: row.name, sheet: row.sheet, dbSlug: result.match.slug, strategy: result.strategy });
    } else {
      unmatched++;
      unmatchedList.push({ xlsName: row.name, sheet: row.sheet, prefix: row.prefix, attempts: result.attempts });
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`  MATCHING REPORT`);
  console.log(`${'='.repeat(60)}`);
  console.log(`  Matched:   ${matched}`);
  console.log(`  Unmatched: ${unmatched}`);
  console.log(`${'='.repeat(60)}\n`);

  // Show strategy distribution
  const stratCounts = {};
  for (const m of matchedList) { stratCounts[m.strategy] = (stratCounts[m.strategy] || 0) + 1; }
  console.log('Strategy distribution:');
  for (const [s, c] of Object.entries(stratCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${s}: ${c}`);
  }

  console.log(`\n--- UNMATCHED (${unmatchedList.length}) ---\n`);
  for (const u of unmatchedList) {
    console.log(`  [${u.sheet}${u.prefix ? '/' + u.prefix : ''}] "${u.xlsName}"`);
    console.log(`    Attempts: ${u.attempts.map(a => `${a[0]}:${a[1]}`).join(', ')}`);
  }

  // Also dump all DB slugs for reference
  console.log(`\n--- ALL DB SLUGS (${indicators.length}) ---\n`);
  for (const i of indicators) {
    const cat = catMap.get(i.category_id);
    console.log(`  [${cat?.slug || '?'}] ${i.slug} ← "${i.name}"${i.is_breakdown ? ' (breakdown)' : ''}`);
  }
}

run().catch(e => console.error(e));
