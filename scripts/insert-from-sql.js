/**
 * PASO 6: Inserción directa con concurrencia
 */
const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Load env
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  for (const l of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const m = l.match(/^([A-Z_]+)=(.*)$/);
    if (m) process.env[m[1]] = m[2].trim();
  }
}

// Use the TypeScript parser to generate data, then insert
async function main() {
  // We'll import the parse logic from the TS script at runtime
  // For simplicity, let's use the SQL file approach: read the SQL and split into small statements
  
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // Check current count
  const { count: initialCount } = await sb.from('data_points').select('*', { count: 'exact', head: true });
  console.log('📊 Current data_points in DB:', initialCount);
  
  if (initialCount > 60000) {
    console.log('✅ Already have sufficient data (>60K). Skipping insertion.');
    return;
  }

  // Parse the SQL file to extract values
  const sqlPath = path.resolve(__dirname, '../download/003_seed_data_points.sql');
  if (!fs.existsSync(sqlPath)) {
    console.error('❌ SQL file not found. Run generate-sql-seed.ts first.');
    process.exit(1);
  }

  console.log('📄 Reading SQL file...');
  const sql = fs.readFileSync(sqlPath, 'utf-8');
  
  // Extract all value tuples from the SQL
  const valueRegex = /\(\s*'([^']+)'\s*,\s*(?:NULL|'([^']*)')\s*,\s*([0-9.-]+)\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*(TRUE|FALSE)\s*\)/g;
  
  const dataPoints = [];
  let match;
  while ((match = valueRegex.exec(sql)) !== null) {
    dataPoints.push({
      indicator_id: match[1],
      entity_id: match[2] || null,
      value: parseFloat(match[3]),
      date: match[4],
      period_type: match[5],
      source_file: match[6],
      is_estimated: match[7] === 'TRUE',
    });
  }
  
  console.log('📊 Parsed', dataPoints.length, 'data_points from SQL file');
  
  if (dataPoints.length === 0) {
    console.error('❌ No data_points found in SQL file');
    process.exit(1);
  }

  // Insert with concurrency
  const BATCH = 50;
  const CONCURRENCY = 8;
  let totalInserted = 0;
  let totalSkipped = 0;
  let totalErrors = 0;
  const startTime = Date.now();

  async function insertBatch(batch, retryCount = 0) {
    try {
      const { data, error } = await sb.from('data_points').insert(batch).select('id');
      if (error) {
        if ((error.code === '23505' || error.message.includes('duplicate') || error.message.includes('unique')) && retryCount === 0) {
          // Split into smaller batches
          let ok = 0;
          for (let j = 0; j < batch.length; j += 5) {
            const sub = batch.slice(j, j + 5);
            const { data: d2, error: e2 } = await sb.from('data_points').insert(sub);
            if (e2) totalSkipped += sub.length;
            else ok += sub.length;
          }
          return ok;
        }
        totalErrors++;
        return 0;
      }
      return data?.length || batch.length;
    } catch (e) {
      totalErrors++;
      return 0;
    }
  }

  console.log(`💾 Inserting ${dataPoints.length} records (batch=${BATCH}, concurrency=${CONCURRENCY})...`);

  for (let i = 0; i < dataPoints.length; i += BATCH * CONCURRENCY) {
    const promises = [];
    for (let j = 0; j < CONCURRENCY && (i + j * BATCH) < dataPoints.length; j++) {
      const start = i + j * BATCH;
      const batch = dataPoints.slice(start, Math.min(start + BATCH, dataPoints.length));
      promises.push(insertBatch(batch));
    }
    const results = await Promise.all(promises);
    totalInserted += results.reduce((a, b) => a + b, 0);

    const progress = Math.min(i + BATCH * CONCURRENCY, dataPoints.length);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const rate = (totalInserted / ((Date.now() - startTime) / 1000)).toFixed(0);
    
    if (progress % 5000 < BATCH * CONCURRENCY || progress >= dataPoints.length) {
      console.log(`  ${progress}/${dataPoints.length} — Inserted: ${totalInserted} | Skipped: ${totalSkipped} | Errors: ${totalErrors} | ${rate} rec/s | ${elapsed}s`);
    }
  }

  const { count: finalCount } = await sb.from('data_points').select('*', { count: 'exact', head: true });
  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  
  console.log('\n' + '═'.repeat(50));
  console.log('  RESULTADO FINAL');
  console.log('═'.repeat(50));
  console.log(`  Extraídos del SQL: ${dataPoints.length}`);
  console.log(`  Insertados: ${totalInserted}`);
  console.log(`  Duplicados saltados: ${totalSkipped}`);
  console.log(`  Errores: ${totalErrors}`);
  console.log(`  Total en BD (antes): ${initialCount}`);
  console.log(`  Total en BD (ahora): ${finalCount}`);
  console.log(`  Nuevos registros: ${(finalCount || 0) - (initialCount || 0)}`);
  console.log(`  Tiempo total: ${totalTime}s`);
  console.log('═'.repeat(50));
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
