import { NextResponse, type NextRequest } from 'next/server'

/**
 * Protección del backoffice con HTTP Basic Auth.
 *
 * Credenciales en variables de entorno ADMIN_USER y ADMIN_PASSWORD.
 * Si no están configuradas, el acceso a /admin y /api/admin queda bloqueado
 * (falla cerrado). Medida provisional hasta implementar login con Supabase Auth.
 */
export function proxy(request: NextRequest) {
  const user = process.env.ADMIN_USER
  const password = process.env.ADMIN_PASSWORD

  if (!user || !password) {
    return new NextResponse('Backoffice deshabilitado: faltan ADMIN_USER / ADMIN_PASSWORD.', { status: 503 })
  }

  const header = request.headers.get('authorization')
  if (header?.startsWith('Basic ')) {
    const decoded = atob(header.slice(6))
    const separator = decoded.indexOf(':')
    if (
      separator !== -1 &&
      safeEqual(decoded.slice(0, separator), user) &&
      safeEqual(decoded.slice(separator + 1), password)
    ) {
      return NextResponse.next()
    }
  }

  return new NextResponse('Autenticación requerida.', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Backoffice Observatorio", charset="UTF-8"' },
  })
}

/** Comparación en tiempo constante para no filtrar la credencial por tiempos de respuesta. */
function safeEqual(a: string, b: string): boolean {
  let diff = a.length ^ b.length
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0)
  }
  return diff === 0
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
