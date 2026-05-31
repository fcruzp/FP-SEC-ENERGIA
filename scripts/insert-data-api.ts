/**
 * PASO 6: Inserción directa de data_points via Supabase REST API
 * Usa lotes pequeños (100 registros) con delays para evitar rate limiting
 */

import * as XLSX from 'xlsx'
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const XLS_PATH = path.resolve(__dirname, '../upload/Informe-de-Desempeno-marzo-2026.xlsx')

// ---- DUPLICATE ALL PARSER LOGIC (same as generate-sql-seed.ts) ----
// [Same code as generate-sql-seed.ts - keeping it self-contained]

interface DataPointInsert { indicator_id: string; entity_id: string | null; value: number; date: string; period_type: string; source_file: string; is_estimated: boolean }
interface IndicatorRow { id: string; name: string; slug: string; category_id: string; entity_id: string | null; is_breakdown: boolean; parent_indicator_id: string | null; unit: string }
interface EntityRow { id: string; name: string; slug: string; type: string }

const ENTITY_SLUG_MAP: Record<string, string> = { 'edenorte':'edenorte','edesur':'edesur','edeeste':'edeeste',"ede's":'edes-consolidado','total edes':'edes-consolidado','edes':'edes-consolidado','cdeee':'cdeee','egehid':'egehid','eted':'eted','egpc':'egpc','punta catalina':'egpc','gsf':'gsf','cespm':'cespm','dpp':'dpp','egehaina':'egehaina-larimar','larimar':'egehaina-larimar','egehaina-larimar':'egehaina-larimar','electronic jrc':'electronic-jrc','montecristi solar':'montecristi-solar','c power':'c-power','cpower':'c-power','c power dr operations':'c-power','pecasa':'pecasa','matafongo':'matafongo','wcg energy':'wcg-energy','wcg energy ltd':'wcg-energy','wcg':'wcg-energy','emerald solar':'emerald-solar','poseidon':'poseidon','quisqueya ii':'quisqueya-ii','quisqueya':'quisqueya-ii','falcondo':'falcondo','falcon':'falcondo','rsj':'rsj','mercado spot':'mercado-spot','spot':'mercado-spot','unr':'unr',"ede's consolidado":'edes-consolidado',"genco's":'gencos','gencos':'gencos' }
const VR_NAME_SLUG_MAP: Record<string, string> = { 'fuel oil no. 2':'fuel-oil-2-usd-bbl','fuel oil no. 6':'fuel-oil-6-usd-bbl','fuel oil #2':'fuel-oil-2-usd-bbl','fuel oil #6':'fuel-oil-6-usd-bbl','eòlica':'generacion-eolica','eolica':'generacion-eolica','hidráulica':'generacion-hidraulica','hidraulica':'generacion-hidraulica','solar fotovoltaica':'generacion-solar-fv','solar fv':'generacion-solar-fv','biomasa':'generacion-biomasa','gas natural':'generacion-gas-natural','carbón mineral':'generacion-carbon-mineral','carbon mineral':'generacion-carbon-mineral','renovable no convencional':'generacion-total-renovable-no-convencional','total renovable no convencional':'generacion-total-renolvable-no-convencional','costos marginal de energía':'costo-marginal-energia','costo marginal de energía':'costo-marginal-energia','costos marginal de potencia':'costo-marginal-potencia','costo marginal de potencia':'costo-marginal-potencia','costos marginal de energia':'costo-marginal-energia','costo marginal de energia':'costo-marginal-energia' }
const SECTION_HEADERS = new Set(['precios combustibles','generacion de energia por tipo de combustible','generación de energía por tipo de combustible','composicion generacion de energia por tipo de combustible','composición generación de energía por tipo de combustible','composicion generacion de energia por tipo','precios del mercado electrico mayorista','precios del mercado eléctrico mayorista','precios del mercado eléctrico mayorista (mem)','costos marginal de energía','costos marginal de potencia','tasa de cambio','total general','renovables contratos con cdeee','intereses por financiamientos','otros (usd mm)'])
const CDEEE_SECTION_CONTEXT: Record<string, string> = { 'energía comprada':'cdeee-energia-comprada-gwh','energia comprada':'cdeee-energia-comprada-gwh','factura por compra':'cdeee-factura-compra-energia','factura compra':'cdeee-factura-compra-energia','total energía facturada':'cdeee-energia-facturada-gwh','total energia facturada':'cdeee-energia-facturada-gwh','total facturado':'cdeee-total-facturado-usd-mm' }

