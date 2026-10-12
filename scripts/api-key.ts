/**
 * Gestión de llaves de la API de integración (/api/v1) desde la terminal.
 * (También se gestionan en /admin, pestaña "Integraciones".)
 *
 *   bun scripts/api-key.ts create --name "Sky" [--contact "..."] [--days 365|0] [--scopes read:catalog,read:data,read:revisions]
 *   bun scripts/api-key.ts list
 *   bun scripts/api-key.ts revoke --prefix fpe_live_XXXXXXX
 *
 * La llave completa se muestra UNA sola vez al crearla; en la base solo queda su hash.
 * Usa SUPABASE_DB_URL de .env.local.
 */
import { Client } from 'pg'
import { ALL_SCOPES, generateApiKey, type Scope } from '../src/lib/api-v1/keys'

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`)
  return i !== -1 ? process.argv[i + 1] : undefined
}

async function main() {
  const command = process.argv[2]
  if (!process.env.SUPABASE_DB_URL) throw new Error('Falta SUPABASE_DB_URL en .env.local')
  const db = new Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } })
  await db.connect()
  try {
    if (command === 'create') {
      const name = arg('name')
      if (!name) throw new Error('Indique --name "<aplicación>"')
      const days = Number(arg('days') ?? 365)
      const scopes = (arg('scopes')?.split(',') ?? ALL_SCOPES) as Scope[]
      const unknown = scopes.filter(s => !ALL_SCOPES.includes(s))
      if (unknown.length) throw new Error(`Permisos desconocidos: ${unknown.join(', ')}. Válidos: ${ALL_SCOPES.join(', ')}`)
      const { key, prefix, hash } = generateApiKey()
      const { rows } = await db.query(
        `INSERT INTO api_clients (name, contact, key_prefix, key_hash, scopes, expires_at, created_by)
         VALUES ($1, $2, $3, $4, $5, CASE WHEN $6::int > 0 THEN now() + make_interval(days => $6::int) END, 'script')
         RETURNING id, expires_at`,
        [name, arg('contact') ?? null, prefix, hash, scopes, days],
      )
      console.log(`\nLlave creada para "${name}" (${rows[0].id})`)
      console.log(`Permisos: ${scopes.join(', ')}`)
      console.log(`Vence: ${rows[0].expires_at ? new Date(rows[0].expires_at).toISOString().slice(0, 10) : 'no vence'}`)
      console.log('\nCópiela ahora; no se volverá a mostrar:\n')
      console.log(`  ${key}\n`)
    } else if (command === 'list') {
      const { rows } = await db.query(
        `SELECT name, key_prefix, scopes, created_at, expires_at, revoked_at, last_used_at FROM api_clients ORDER BY created_at`)
      console.table(rows.map(r => ({
        nombre: r.name,
        prefijo: r.key_prefix,
        estado: r.revoked_at ? 'revocada' : r.expires_at && new Date(r.expires_at) <= new Date() ? 'vencida' : 'activa',
        vence: r.expires_at ? new Date(r.expires_at).toISOString().slice(0, 10) : '—',
        ultimo_uso: r.last_used_at ? new Date(r.last_used_at).toISOString().slice(0, 16).replace('T', ' ') : '—',
      })))
    } else if (command === 'revoke') {
      const prefix = arg('prefix')
      if (!prefix) throw new Error('Indique --prefix fpe_live_XXXXXXX')
      const { rowCount } = await db.query(
        `UPDATE api_clients SET revoked_at = now() WHERE key_prefix = $1 AND revoked_at IS NULL`, [prefix])
      console.log(rowCount ? `Llave ${prefix} revocada.` : `No hay una llave activa con el prefijo ${prefix}.`)
    } else {
      console.log('Uso: bun scripts/api-key.ts create --name "<app>" | list | revoke --prefix <prefijo>')
    }
  } finally {
    await db.end()
  }
}

main().catch(err => {
  console.error(`Error: ${err.message}`)
  process.exit(1)
})
