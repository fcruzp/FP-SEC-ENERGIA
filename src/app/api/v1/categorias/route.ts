import { apiRoute } from '@/lib/api-v1/http'
import { getCatalog, sourceMeta } from '@/lib/api-v1/catalog'

export const dynamic = 'force-dynamic'

/** GET /api/v1/categorias — categorías de indicadores con su cantidad. */
export const GET = apiRoute('read:catalog', async () => {
  const cat = await getCatalog()
  const counts = new Map<string, { principales: number; desgloses: number }>()
  for (const ind of cat.indicators) {
    const c = counts.get(ind.category_id) ?? { principales: 0, desgloses: 0 }
    if (ind.is_breakdown) c.desgloses++
    else c.principales++
    counts.set(ind.category_id, c)
  }
  return {
    data: cat.categories
      .filter(c => counts.has(c.id))
      .map(c => ({
        slug: c.slug,
        nombre: c.name,
        descripcion: c.description,
        indicadores: counts.get(c.id)!.principales,
        desgloses: counts.get(c.id)!.desgloses,
      })),
    meta: sourceMeta(cat),
  }
})