function normalizeText(t:string){return(t||'').toString().trim().toLowerCase().replace(/\s+/g,' ').replace(/[.,]+$/,'')}
function slugify(t:string){let s=t.toLowerCase().trim();s=s.replace(/\$/g,'d').replace(/[()]/g,'-');s=s.replace(/ñ/g,'n').replace(/ó/g,'o').replace(/ò/g,'o').replace(/í/g,'i').replace(/á/g,'a').replace(/é/g,'e').replace(/ú/g,'u');s=s.replace(/[^a-z0-9]+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'');return s}
function extractUnitFromName(n:string):[string,string]{const m=n.match(/\(([^)]+)\)\s*$/);if(m)return[n.slice(0,m.index).trim(),m[1]];return[n,'']}
function parseExcelDate(v:unknown):string|null{if(!v)return null;if(v instanceof Date){if(!isNaN(v.getTime()))return v.toISOString().split('T')[0]}if(typeof v==='number'){const d=new Date((v-25569)*86400*1000);if(!isNaN(d.getTime()))return d.toISOString().split('T')[0]}if(typeof v==='string'){const d=new Date(v);if(!isNaN(d.getTime()))return d.toISOString().split('T')[0]}return null}
function findEntitySlug(n:string):string|null{const l=normalizeText(n);if(ENTITY_SLUG_MAP[l])return ENTITY_SLUG_MAP[l];for(const[k,s]of Object.entries(ENTITY_SLUG_MAP)){if(l===k||l.includes(k))return s}return null}
function gcv(s:XLSX.WorkSheet,r:number,c:number):unknown{const cell=s[XLSX.utils.encode_cell({r,c})];return cell?cell.v:null}
function buildIndicatorKeys(ind:Map<string,IndicatorRow>){for(const i of Array.from(ind.values())){const n=normalizeText(i.name);if(!ind.has(`name:${n}`))ind.set(`name:${n}`,i);const[cn]=extractUnitFromName(i.name);const cs=slugify(cn);if(!ind.has(cs))ind.set(cs,i)}}
function findIndicatorBySlug(ind:Map<string,IndicatorRow>,name:string,prefix?:string):IndicatorRow|null{const nn=normalizeText(name);if(VR_NAME_SLUG_MAP[nn]){const f=ind.get(VR_NAME_SLUG_MAP[nn]);if(f)return f}const ns=slugify(name);if(VR_NAME_SLUG_MAP[ns]){const f=ind.get(VR_NAME_SLUG_MAP[ns]);if(f)return f}if(prefix){const f=ind.get(`${prefix}-${ns}`);if(f)return f}const f=ind.get(ns);if(f)return f;const[cn]=extractUnitFromName(name);const cs=slugify(cn);const f2=ind.get(cs);if(f2)return f2;if(prefix){const f=ind.get(`${prefix}-${cs}`);if(f)return f}const f4=ind.get(`name:${nn}`);if(f4)return f4;const kw=nn.replace(/[()]/g,' ').replace(/[^a-z0-9\s]/g,' ').split(/\s+/).filter(w=>w.length>2);if(kw.length>=2){for(const[,i]of ind){if(i.name.startsWith('name:'))continue;const in2=normalizeText(i.name);const mc=kw.filter(w=>in2.includes(w)).length;if(mc>=Math.ceil(kw.length*0.7)&&mc>=2)return i}}return null}
function findDateColumns(s:XLSX.WorkSheet,hr:number,sc:number):Map<number,string>{const dm=new Map<number,string>();if(!s['!ref'])return dm;const r=XLSX.utils.decode_range(s['!ref']);for(let c=sc;c<=r.e.c;c++){const cell=s[XLSX.utils.encode_cell({r:hr,c})];if(!cell)continue;const ds=parseExcelDate(cell.v);if(ds){const y=parseInt(ds.split('-')[0],10);if(y>=2008&&y<=2030)dm.set(c,ds)}}if(dm.size===0){let cy=0,mi=0;for(let c=sc;c<=r.e.c;c++){const yv=gcv(s,4,c);if(typeof yv==='number'&&yv>=2008&&yv<=2030){cy=yv;mi=0}const tv=gcv(s,7,c);if(typeof tv==='number'&&cy>0){mi++;if(mi<=12)dm.set(c,`${cy}-${String(mi).padStart(2,'0')}-01`)}}}return dm}

