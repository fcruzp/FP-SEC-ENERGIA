import { apiRoute } from '@/lib/api-v1/http'
import { getCatalog, sourceMeta } from '@/lib/api-v1/catalog'

export const dynamic = 'force-dynamic'

const TYPES: Record<string, string> = {
  distribuidora: 'Empresa distribuidora',
  generadora: 'Generadora estatal',
  transmisora: 'Transmisora',
  comercializadora: 'Comercializadora / holding estatal',
  generadora_privada: 'Generadora privada',
  regulador: 'Regulador',
  mercado: 'Mercado',
  consumidor: 'Consumidores',
  agrupacion: 'Agrupación',
}

/** GET /api/v1/entidades — empresas y agrupaciones a las que pertenecen los indicadores. */
export const GET = apiRoute('read:catalog', async () => {
  const cat = await getCatalog()
  const counts = new Map<string, number>()
  for (const ind of cat.indicators) if (ind.entity_id) counts.set(ind.entity_id, (counts.get(ind.entity_id) ?? 0) + 1)
  return {
    data: cat.entities
      .filter(e => counts.has(e.id))
      .map(e => ({ slug: e.slug, nombre: e.name, tipo: e.type, tipo_nombre: TYPES[e.type] ?? e.type, indicadores: counts.get(e.id) })),
    meta: sourceMeta(cat),
  }
})
