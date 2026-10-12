import { ApiError, apiRoute } from '@/lib/api-v1/http'
import { fetchSeries, getCatalog, indicatorSummary, sourceMeta } from '@/lib/api-v1/catalog'
import { compararQuery, queryObject } from '@/lib/api-v1/params'

export const dynamic = 'force-dynamic'

/**
 * GET /api/v1/comparar?slugs=a,b,c&desde=AAAA-MM&hasta=AAAA-MM — hasta 6 series alineadas por mes.
 * Un mes sin dato para un indicador aparece como null (nunca se interpola).
 */
export const GET = apiRoute('read:data', async ({ url }) => {
  const q = compararQuery.parse(queryObject(url))
  const cat = await getCatalog()
  const missing = q.slugs.filter(s => !cat.bySlug.has(s))
  if (missing.length) {
    throw new ApiError(404, 'indicador_no_encontrado', 'Indicador no encontrado',
      `No existen: ${missing.join(', ')}. Use GET /api/v1/indicadores para buscar los slugs exactos.`)
  }
  const indicators = q.slugs.map(s => cat.bySlug.get(s)!)
  const series = await Promise.all(indicators.map(ind => fetchSeries(cat, ind, q.desde, q.hasta)))

  const periods = [...new Set(series.flatMap(s => s.map(p => p.periodo)))].sort()
  const lookup = series.map(s => new Map(s.map(p => [p.periodo, p.valor])))
  const filas = periods.map(periodo => ({
    periodo,
    valores: Object.fromEntries(indicators.map((ind, i) => [ind.slug, lookup[i].get(periodo) ?? null])),
  }))

  const units = new Set(indicators.map(i => i.unit))
  return {
    data: { indicadores: indicators.map(ind => indicatorSummary(cat, ind, false)), filas },
    meta: {
      ...sourceMeta(cat),
      periodicidad: 'mensual',
      ...(units.size > 1 ? { advertencia: `Las series tienen unidades distintas (${[...units].join(', ')}).` } : {}),
    },
  }
})