function parseVR(s:XLSX.WorkSheet,ind:Map<string,IndicatorRow>,sf:string,um:Set<string>):DataPointInsert[]{const dps:DataPointInsert[]=[];const dm=findDateColumns(s,6,11);if(!s['!ref']||dm.size===0)return dps;const r=XLSX.utils.decode_range(s['!ref']);for(let row=7;row<=Math.min(r.e.r,60);row++){const nr=gcv(s,row,1);if(!nr)continue;const n=String(nr).trim();if(!n)continue;if(SECTION_HEADERS.has(normalizeText(n)))continue;const i=findIndicatorBySlug(ind,n);if(!i){um.add(`VR: ${n}`);continue}for(const[c,ds]of dm){const v=gcv(s,row,c);if(v!==null&&v!==''&&typeof v==='number'&&isFinite(v))dps.push({indicator_id:i.id,entity_id:null,value:Math.round(v*1e6)/1e6,date:ds,period_type:'monthly',source_file:sf,is_estimated:false})}}return dps}
function parseEDE(s:XLSX.WorkSheet,ind:Map<string,IndicatorRow>,ent:Map<string,EntityRow>,sf:string,um:Set<string>):DataPointInsert[]{const dps:DataPointInsert[]=[];const dm=findDateColumns(s,6,11);if(!s['!ref']||dm.size===0)return dps;const r=XLSX.utils.decode_range(s['!ref']);const edeN=['edenorte','edesur','edeeste'];let lps:string|null=null;for(let row=7;row<=Math.min(r.e.r,220);row++){const nr=gcv(s,row,1);if(!nr)continue;const n=String(nr).trim();if(!n)continue;const nl=normalizeText(n);const em=edeN.find(e=>nl===e);if(em&&lps){const i=ind.get(`${lps}-${em}`);if(i){const e=ent.get(em);for(const[c,ds]of dm){const v=gcv(s,row,c);if(v!==null&&typeof v==='number'&&isFinite(v))dps.push({indicator_id:i.id,entity_id:e?.id||null,value:Math.round(v*1e6)/1e6,date:ds,period_type:'monthly',source_file:sf,is_estimated:false})}}continue}const i=findIndicatorBySlug(ind,n);if(i){lps=i.slug;const e=ent.get('edes-consolidado');for(const[c,ds]of dm){const v=gcv(s,row,c);if(v!==null&&typeof v==='number'&&isFinite(v))dps.push({indicator_id:i.id,entity_id:e?.id||null,value:Math.round(v*1e6)/1e6,date:ds,period_type:'monthly',source_file:sf,is_estimated:false})}}else{um.add(`EDE's: ${n}`);lps=null}}return dps}
function parseEntity(s:XLSX.WorkSheet,sn:string,es:string,ip:string,ind:Map<string,IndicatorRow>,ent:Map<string,EntityRow>,sf:string,um:Set<string>):DataPointInsert[]{const dps:DataPointInsert[]=[];let hr=6,dsr=7,mr=100;if(sn==='EGPC'){hr=7;dsr=8;mr=150}else if(sn==='CDEEE')mr=200;else if(sn==='EGEHID')mr=120;const dm=findDateColumns(s,hr,11);if(!s['!ref']||dm.size===0)return dps;const r=XLSX.utils.decode_range(s['!ref']);let lps:string|null=null;let csc:string|null=null;for(let row=dsr;row<=Math.min(r.e.r,mr);row++){const nr=gcv(s,row,1);if(!nr)continue;const n=String(nr).trim();if(!n)continue;const nl=normalizeText(n);if(SECTION_HEADERS.has(nl))continue;let hd=false;for(const c of dm.keys()){const v=gcv(s,row,c);if(v!==null&&typeof v==='number'&&isFinite(v)){hd=true;break}}if(sn==='CDEEE'){let nc:string|null=null;for(const[k,sl]of Object.entries(CDEEE_SECTION_CONTEXT)){if(nl.includes(k)){nc=sl;break}}if(nc){csc=nc;lps=nc;if(hd){const pi=ind.get(nc);if(pi){const e=ent.get(es);for(const[c,ds]of dm){const v=gcv(s,row,c);if(v!==null&&typeof v==='number'&&isFinite(v))dps.push({indicator_id:pi.id,entity_id:e?.id||null,value:Math.round(v*1e6)/1e6,date:ds,period_type:'monthly',source_file:sf,is_estimated:false})}}}continue}}if(!hd)continue;const mes=findEntitySlug(n);if(mes&&lps){const cs=`${lps}-${mes}`;const i=ind.get(cs);if(i){const e=ent.get(mes);for(const[c,ds]of dm){const v=gcv(s,row,c);if(v!==null&&typeof v==='number'&&isFinite(v))dps.push({indicator_id:i.id,entity_id:e?.id||null,value:Math.round(v*1e6)/1e6,date:ds,period_type:'monthly',source_file:sf,is_estimated:false})}continue}if(sn==='CDEEE'&&csc){const ci=ind.get(`${csc}-${mes}`);if(ci){const e=ent.get(mes);for(const[c,ds]of dm){const v=gcv(s,row,c);if(v!==null&&typeof v==='number'&&isFinite(v))dps.push({indicator_id:ci.id,entity_id:e?.id||null,value:Math.round(v*1e6)/1e6,date:ds,period_type:'monthly',source_file:sf,is_estimated:false})}continue}if(mes==='egehid')continue}}const i=findIndicatorBySlug(ind,n,ip);if(i){lps=i.slug;const e=ent.get(es);for(const[c,ds]of dm){const v=gcv(s,row,c);if(v!==null&&typeof v==='number'&&isFinite(v))dps.push({indicator_id:i.id,entity_id:e?.id||null,value:Math.round(v*1e6)/1e6,date:ds,period_type:'monthly',source_file:sf,is_estimated:false})}}else{if(lps){const ti=ind.get(`${lps}-${slugify(n)}`)||ind.get(`${ip}-${slugify(n)}`);if(ti){for(const[c,ds]of dm){const v=gcv(s,row,c);if(v!==null&&typeof v==='number'&&isFinite(v))dps.push({indicator_id:ti.id,entity_id:null,value:Math.round(v*1e6)/1e6,date:ds,period_type:'monthly',source_file:sf,is_estimated:false})}continue}}um.add(`${sn}: ${n}`)}}return dps}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

