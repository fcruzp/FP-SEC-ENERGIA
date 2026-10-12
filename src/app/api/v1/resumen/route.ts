import { apiRoute } from '@/lib/api-v1/http'
import { getCatalog, indicatorDetail, indicatorValues, sourceMeta, toPeriod } from '@/lib/api-v1/catalog'

export const dynamic = 'force-dynamic'

/** Indicadores clave del panorama del sector, en orden. */
const KEY_SLUGS = [
  'generacion-total',
  'costo-marginal-de-energia',
  'participacion-hidraulica-en-la-generacion',
  'participacion-total-renovable-no-convencional-en-la-generacion',
  'edes-compra-de-energia',
  'edes-perdidas-ano-movil',
  'edes-cobranzas-ano-movil',
  'edes-cri-ano-movil',
  'edes-precio-medio-de-compra-de-energia',
  'edes-precio-medio-de-venta-de-energia-cus-kwh',
  'edes-cantidad-de-clientes-facturados',
  'rf-edes-balance-luego-de-financiamiento',
  'deuda-edes-corriente',
  'precio-gas-natural',
  'precio-fuel-oil-6-us-bbl',
  'tasa-de-cambio',
]
/** Con más desgloses que esto (p. ej. 48 generadoras) se remite a la ficha del indicador */
const MAX_BREAKDOWNS = 6

/** GET /api/v1/resumen — panorama del sector eléctrico en una llamada. */
export const GET = apiRoute('read:data', async () => {
  const cat = await getCatalog()
  const items = KEY_SLUGS.map(s => cat.bySlug.get(s)).filter(i => i !== undefined)

  const indicadores = items.map(ind => {
    const d = indicatorDetail(cat, ind, false)
    const children = cat.children.get(ind.id) ?? []
    return {
      slug: d.slug,
      nombre: d.nombre,
      unidad: d.unidad,
      categoria: d.categoria,
      entidad: d.entidad,
      definicion: d.definicion,
      ...(indicatorValues(cat, ind) ?? { ultimo: null }),
      desgloses: children.length <= MAX_BREAKDOWNS
        ? children.map(child => {
          const s = cat.stats.get(child.id)
          return {
            slug: child.slug,
            nombre: child.name,
            entidad: child.entity_id ? cat.entityById.get(child.entity_id)?.slug ?? null : null,
            ultimo: s?.latest_date && s.latest_value !== null ? { periodo: toPeriod(s.latest_date), valor: s.latest_value } : null,
          }
        })
        : { cantidad: children.length, detalle: `GET /api/v1/indicadores/${ind.slug}` },
    }
  })

  const periodo = indicadores.reduce<string | null>((max, i) => {
    const p = i.ultimo?.periodo ?? null
    return p && (!max || p > max) ? p : max
  }, null)

  return { data: { periodo_vigente: periodo, indicadores }, meta: sourceMeta(cat) }
})
