import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { ALL_SCOPES, generateApiKey, type Scope } from '@/lib/api-v1/keys'

export const dynamic = 'force-dynamic'

/**
 * Gestión de llaves de /api/v1 (pestaña "Integraciones" de /admin; protegida por proxy.ts).
 * GET: llaves y uso · POST: crear · PATCH: revocar o rotar.
 * La llave completa solo se devuelve al crearla o rotarla; en la base queda su hash.
 */

const createSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(300).optional(),
  contact: z.string().trim().max(120).optional(),
  days: z.number().int().min(0).max(1825).default(365),
  scopes: z.array(z.enum(ALL_SCOPES as [Scope, ...Scope[]])).min(1).default(ALL_SCOPES),
  rate_limit_per_minute: z.number().int().min(1).max(1000).default(60),
  rate_limit_per_day: z.number().int().min(1).max(1_000_000).default(10000),
})

const patchSchema = z.object({ id: z.string().uuid(), action: z.enum(['revoke', 'rotate']) })

const COLUMNS = 'id, name, description, contact, key_prefix, scopes, rate_limit_per_minute, rate_limit_per_day, allowed_ips, expires_at, revoked_at, last_used_at, created_at'

function addDays(days: number): string | null {
  return days > 0 ? new Date(Date.now() + days * 86_400_000).toISOString() : null
}

async function insertKey(fields: Omit<z.infer<typeof createSchema>, 'days'> & { expires_at: string | null }) {
  const { key, prefix, hash } = generateApiKey()
  const { data, error } = await supabaseAdmin.from('api_clients').insert({
    name: fields.name,
    description: fields.description || null,
    contact: fields.contact || null,
    key_prefix: prefix,
    key_hash: hash,
    scopes: fields.scopes,
    rate_limit_per_minute: fields.rate_limit_per_minute,
    rate_limit_per_day: fields.rate_limit_per_day,
    expires_at: fields.expires_at,
    created_by: 'admin',
  }).select(COLUMNS).single()
  if (error) throw error
  return { client: data, key }
}

export async function GET() {
  try {
    const since = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10)
    const [clients, usage] = await Promise.all([
      supabaseAdmin.from('api_clients').select(COLUMNS).order('created_at', { ascending: false }),
      supabaseAdmin.from('api_usage_daily').select('client_id, day, requests, errors, avg_ms').gte('day', since).order('day', { ascending: true }),
    ])
    if (clients.error) throw clients.error
    if (usage.error) throw usage.error
    return NextResponse.json({ clients: clients.data, usage: usage.data, scopes: ALL_SCOPES })
  } catch (err) {
    console.error('[admin/api-keys] GET:', err)
    return NextResponse.json({ error: 'No se pudieron leer las llaves' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const parsed = createSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ') }, { status: 422 })
  }
  try {
    const { days, ...fields } = parsed.data
    return NextResponse.json(await insertKey({ ...fields, expires_at: addDays(days) }), { status: 201 })
  } catch (err) {
    console.error('[admin/api-keys] POST:', err)
    return NextResponse.json({ error: 'No se pudo crear la llave' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const parsed = patchSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Solicitud inválida' }, { status: 422 })
  const { id, action } = parsed.data
  try {
    const { data: current, error } = await supabaseAdmin.from('api_clients').select(COLUMNS).eq('id', id).maybeSingle()
    if (error) throw error
    if (!current) return NextResponse.json({ error: 'Llave no encontrada' }, { status: 404 })

    if (action === 'revoke') {
      const { data, error: upd } = await supabaseAdmin.from('api_clients')
        .update({ revoked_at: new Date().toISOString() }).eq('id', id).is('revoked_at', null).select(COLUMNS).maybeSingle()
      if (upd) throw upd
      return NextResponse.json({ client: data ?? current })
    }

    // Rotar: llave nueva con la misma configuración; la anterior sigue activa hasta revocarla
    // (así la aplicación cambia de llave sin cortes)
    const created = await insertKey({
      name: current.name,
      description: current.description ?? undefined,
      contact: current.contact ?? undefined,
      scopes: current.scopes as Scope[],
      rate_limit_per_minute: current.rate_limit_per_minute,
      rate_limit_per_day: current.rate_limit_per_day,
      expires_at: current.expires_at ? addDays(365) : null,
    })
    return NextResponse.json({ ...created, replaces: current.key_prefix }, { status: 201 })
  } catch (err) {
    console.error('[admin/api-keys] PATCH:', err)
    return NextResponse.json({ error: 'No se pudo actualizar la llave' }, { status: 500 })
  }
}