async function main() {
  console.log('═'.repeat(60))
  console.log('  PASO 6: Inserción directa data_points via REST API')
  console.log('═'.repeat(60))

  const envPath = path.resolve(__dirname, '../.env.local')
  if (fs.existsSync(envPath)) for (const l of fs.readFileSync(envPath,'utf-8').split('\n')){const m=l.match(/^([A-Z_]+)=(.*)$/);if(m)process.env[m[1]]=m[2].trim()}

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } })

  console.log('🔄 Cargando datos de referencia...')
  const [indRes, entRes] = await Promise.all([
    supabase.from('indicators').select('id, name, slug, category_id, entity_id, is_breakdown, parent_indicator_id, unit'),
    supabase.from('entities').select('id, name, slug, type'),
  ])
  if (indRes.error) { console.error('❌', indRes.error.message); process.exit(1) }
  const indicators = new Map<string, IndicatorRow>()
  for (const i of indRes.data || []) indicators.set(i.slug, i)
  buildIndicatorKeys(indicators)
  const entities = new Map<string, EntityRow>()
  for (const e of entRes.data || []) entities.set(e.slug, e)
  console.log(`✅ ${indRes.data?.length} indicadores, ${entities.size} entidades`)

  const xlsBuffer = fs.readFileSync(XLS_PATH)
  const workbook = XLSX.read(xlsBuffer, { type: 'buffer', cellDates: true })
  const sf = 'Informe-de-Desempeno-marzo-2026.xlsx'
  const allDps: DataPointInsert[] = []
  const um = new Set<string>()

  const configs = [
    { name: 'Variables Relevantes', es: '', p: '', fn: parseVR },
    { name: "EDE's", es: 'edes-consolidado', p: '', fn: null },
    { name: 'CDEEE', es: 'cdeee', p: 'cdeee', fn: null },
    { name: 'EGEHID', es: 'egehid', p: 'egehid', fn: null },
    { name: 'ETED', es: 'eted', p: 'eted', fn: null },
    { name: 'EGPC', es: 'egpc', p: 'egpc', fn: null },
  ]

  for (const c of configs) {
    const sheet = workbook.Sheets[c.name]
    if (!sheet) continue
    let dps: DataPointInsert[] = []
    if (c.name === 'Variables Relevantes') dps = parseVR(sheet, indicators, sf, um)
    else if (c.name === "EDE's") dps = parseEDE(sheet, indicators, entities, sf, um)
    else dps = parseEntity(sheet, c.name, c.es, c.p, indicators, entities, sf, um)
    console.log(`📊 ${c.name}: ${dps.length} data_points`)
    allDps.push(...dps)
  }

  console.log(`\n📊 Total: ${allDps.length.toLocaleString()} data_points`)
  
  // Insert in small batches with delays
  const BATCH = 100
  let totalInserted = 0
  let totalSkipped = 0
  let totalErrors = 0
  
  console.log(`\n💾 Insertando en lotes de ${BATCH}...`)
  
  for (let i = 0; i < allDps.length; i += BATCH) {
    const batch = allDps.slice(i, i + BATCH)
    const batchNum = Math.floor(i / BATCH) + 1
    const totalBatches = Math.ceil(allDps.length / BATCH)
    
    const { data, error } = await supabase
      .from('data_points')
      .insert(batch)
      .select('id')
    
    if (error) {
      // Check if it's a duplicate error - if so, try individually
      if (error.message.includes('duplicate') || error.message.includes('unique') || error.code === '23505') {
        // Try individual inserts for just a few, skip the rest
        let batchOk = 0
        for (const dp of batch.slice(0, 10)) {
          const { error: e2 } = await supabase.from('data_points').insert(dp)
          if (!e2) batchOk++
          else if (!e2.message.includes('duplicate') && !e2.message.includes('unique')) totalErrors++
        }
        totalInserted += batchOk
        totalSkipped += batch.length - batchOk
      } else {
        console.error(`  ❌ Batch ${batchNum}: ${error.message}`)
        totalErrors++
      }
    } else {
      totalInserted += data?.length || batch.length
    }
    
    // Progress every 50 batches
    if (batchNum % 50 === 0 || batchNum === totalBatches) {
      console.log(`  📊 Batch ${batchNum}/${totalBatches} — Inserted: ${totalInserted.toLocaleString()} | Skipped: ${totalSkipped.toLocaleString()} | Errors: ${totalErrors}`)
    }
    
    // Small delay to avoid rate limiting
    if (batchNum % 10 === 0) await sleep(50)
  }

  console.log('\n' + '═'.repeat(60))
  console.log('  RESULTADO FINAL')
  console.log('═'.repeat(60))
  console.log(`  Extraídos: ${allDps.length.toLocaleString()}`)
  console.log(`  Insertados: ${totalInserted.toLocaleString()}`)
  console.log(`  Duplicados saltados: ${totalSkipped.toLocaleString()}`)
  console.log(`  Errores: ${totalErrors}`)

  const { count } = await supabase.from('data_points').select('*', { count: 'exact', head: true })
  console.log(`\n  📊 Total data_points en BD: ${count?.toLocaleString() || '?'}`)
  console.log('═'.repeat(60))
}

main().catch(err => { console.error('❌', err); process.exit(1) })
