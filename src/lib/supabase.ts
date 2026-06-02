import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const isConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (!isConfigured && typeof window === 'undefined') {
  console.warn(
    '[supabase] NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing. ' +
    'API routes will return empty data. Set these in .env.local to enable database access.'
  )
}

/**
 * Supabase client para uso público (frontend / browser).
 * Respeta RLS — solo puede hacer lo que las policies permiten.
 * Usar para: lecturas del observatorio, foro público, login.
 *
 * If credentials are missing, returns a dummy client that will
 * return empty results instead of crashing the entire server.
 */
export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : createClient('https://placeholder.supabase.co', 'placeholder-key', {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

/** Check if Supabase is properly configured */
export const isSupabaseConfigured = isConfigured

export type SupabaseClient = typeof supabase
