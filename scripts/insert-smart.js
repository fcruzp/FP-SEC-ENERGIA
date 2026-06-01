/**
 * PASO 6: Inserción inteligente — solo registros nuevos
 * Filtra duplicados antes de insertar para máxima eficiencia
 */
const { createClient } = require('@supabase/supabase-js');
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

async function main() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // 1. Get existing data_points keys (indicator_id, date, entity_id)
  console.log('📊 Loading existing data_points...');
  const existing = new Set();
  let offset = 0;
  const LIMIT = 1000;
  while (true) {
    const { data, error } = await sb
      .from('data_points')
      .select('indicator_id,date,entity_id')
      .range(offset, offset + LIMIT - 1)
      .order('date', { ascending: true });
    if (error) { console.error('Error:', error.message); break; }
    if (!data || data.length === 0) break;
    for (const dp of data) {
      existing.add(`${dp.indicator_id}|${dp.date}|${dp.entity_id || 'NULL'}`);
    }
    offset += LIMIT;
    if (data.length < LIMIT) break;
  }
  console.log(`  Existing keys: ${existing.size}`);

  // 2. Parse the SQL file to extract data_points
  console.log('📄 Parsing SQL file...');
  const sqlPath = path.resolve(__dirname, '../download/003_seed_data_points.sql');
  const sql = fs.readFileSync(sqlPath, 'utf-8');
  
  const valueRegex = /\(\s*'([^']+)'\s*,\s*(?:NULL|'([^']*)')\s*,\s*([0-9.e+-]+)\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*(TRUE|FALSE)\s*\)/g;
  
  const newDataPoints = [];
  let match;
  while ((match = valueRegex.exec(sql)) !== null) {
    const indicatorId = match[1];
    const entityId = match[2] || null;
    const key = `${indicatorId}|${match[4]}|${entityId || 'NULL'}`;
    
    if (!existing.has(key)) {
      newDataPoints.push({
        indicator_id: indicatorId,
        entity_id: entityId,
        value: parseFloat(match[3]),
        date: match[4],
        period_type: match[5],
        source_file: match[6],
        is_estimated: match[7] === 'TRUE',
      });
    }
  }
  
  console.log(`  New data_points to insert: ${newDataPoints.length}`);
  
  if (newDataPoints.length === 0) {
    console.log('✅ All data_points already inserted!');
    return;
  }

  // 3. Insert new data_points in concurrent batches
  const BATCH = 100;
  const CONCURRENCY = 10;
  let totalInserted = 0;
  let totalErrors = 0;
  const startTime = Date.now();

  for (let i = 0; i < newDataPoints.length; i += BATCH * CONCURRENCY) {
    const promises = [];
    for (let j = 0; j < CONCURRENCY && (i + j * BATCH) < newDataPoints.length; j++) {
      const start = i + j * BATCH;
      const batch = newDataPoints.slice(start, Math.min(start + BATCH, newDataPoints.length));
      promises.push(
        sb.from('data_points').insert(batch).select('id')
          .then(({ data, error }) => {
            if (error) {
              // Try individual inserts for this batch
              return Promise.all(batch.map(dp => 
                sb.from('data_points').insert(dp)
                  .then(({ error: e2 }) => e2 ? 0 : 1)
              )).then(results => results.reduce((a, b) => a + b, 0));
            }
            return data?.length || batch.length;
          })
          .catch(() => 0)
      );
    }
    const results = await Promise.all(promises);
    totalInserted += results.reduce((a, b) => a + b, 0);

    const progress = Math.min(i + BATCH * CONCURRENCY, newDataPoints.length);
    if (progress % 2000 < BATCH * CONCURRENCY || progress >= newDataPoints.length) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`  ${progress}/${newDataPoints.length} — Inserted: ${totalInserted} | Errors: ${totalErrors} | ${elapsed}s`);
    }
  }

  const { count: finalCount } = await sb.from('data_points').select('*', { count: 'exact', head: true });
  console.log(`\n✅ Done! Total in DB: ${finalCount} | Inserted: ${totalInserted} | Time: ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
