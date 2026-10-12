import { ApiError, apiRoute } from '@/lib/api-v1/http'
import { getCatalog, indicatorSummary, sourceMeta } from '@/lib/api-v1/catalog'
import { indicadoresQuery, queryObject } from '@/lib/api-v1/params'

export const dynamic = 'force-dynamic'

const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/**
 * GET /api/v1/indicadores — buscar indicadores por categoría, entidad o texto.
 * La búsqueda de texto sirve para descubrir slugs; los datos se piden siempre por slug exacto.
 */
export const GET = apiRoute('read:catalog', async ({ url, client }) => {
  const q = indicadoresQuery.parse(queryObject(url))
  const cat = await getCatalog()

  const category = q.categoria ? cat.categoryBySlug.get(q.categoria) : null
  if (q.categoria && !category) {
    throw new ApiError(404, 'categoria_no_encontrada', 'Categoría no encontrada', `No existe la categoría "${q.categoria}". Vea GET /api/v1/categorias.`)
  }
  const entity = q.entidad ? cat.entityBySlug.get(q.entidad) : null
  if (q.entidad && !entity) {
    throw new ApiError(404, 'entidad_no_encontrada', 'Entidad no encontrada', `No existe la entidad "${q.entidad}". Vea GET /api/v1/entidades.`)
  }
  const tokens = q.q ? normalize(q.q).split(/\s+/).filter(Boolean) : []

  const matches = cat.indicators.filter(ind => {
    if (category && ind.category_id !== category.id) return false
    if (entity && ind.entity_id !== entity.id) return false
    // Al filtrar por entidad se incluyen sus desgloses (p. ej. "pérdidas de Edesur" es desglose del total)
    if (!q.incluir_desgloses && !entity && ind.is_breakdown) return false
    if (tokens.length) {
      const text = normalize(`${ind.name} ${ind.slug}`)
      if (!tokens.every(t => text.includes(t))) return false
    }
    return true
  })

  const withValues = client.scopes.includes('read:data')
  const start = (q.pagina - 1) * q.limite
  return {
    data: matches.slice(start, start + q.limite).map(ind => indicatorSummary(cat, ind, withValues)),
    meta: {
      ...sourceMeta(cat),
      total: matches.length,
      pagina: q.pagina,
      limite: q.limite,
      paginas: Math.max(1, Math.ceil(matches.length / q.limite)),
    },
  }
})
