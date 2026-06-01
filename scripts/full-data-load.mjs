/**
 * Script de Carga Completa de Datos Históricos
 * Ejecuta el parser XLS directamente desde línea de comandos
 * Evita timeouts del navegador al no pasar por la API HTTP
 * 
 * Uso: node scripts/full-data-load.mjs [--clean] [--sheet "Variables Relevantes"]
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

// Load .env.local manually
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '..', '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
for (const line of envContent.split('\n')) {
  const match = line.match(/^([A-Z_]+)=(.*)$/);
  if (match && !process.env[match[1]]) {
    process.env[match[1]] = match[2].trim();
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Faltan variables de entorno. Verifica .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Parse command line args
const args = process.argv.slice(2);
const shouldClean = args.includes('--clean');
const sheetArgIdx = args.indexOf('--sheet');
const specificSheet = sheetArgIdx !== -1 ? args[sheetArgIdx + 1] : null;

async function main() {
  console.log('═'.repeat(60));
  console.log('  CARGA COMPLETA DE DATOS HISTÓRICOS');
  console.log('  Observatorio Energético — Fuerza del Pueblo');
  console.log('═'.repeat(60));
  console.log();

  // Step 1: Check current state
  const { count: currentDP } = await supabase.from('data_points').select('*', { count: 'exact', head: true });
  const { count: indCount } = await supabase.from('indicators').select('*', { count: 'exact', head: true });
  const { count: entCount } = await supabase.from('entities').select('*', { count: 'exact', head: true });
  console.log(`📊 Estado actual: ${currentDP?.toLocaleString()} data_points, ${indCount} indicadores, ${entCount} entidades`);
  console.log();

  // Step 2: Optionally clean existing data
  if (shouldClean && currentDP > 0) {
    console.log('🗑️  Limpiando data_points existentes...');
    const { error: delError } = await supabase.from('data_points').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (delError) {
      console.error('❌ Error al limpiar:', delError.message);
      process.exit(1);
    }
    console.log('✅ Data_points limpiados');
    console.log();
  }

  // Step 3: Read the XLS file
  const xlsPath = resolve(__dirname, '..', 'upload', 'Informe-de-Desempeno-marzo-2026.xlsx');
  console.log(`📄 Leyendo: ${xlsPath}`);
  
  let fileBuffer;
  try {
    fileBuffer = readFileSync(xlsPath);
    console.log(`📁 Archivo: ${(fileBuffer.length / 1024 / 1024).toFixed(1)} MB`);
  } catch (err) {
    console.error('❌ No se encontró el archivo XLS:', err.message);
    process.exit(1);
  }
  console.log();

  // Step 4: Use the parse-xls module via dynamic import workaround
  // Since parse-xls.ts uses @/lib/supabase-admin, we'll implement the parsing inline
  
  const XLSX = (await import('xlsx')).default;
  
  // Load reference data from Supabase
  console.log('📥 Cargando indicadores y entidades desde Supabase...');
  
  const { data: indicators } = await supabase.from('indicators').select('id, name, slug, category_id, entity_id, is_breakdown, parent_indicator_id, unit');
  const { data: entities } = await supabase.from('entities').select('id, name, slug, type');
  const { data: categories } = await supabase.from('indicator_categories').select('id, name, slug, source_sheet');
  
  console.log(`   ${indicators?.length} indicadores, ${entities?.length} entidades, ${categories?.length} categorías`);
  console.log();

  // Build lookup maps
  const indicatorMap = new Map();
  for (const ind of indicators || []) {
    indicatorMap.set(ind.slug, ind);
    const normName = (ind.name || '').toString().trim().toLowerCase().replace(/\s+/g, ' ').replace(/[.,]+$/, '');
    indicatorMap.set(`name:${normName}`, ind);
  }
  
  const entityMap = new Map();
  for (const ent of entities || []) {
    entityMap.set(ent.slug, ent);
  }

  // Helper functions
  function slugify(text) {
    let t = text.toLowerCase().trim();
    t = t.replace(/\$/g, 'd');
    t = t.replace(/[()]/g, '-');
    t = t.replace(/ñ/g, 'n').replace(/ó/g, 'o').replace(/í/g, 'i').replace(/á/g, 'a').replace(/é/g, 'e').replace(/ú/g, 'u');
    t = t.replace(/[^a-z0-9]+/g, '-');
    t = t.replace(/-+/g, '-');
    t = t.replace(/^-|-$/g, '');
    return t;
  }

  function extractUnitFromName(name) {
    const match = name.match(/\(([^)]+)\)\s*$/);
    if (match) return [name.slice(0, match.index).trim(), match[1]];
    return [name, ''];
  }

  function normalizeText(text) {
    return (text || '').toString().trim().toLowerCase().replace(/\s+/g, ' ').replace(/[.,]+$/, '');
  }

  function findIndicatorBySlug(name, prefix) {
    if (prefix) {
      const found = indicatorMap.get(`${prefix}-${slugify(name)}`);
      if (found) return found;
    }
    const found1 = indicatorMap.get(slugify(name));
    if (found1) return found1;
    const [cleanName] = extractUnitFromName(name);
    if (prefix) {
      const found2 = indicatorMap.get(`${prefix}-${slugify(cleanName)}`);
      if (found2) return found2;
    }
    const found3 = indicatorMap.get(slugify(cleanName));
    if (found3) return found3;
    const found4 = indicatorMap.get(`name:${normalizeText(name)}`);
    if (found4) return found4;
    return null;
  }

  const ENTITY_SLUG_MAP = {
    'edenorte': 'edenorte', 'edesur': 'edesur', 'edeeste': 'edeeste',
    "ede's": 'edes-consolidado', 'total edes': 'edes-consolidado',
    'cdeee': 'cdeee', 'egehid': 'egehid', 'eted': 'eted', 'egpc': 'egpc',
    'punta catalina': 'egpc', 'gsf': 'gsf', 'cespm': 'cespm', 'dpp': 'dpp',
    'egehaina': 'egehaina-larimar', 'larimar': 'egehaina-larimar',
    'electronic jrc': 'electronic-jrc', 'montecristi solar': 'montecristi-solar',
    'c power': 'c-power', 'cpower': 'c-power', 'pecasa': 'pecasa',
    'matafongo': 'matafongo', 'wcg energy': 'wcg-energy', 'wcg': 'wcg-energy',
    'emerald solar': 'emerald-solar', 'poseidon': 'poseidon',
    'quisqueya ii': 'quisqueya-ii', 'quisqueya': 'quisqueya-ii',
    'falcondo': 'falcondo', 'rsj': 'rsj', 'mercado spot': 'mercado-spot', 'spot': 'mercado-spot',
  };

  function findEntitySlug(name) {
    const lower = normalizeText(name);
    for (const [key, slug] of Object.entries(ENTITY_SLUG_MAP)) {
      if (lower === key || lower.includes(key)) return slug;
    }
    return null;
  }

  function parseExcelDate(value) {
    if (!value) return null;
    if (value instanceof Date) {
      if (isNaN(value.getTime())) return null;
      return value.toISOString().split('T')[0];
    }
    if (typeof value === 'number') {
      const date = new Date((value - 25569) * 86400 * 1000);
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
    const cellAddr = XLSX.utils.encode_cell({ r: row, c: col });
    const cell = sheet[cellAddr];
    return cell ? cell.v : null;
  }

  function findDateColumns(sheet, headerRow, startCol) {
    const dateMap = new Map();
    if (!sheet['!ref']) return dateMap;
    const range = XLSX.utils.decode_range(sheet['!ref']);
    for (let col = startCol; col <= range.e.c; col++) {
      const cellAddr = XLSX.utils.encode_cell({ r: headerRow, c: col });
      const cell = sheet[cellAddr];
      if (!cell) continue;
      const dateStr = parseExcelDate(cell.v);
      if (dateStr) {
        const year = parseInt(dateStr.split('-')[0], 10);
        if (year >= 2008 && year <= 2030) {
          dateMap.set(col, dateStr);
        }
      }
    }
    return dateMap;
  }

  // Parse workbook
  console.log('📊 Parseando archivo XLS...');
  const workbook = XLSX.read(fileBuffer, { type: 'buffer', cellDates: true });
  console.log(`   Hojas: ${workbook.SheetNames.join(', ')}`);
  console.log();

  const allDataPoints = [];
  let totalMatched = 0;
  let totalUnmatched = 0;
  const unmatchedNames = new Set();

  // Sheet configurations
  const sheetConfigs = [
    { name: 'Variables Relevantes', entitySlug: '', prefix: '', parser: 'variables' },
    { name: "EDE's", entitySlug: 'edes-consolidado', prefix: '', parser: 'edes' },
    { name: 'CDEEE', entitySlug: 'cdeee', prefix: 'cdeee', parser: 'entity' },
    { name: 'EGEHID', entitySlug: 'egehid', prefix: 'egehid', parser: 'entity' },
    { name: 'ETED', entitySlug: 'eted', prefix: 'eted', parser: 'entity' },
    { name: 'EGPC', entitySlug: 'egpc', prefix: 'egpc', parser: 'entity' },
  ];

  for (const config of sheetConfigs) {
    if (specificSheet && config.name !== specificSheet) continue;

    const sheet = workbook.Sheets[config.name];
    if (!sheet) {
      console.log(`  ⏭️  ${config.name}: no encontrada`);
      continue;
    }

    const range = XLSX.utils.decode_range(sheet['!ref']);
    const headerRow = config.name === 'EGPC' ? 7 : 6;
    const dataStartRow = config.name === 'EGPC' ? 8 : 7;
    const dateMap = findDateColumns(sheet, headerRow, 11);

    console.log(`📊 Parseando: ${config.name}`);
    console.log(`   ${dateMap.size} columnas de fecha, ${range.e.r - dataStartRow + 1} filas de datos`);

    let matched = 0;
    let unmatched = 0;
    let lastParentSlug = null;

    const edeNames = ['edenorte', 'edesur', 'edeeste'];

    for (let row = dataStartRow; row <= range.e.r; row++) {
      const nameRaw = getCellValue(sheet, row, 1);
      if (!nameRaw) continue;
      const name = String(nameRaw).trim();
      if (!name) continue;

      let indicator = null;
      let matchedEntitySlug = null;

      if (config.parser === 'variables') {
        indicator = findIndicatorBySlug(name);
      } else if (config.parser === 'edes') {
        const nameLower = normalizeText(name);
        const edeMatch = edeNames.find(ede => nameLower === ede);
        
        if (edeMatch && lastParentSlug) {
          const childSlug = `${lastParentSlug}-${edeMatch}`;
          const childInd = indicatorMap.get(childSlug);
          if (childInd) {
            indicator = childInd;
            matchedEntitySlug = edeMatch;
          } else {
            continue;
          }
        } else {
          indicator = findIndicatorBySlug(name);
          if (indicator) {
            lastParentSlug = indicator.slug;
            matchedEntitySlug = 'edes-consolidado';
          } else {
            lastParentSlug = null;
            continue;
          }
        }
      } else if (config.parser === 'entity') {
        // Check if entity breakdown
        const detectedEntity = findEntitySlug(name);
        if (detectedEntity && lastParentSlug) {
          const childSlug = `${lastParentSlug}-${detectedEntity}`;
          const childInd = indicatorMap.get(childSlug);
          if (childInd) {
            indicator = childInd;
            matchedEntitySlug = detectedEntity;
          } else {
            // Try as text breakdown
            const textSlug = `${lastParentSlug}-${slugify(name)}`;
            const textInd = indicatorMap.get(textSlug);
            if (textInd) {
              indicator = textInd;
            } else {
              continue;
            }
          }
        } else {
          indicator = findIndicatorBySlug(name, config.prefix);
          if (indicator) {
            lastParentSlug = indicator.slug;
            matchedEntitySlug = config.entitySlug;
          } else {
            // Try as text breakdown of last parent
            if (lastParentSlug) {
              const textSlug = `${lastParentSlug}-${slugify(name)}`;
              const textInd = indicatorMap.get(textSlug);
              if (textInd) {
                indicator = textInd;
                continue; // skip the unmatched increment below
              }
            }
            lastParentSlug = null;
            continue;
          }
        }
      }

      if (!indicator) {
        unmatched++;
        if (unmatchedNames.size < 50) unmatchedNames.add(name);
        continue;
      }

      matched++;
      const entity = matchedEntitySlug ? entityMap.get(matchedEntitySlug) : null;

      // Extract all monthly values
      for (const [col, dateStr] of dateMap) {
        const value = getCellValue(sheet, row, col);
        if (value !== null && value !== '' && typeof value === 'number' && isFinite(value)) {
          allDataPoints.push({
            indicator_id: indicator.id,
            entity_id: entity?.id || null,
            value: Math.round(value * 1e6) / 1e6,
            date: dateStr,
            period_type: 'monthly',
            source_file: 'Informe-de-Desempeno-marzo-2026.xlsx',
            is_estimated: false,
          });
        }
      }
    }

    totalMatched += matched;
    totalUnmatched += unmatched;
    console.log(`   ✅ ${matched} indicadores matcheados, ${unmatched} sin match → ${allDataPoints.length - (allDataPoints.length - matched * dateMap.size)} data_points estimados`);
    console.log(`   📈 Total acumulado: ${allDataPoints.length.toLocaleString()} data_points`);
    console.log();
  }

  // Summary before insert
  const dates = allDataPoints.map(dp => dp.date).sort();
  console.log('═'.repeat(60));
  console.log(`📊 RESUMEN DE EXTRACCIÓN:`);
  console.log(`   Indicadores matcheados: ${totalMatched}`);
  console.log(`   Indicadores sin match: ${totalUnmatched}`);
  console.log(`   Total data_points extraídos: ${allDataPoints.length.toLocaleString()}`);
  if (dates.length > 0) {
    console.log(`   Rango: ${dates[0]} → ${dates[dates.length - 1]}`);
  }
  console.log('═'.repeat(60));
  console.log();

  if (unmatchedNames.size > 0) {
    console.log('⚠️  Indicadores sin match (muestra):');
    [...unmatchedNames].slice(0, 20).forEach(n => console.log(`   - "${n}"`));
    console.log();
  }

  // Step 5: Insert into Supabase in batches
  if (allDataPoints.length === 0) {
    console.log('❌ No se extrajeron data_points. Abortando.');
    process.exit(1);
  }

  console.log(`💾 Insertando ${allDataPoints.length.toLocaleString()} data_points en Supabase...`);
  console.log('   (Esto puede tardar varios minutos)');
  console.log();

  const BATCH_SIZE = 500;
  let inserted = 0;
  let errors = 0;
  const startTime = Date.now();

  for (let i = 0; i < allDataPoints.length; i += BATCH_SIZE) {
    const batch = allDataPoints.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(allDataPoints.length / BATCH_SIZE);

    const { data, error } = await supabase
      .from('data_points')
      .upsert(batch, {
        onConflict: 'indicator_id,date,entity_id',
        ignoreDuplicates: true,
      })
      .select('id');

    if (error) {
      console.error(`   ❌ Lote ${batchNum}/${totalBatches}: ${error.message}`);
      // Try individually
      for (const dp of batch) {
        const { error: singleError } = await supabase
          .from('data_points')
          .upsert(dp, { onConflict: 'indicator_id,date,entity_id', ignoreDuplicates: true });
        if (singleError) errors++;
        else inserted++;
      }
    } else {
      inserted += data?.length || batch.length;
    }

    // Progress indicator
    if (batchNum % 20 === 0 || batchNum === totalBatches) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const rate = (inserted / (Date.now() - startTime) * 1000).toFixed(0);
      console.log(`   Lote ${batchNum}/${totalBatches} | ${inserted.toLocaleString()} insertados | ${elapsed}s | ${rate}/seg`);
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  
  console.log();
  console.log('═'.repeat(60));
  console.log(`✅ CARGA COMPLETADA`);
  console.log(`   Insertados: ${inserted.toLocaleString()}`);
  console.log(`   Errores: ${errors}`);
  console.log(`   Tiempo: ${totalTime}s`);
  console.log('═'.repeat(60));

  // Final verification
  const { count: finalCount } = await supabase.from('data_points').select('*', { count: 'exact', head: true });
  console.log(`\n📊 Total data_points en BD: ${finalCount?.toLocaleString()}`);

  // Check by year
  const { data: sampleDP } = await supabase.from('data_points').select('date');
  const yearMap = {};
  (sampleDP || []).forEach(d => {
    const y = d.date?.substring(0, 4);
    if (y) yearMap[y] = (yearMap[y] || 0) + 1;
  });
  console.log('\n📅 Por año:');
  Object.entries(yearMap).sort().forEach(([y, c]) => console.log(`   ${y}: ${c.toLocaleString()}`));
}

main().catch(err => {
  console.error('❌ Error fatal:', err);
  process.exit(1);
});
