/**
 * Load a single sheet from the XLS into Supabase
 * Usage: node scripts/load-sheet.mjs "Sheet Name"
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '..', '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
for (const line of envContent.split('\n')) {
  const match = line.match(/^([A-Z_]+)=(.*)$/);
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2].trim();
}

const { createClient } = await import('@supabase/supabase-js');
const XLSX = (await import('xlsx')).default;

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const SHEET_NAME = process.argv[2];

if (!SHEET_NAME) { console.error('Uso: node load-sheet.mjs "Sheet Name"'); process.exit(1); }

// Load reference data
const { data: indicators } = await supabase.from('indicators').select('id, name, slug, category_id, entity_id, is_breakdown, parent_indicator_id, unit');
const { data: entities } = await supabase.from('entities').select('id, name, slug, type');

const indicatorMap = new Map();
for (const ind of indicators || []) {
  indicatorMap.set(ind.slug, ind);
  indicatorMap.set(`name:${(ind.name||'').toString().trim().toLowerCase().replace(/\s+/g,' ').replace(/[.,]+$/,'')}`, ind);
}
const entityMap = new Map();
for (const ent of entities || []) entityMap.set(ent.slug, ent);

function slugify(text) {
  let t = text.toLowerCase().trim().replace(/\$/g,'d').replace(/[()]/g,'-');
  t = t.replace(/ñ/g,'n').replace(/ó/g,'o').replace(/í/g,'i').replace(/á/g,'a').replace(/é/g,'e').replace(/ú/g,'u');
  return t.replace(/[^a-z0-9]+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'');
}
function extractUnitFromName(name) {
  const m = name.match(/\(([^)]+)\)\s*$/);
  return m ? [name.slice(0,m.index).trim(), m[1]] : [name, ''];
}
function normalizeText(text) { return (text||'').toString().trim().toLowerCase().replace(/\s+/g,' ').replace(/[.,]+$/,''); }
function findIndicatorBySlug(name, prefix) {
  if (prefix) { const f = indicatorMap.get(`${prefix}-${slugify(name)}`); if(f) return f; }
  let f = indicatorMap.get(slugify(name)); if(f) return f;
  const [cn] = extractUnitFromName(name);
  if(prefix) { f = indicatorMap.get(`${prefix}-${slugify(cn)}`); if(f) return f; }
  f = indicatorMap.get(slugify(cn)); if(f) return f;
  return indicatorMap.get(`name:${normalizeText(name)}`) || null;
}

const ENTITY_SLUG_MAP = {
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
function findEntitySlug(name) {
  const lower = normalizeText(name);
  for (const [k,s] of Object.entries(ENTITY_SLUG_MAP)) { if(lower===k||lower.includes(k)) return s; }
  return null;
}
function parseExcelDate(value) {
  if(!value) return null;
  if(value instanceof Date) return isNaN(value.getTime()) ? null : value.toISOString().split('T')[0];
  if(typeof value==='number') { const d=new Date((value-25569)*86400000); return isNaN(d.getTime())?null:d.toISOString().split('T')[0]; }
  if(typeof value==='string') { const d=new Date(value); return isNaN(d.getTime())?null:d.toISOString().split('T')[0]; }
  return null;
}
function getCellValue(sheet,row,col) { const c=sheet[XLSX.utils.encode_cell({r:row,c:col})]; return c?c.v:null; }

function findDateColumns(sheet, headerRow, startCol) {
  const dateMap = new Map();
  if(!sheet['!ref']) return dateMap;
  const range = XLSX.utils.decode_range(sheet['!ref']);
  for(let col=startCol; col<=range.e.c; col++) {
    const cell=sheet[XLSX.utils.encode_cell({r:headerRow,c:col})];
    if(!cell) continue;
    const ds=parseExcelDate(cell.v);
    if(ds) { const y=parseInt(ds.split('-')[0]); if(y>=2008&&y<=2030) dateMap.set(col,ds); }
  }
  return dateMap;
}

// Read XLS
const xlsPath = resolve(__dirname, '..', 'upload', 'Informe-de-Desempeno-marzo-2026.xlsx');
const fileBuffer = readFileSync(xlsPath);
const workbook = XLSX.read(fileBuffer, { type: 'buffer', cellDates: true });

const sheet = workbook.Sheets[SHEET_NAME];
if(!sheet) { console.error(`❌ Hoja "${SHEET_NAME}" no encontrada`); process.exit(1); }

const range = XLSX.utils.decode_range(sheet['!ref']);
const config = {
  'Variables Relevantes': { parser:'variables', entitySlug:'', prefix:'' },
  "EDE's": { parser:'edes', entitySlug:'edes-consolidado', prefix:'' },
  'CDEEE': { parser:'entity', entitySlug:'cdeee', prefix:'cdeee' },
  'EGEHID': { parser:'entity', entitySlug:'egehid', prefix:'egehid' },
  'ETED': { parser:'entity', entitySlug:'eted', prefix:'eted' },
  'EGPC': { parser:'entity', entitySlug:'egpc', prefix:'egpc' },
}[SHEET_NAME];

if(!config) { console.error('❌ No hay parser para:', SHEET_NAME); process.exit(1); }

const headerRow = SHEET_NAME==='EGPC' ? 7 : 6;
const dataStartRow = SHEET_NAME==='EGPC' ? 8 : 7;
const dateMap = findDateColumns(sheet, headerRow, 11);
console.log(`📊 ${SHEET_NAME}: ${dateMap.size} columnas de fecha, ${range.e.r - dataStartRow + 1} filas`);

const allDP = [];
let matched=0, unmatched=0, lastParentSlug=null;
const edeNames=['edenorte','edesur','edeeste'];

for(let row=dataStartRow; row<=range.e.r; row++) {
  const nameRaw = getCellValue(sheet, row, 1);
  if(!nameRaw) continue;
  const name = String(nameRaw).trim();
  if(!name) continue;

  let indicator=null, matchedEntitySlug=null;

  if(config.parser==='variables') {
    indicator = findIndicatorBySlug(name);
  } else if(config.parser==='edes') {
    const nameLower = normalizeText(name);
    const edeMatch = edeNames.find(ede=>nameLower===ede);
    if(edeMatch && lastParentSlug) {
      const childInd = indicatorMap.get(`${lastParentSlug}-${edeMatch}`);
      if(childInd) { indicator=childInd; matchedEntitySlug=edeMatch; } else continue;
    } else {
      indicator = findIndicatorBySlug(name);
      if(indicator) { lastParentSlug=indicator.slug; matchedEntitySlug='edes-consolidado'; }
      else { lastParentSlug=null; continue; }
    }
  } else if(config.parser==='entity') {
    const detectedEntity = findEntitySlug(name);
    if(detectedEntity && lastParentSlug) {
      const childInd = indicatorMap.get(`${lastParentSlug}-${detectedEntity}`);
      if(childInd) { indicator=childInd; matchedEntitySlug=detectedEntity; }
      else {
        const textInd = indicatorMap.get(`${lastParentSlug}-${slugify(name)}`);
        if(textInd) indicator=textInd; else continue;
      }
    } else {
      indicator = findIndicatorBySlug(name, config.prefix);
      if(indicator) { lastParentSlug=indicator.slug; matchedEntitySlug=config.entitySlug; }
      else {
        if(lastParentSlug) { const textInd=indicatorMap.get(`${lastParentSlug}-${slugify(name)}`); if(textInd){indicator=textInd; continue;} }
        lastParentSlug=null; continue;
      }
    }
  }

  if(!indicator) { unmatched++; continue; }
  matched++;
  const entity = matchedEntitySlug ? entityMap.get(matchedEntitySlug) : null;

  for(const [col, dateStr] of dateMap) {
    const value = getCellValue(sheet, row, col);
    if(value!==null && value!=='' && typeof value==='number' && isFinite(value)) {
      allDP.push({ indicator_id:indicator.id, entity_id:entity?.id||null, value:Math.round(value*1e6)/1e6, date:dateStr, period_type:'monthly', source_file:'Informe-de-Desempeno-marzo-2026.xlsx', is_estimated:false });
    }
  }
}

console.log(`   Match: ${matched} | No match: ${unmatched} | Data points: ${allDP.length.toLocaleString()}`);

// Insert in batches
console.log(`💾 Insertando ${allDP.length.toLocaleString()} data_points...`);
const BATCH=500;
let inserted=0, errors=0;
const t0=Date.now();

for(let i=0; i<allDP.length; i+=BATCH) {
  const batch=allDP.slice(i,i+BATCH);
  const {data,error}=await supabase.from('data_points').upsert(batch,{onConflict:'indicator_id,date,entity_id',ignoreDuplicates:true}).select('id');
  if(error) { for(const dp of batch) { const {error:e2}=await supabase.from('data_points').upsert(dp,{onConflict:'indicator_id,date,entity_id',ignoreDuplicates:true}); if(e2)errors++;else inserted++; } }
  else { inserted+=data?.length||batch.length; }
  if((Math.floor(i/BATCH)+1)%10===0 || i+BATCH>=allDP.length) {
    const pct=((i+BATCH)/allDP.length*100).toFixed(0);
    console.log(`   ${pct}% — ${inserted.toLocaleString()} insertados (${((Date.now()-t0)/1000).toFixed(1)}s)`);
  }
}

console.log(`✅ ${SHEET_NAME}: ${inserted.toLocaleString()} insertados, ${errors} errores, ${((Date.now()-t0)/1000).toFixed(1)}s`);
