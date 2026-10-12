import { NextResponse, type NextRequest } from 'next/server'
import { buildOpenApi } from '@/lib/api-v1/openapi'

export const dynamic = 'force-dynamic'

/** GET /api/v1/openapi.json — contrato OpenAPI 3.1 (público: describe la API, no contiene datos). */
export function GET(request: NextRequest) {
  return NextResponse.json(buildOpenApi(new URL(request.url).origin), {
    headers: { 'Cache-Control': 'public, max-age=300' },
  })
}
