import { apiRoute } from '@/lib/api-v1/http'
import { fetchSeries, getCatalog, indicatorSummary, requireIndicator, sourceMeta } from '@/lib/api-v1/catalog'
import { queryObject, serieQuery, slug } from '@/lib/api-v1/params'

export const dynamic = 'force-dynamic'

/**
 * GET /api/v1/indicadores/{slug}/serie?desde=AAAA-MM&hasta=AAAA-MM — serie mensual.
 * Cada punto indica la edición del informe de la que proviene su valor y la celda del Excel.
 * Si hay más puntos que `limite`, se devuelven los más recientes.
 */
export const GET = apiRoute('read:data', async ({ params, url }) => {
  const q = serieQuery.parse(queryObject(url))
  const cat = await getCatalog()
  const ind = requireIndicator(cat, slug.parse(params.slug))
  const all = await fetchSeries(cat, ind, q.desde, q.hasta)
  const puntos = all.length > q.limite ? all.slice(all.length - q.limite) : all

  return {
    data: { indicador: indicatorSummary(cat, ind, false), puntos },
    meta: {
      ...sourceMeta(cat),
      periodicidad: 'mensual',
      total_puntos: all.length,
      devueltos: puntos.length,
      truncado: puntos.length < all.length,
    },
  }
})
