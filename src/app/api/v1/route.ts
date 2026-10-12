import { NextResponse, type NextRequest } from 'next/server'
import { API_VERSION } from '@/lib/api-v1/version'

export const dynamic = 'force-dynamic'

/** GET /api/v1 — índice público de la API (sin datos). */
export function GET(request: NextRequest) {
  const origin = new URL(request.url).origin
  return NextResponse.json({
    nombre: 'API del Observatorio Energético',
    version: API_VERSION,
    descripcion: 'Datos oficiales del sector eléctrico dominicano (MEM), de solo lectura. Requiere llave: Authorization: Bearer <llave>.',
    documentacion: `${origin}/desarrolladores`,
    openapi: `${origin}/api/v1/openapi.json`,
    endpoints: ['/meta', '/resumen', '/categorias', '/entidades', '/indicadores', '/indicadores/{slug}', '/indicadores/{slug}/serie', '/comparar', '/correcciones']
      .map(p => `${origin}/api/v1${p}`),
  })
}
