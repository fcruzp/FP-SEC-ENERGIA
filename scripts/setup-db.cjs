/**
 * Crea el esquema y el catálogo de indicadores en una base Supabase vacía.
 * Ejecuta download/001_observatorio_foro_schema.sql y download/002_seed_indicators.sql
 * usando la conexión directa a Postgres (SUPABASE_DB_URL en .env.local).
 *
 * Uso: node scripts/setup-db.cjs
 * Después: node scripts/full-load.cjs --dry-run  →  node scripts/full-load.cjs
 */
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Load env
const envContent = fs.readFileSync(path.resolve(__dirname, '..', '.env.local'), 'utf-8');
for (const line of envContent.split('\n')) {
  const match = line.match(/^([A-Z_]+)=(.*)$/);
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2].trim().replace(/^"|"$/g, '');
}

const FILES = ['000_users_prereq.sql', '001_observatorio_foro_schema.sql', '002_seed_indicators.sql', '004_unidades_porcentaje.sql', '005_procedencia_y_ediciones.sql', '006_vista_resumen_indicadores.sql'];

async function main() {
  if (!process.env.SUPABASE_DB_URL) {
    console.error('❌ Falta SUPABASE_DB_URL en .env.local');
    process.exit(1);
  }
  const client = new Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('✅ Conectado a Postgres');

  for (const file of FILES) {
    const sql = fs.readFileSync(path.resolve(__dirname, '..', 'download', file), 'utf-8');
    console.log(`▶️  Ejecutando ${file}...`);
    await client.query(sql);
    console.log(`   ✅ ${file} OK`);
  }

  const counts = await client.query(`
    SELECT (SELECT count(*) FROM indicator_categories) AS categorias,
           (SELECT count(*) FROM indicators) AS indicadores,
           (SELECT count(*) FROM entities) AS entidades,
           (SELECT count(*) FROM data_points) AS data_points`);
  console.table(counts.rows);
  await client.end();
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
