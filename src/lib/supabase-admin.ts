import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
}

if (!supabaseServiceKey) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY — required for admin operations')
}

/**
 * Supabase admin client para uso en API routes (server-side only).
 * Usa service_role key que BYPASEA RLS completamente.
 * Usar para: escrituras del backoffice, parser XLS, moderación, gestión de datos.
 *
 * ⚠️ NUNCA importar este archivo en componentes del frontend.
 * ⚠️ NUNCA exponer la service_role key al browser.
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export type SupabaseAdminClient = typeof supabaseAdmin
