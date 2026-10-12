import { apiRoute } from '@/lib/api-v1/http'
import { getCatalog, indicatorDetail, requireIndicator, sourceMeta } from '@/lib/api-v1/catalog'
import { slug } from '@/lib/api-v1/params'

export const dynamic = 'force-dynamic'

/**
 * GET /api/v1/indicadores/{slug} — ficha del indicador: definición, fórmula, fuente primaria,
 * desgloses, cobertura y (con permiso read:data) último valor y variaciones.
 */
export const GET = apiRoute('read:catalog', async ({ params, client }) => {
  const cat = await getCatalog()
  const ind = requireIndicator(cat, slug.parse(params.slug))
  return { data: indicatorDetail(cat, ind, client.scopes.includes('read:data')), meta: sourceMeta(cat) }
})
