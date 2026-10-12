import { NextResponse, after, type NextRequest } from 'next/server'
import { createHash, randomUUID } from 'crypto'
import { ZodError } from 'zod'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { KEY_PATTERN, hashApiKey, readBearer, type Scope } from './keys'
import { evaluateAccess, type AuthResult } from './access'
import { API_VERSION } from './version'

/**
 * Infraestructura común de /api/v1: autenticación por llave, límite de uso,
 * errores RFC 9457 (application/problem+json), envoltura de respuesta y auditoría.
 */

export class ApiError extends Error {
  constructor(public status: number, public code: string, public title: string, detail: string) {
    super(detail)
  }
}

export interface ApiContext {
  request: NextRequest
  url: URL
  params: Record<string, string>
  requestId: string
  client: { id: string; name: string; scopes: string[] }
}

export interface ApiResult {
  data: unknown
  meta?: Record<string, unknown>
}

export function problem(status: number, code: string, title: string, detail: string, requestId: string, headers: Record<string, string> = {}) {
  return NextResponse.json(
    { type: `/desarrolladores#error-${code}`, title, status, detail, code, request_id: requestId },
    { status, headers: { ...headers, 'Content-Type': 'application/problem+json' } },
  )
}

function clientIp(request: NextRequest): string | null {
  return request.headers.get('x-nf-client-connection-ip')
    ?? request.headers.get('x-forwarded-for')?.split(',')[0].trim()
    ?? null
}

function hashIp(ip: string | null): string | null {
  if (!ip) return null
  return createHash('sha256').update(`${process.env.API_LOG_SALT ?? 'fp-energia'}:${ip}`).digest('hex').slice(0, 16)
}

function zodDetail(err: ZodError): string {
  return err.issues
    .map(issue => `${issue.path.length ? issue.path.join('.') : 'parámetros'}: ${issue.message}`)
    .join('; ')
}

/** Envuelve un handler de /api/v1 con autenticación, permisos, límite de uso y auditoría. */
export function apiRoute(scope: Scope, handler: (ctx: ApiContext) => Promise<ApiResult>) {
  return async (request: NextRequest, segment: { params: Promise<Record<string, string>> }) => {
    const started = Date.now()
    const requestId = randomUUID()
    const url = new URL(request.url)
    const ip = clientIp(request)
    let clientId: string | null = null
    const headers: Record<string, string> = {
      'X-Request-Id': requestId,
      'X-API-Version': API_VERSION,
      'Cache-Control': 'no-store',
    }

    const finish = (response: NextResponse) => {
      const status = response.status
      after(async () => {
        const { error } = await supabaseAdmin.from('api_request_log').insert({
          client_id: clientId,
          method: request.method,
          path: url.pathname,
          query: url.search ? url.search.slice(0, 500) : null,
          status,
          duration_ms: Date.now() - started,
          ip_hash: hashIp(ip),
          request_id: requestId,
        })
        if (error) console.error('[api/v1] no se pudo registrar la petición:', error.message)
      })
      return response
    }

    try {
      const key = readBearer(request.headers.get('authorization'))
      if (!key) {
        return finish(problem(401, 'llave_requerida', 'Llave requerida',
          'Envíe la llave de API en la cabecera Authorization: Bearer <llave>.', requestId,
          { ...headers, 'WWW-Authenticate': 'Bearer realm="Observatorio Energetico API"' }))
      }
      if (!KEY_PATTERN.test(key)) {
        return finish(problem(401, 'llave_invalida', 'Llave inválida', 'El formato de la llave no es válido.', requestId,
          { ...headers, 'WWW-Authenticate': 'Bearer realm="Observatorio Energetico API", error="invalid_token"' }))
      }

      const { data, error } = await supabaseAdmin.rpc('api_authenticate', { p_key_hash: hashApiKey(key) })
      if (error) throw error
      const auth = (Array.isArray(data) ? data[0] : data) as AuthResult | null
      clientId = auth?.client_id ?? null

      if (auth?.limit_minute != null && auth.used_minute != null) {
        headers['RateLimit-Limit'] = String(auth.limit_minute)
        headers['RateLimit-Remaining'] = String(Math.max(0, auth.limit_minute - auth.used_minute))
        if (auth.reset_minute) {
          headers['RateLimit-Reset'] = String(Math.max(1, Math.ceil((new Date(auth.reset_minute).getTime() - Date.now()) / 1000)))
        }
      }

      const denied = evaluateAccess(auth, scope, ip)
      if (denied) {
        const extra: Record<string, string> = { ...headers }
        if (denied.status === 429) {
          extra['Retry-After'] = auth?.status === 'rate_limited_day'
            ? String(Math.ceil((new Date().setUTCHours(24, 0, 0, 0) - Date.now()) / 1000))
            : headers['RateLimit-Reset'] ?? '60'
        }
        if (denied.status === 401) extra['WWW-Authenticate'] = 'Bearer realm="Observatorio Energetico API", error="invalid_token"'
        return finish(problem(denied.status, denied.code, denied.title, denied.detail, requestId, extra))
      }

      const result = await handler({
        request,
        url,
        params: await segment.params,
        requestId,
        client: { id: auth!.client_id!, name: auth!.client_name ?? '', scopes: auth!.scopes ?? [] },
      })

      return finish(NextResponse.json(
        {
          data: result.data,
          meta: { ...result.meta, api_version: API_VERSION, request_id: requestId, generado: new Date().toISOString() },
        },
        { headers },
      ))
    } catch (err) {
      if (err instanceof ApiError) {
        return finish(problem(err.status, err.code, err.title, err.message, requestId, headers))
      }
      if (err instanceof ZodError) {
        return finish(problem(422, 'parametros_invalidos', 'Parámetros inválidos', zodDetail(err), requestId, headers))
      }
      console.error(`[api/v1] ${url.pathname} (${requestId}):`, err)
      return finish(problem(500, 'error_interno', 'Error interno',
        'Ocurrió un error al procesar la petición. Indique el request_id si reporta el problema.', requestId, headers))
    }
  }
}
