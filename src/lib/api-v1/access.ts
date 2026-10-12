import type { Scope } from './keys'

/** Fila devuelta por la función `api_authenticate` de la base (migración 007). */
export interface AuthResult {
  status: 'ok' | 'invalid' | 'revoked' | 'expired' | 'rate_limited_minute' | 'rate_limited_day'
  client_id: string | null
  client_name: string | null
  scopes: string[] | null
  allowed_ips: string[] | null
  limit_minute: number | null
  limit_day: number | null
  used_minute: number | null
  used_day: number | null
  reset_minute: string | null
}

export interface AccessDenied {
  status: number
  code: string
  title: string
  detail: string
}

/**
 * Decide si una petición autenticada puede continuar. Función pura (sin base ni red),
 * para poder probar cada caso de rechazo.
 */
export function evaluateAccess(auth: AuthResult | null, scope: Scope, ip: string | null): AccessDenied | null {
  if (!auth || auth.status === 'invalid') {
    return { status: 401, code: 'llave_invalida', title: 'Llave inválida', detail: 'La llave de API no existe. Revise la cabecera Authorization: Bearer <llave>.' }
  }
  if (auth.status === 'revoked') {
    return { status: 401, code: 'llave_revocada', title: 'Llave revocada', detail: 'Esta llave fue revocada. Solicite una nueva al administrador del Observatorio.' }
  }
  if (auth.status === 'expired') {
    return { status: 401, code: 'llave_vencida', title: 'Llave vencida', detail: 'Esta llave venció. Solicite una nueva al administrador del Observatorio.' }
  }
  if (auth.allowed_ips && auth.allowed_ips.length > 0 && (!ip || !auth.allowed_ips.includes(ip))) {
    return { status: 403, code: 'ip_no_permitida', title: 'IP no permitida', detail: 'Esta llave solo se puede usar desde direcciones IP autorizadas.' }
  }
  if (!(auth.scopes ?? []).includes(scope)) {
    return { status: 403, code: 'permiso_insuficiente', title: 'Permiso insuficiente', detail: `Esta llave no tiene el permiso "${scope}".` }
  }
  if (auth.status === 'rate_limited_day') {
    return { status: 429, code: 'limite_diario', title: 'Límite diario alcanzado', detail: `Se alcanzó el límite de ${auth.limit_day} peticiones por día para esta llave.` }
  }
  if (auth.status === 'rate_limited_minute') {
    return { status: 429, code: 'limite_por_minuto', title: 'Demasiadas peticiones', detail: `Se alcanzó el límite de ${auth.limit_minute} peticiones por minuto para esta llave.` }
  }
  return null
}
