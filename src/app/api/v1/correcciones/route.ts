import { ApiError, apiRoute } from '@/lib/api-v1/http'
import { editionOf, getCatalog, requireIndicator, sourceMeta, toPeriod } from '@/lib/api-v1/catalog'
import { correccionesQuery, queryObject } from '@/lib/api-v1/params'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * GET /api/v1/correcciones?slug=&edicion=AAAA-MM — valores que el MEM cambió de una edición
 * del informe a otra (valor anterior, valor nuevo y ediciones).
 */
export const GET = apiRoute('read:revisions', async ({ url }) => {
  const q = correccionesQuery.parse(queryObject(url))
  const cat = await getCatalog()

  let query = supabase.from('data_point_revisions')
    .select('indicator_id, date, old_value, new_value, old_report_id, new_report_id', { count: 'exact' })
  if (q.slug) query = query.eq('indicator_id', requireIndicator(cat, q.slug).id)
  if (q.edicion) {
    const report = cat.reports.find(r => toPeriod(r.edition) === q.edicion)
    if (!report) throw new ApiError(404, 'edicion_no_encontrada', 'Edición no encontrada', `No hay una edición ${q.edicion} cargada. Vea GET /api/v1/meta.`)
    query = query.eq('new_report_id', report.id)
  }
  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .order('date', { ascending: false })
    .range(0, q.limite - 1)
  if (error) throw error

  return {
    data: (data ?? []).map(r => {
      const ind = cat.byId.get(r.indicator_id)
      return {
        indicador: ind?.slug ?? null,
        nombre: ind?.name ?? null,
        unidad: ind?.unit ?? null,
        periodo: toPeriod(r.date),
        valor_anterior: Number(r.old_value),
        valor_nuevo: Number(r.new_value),
        edicion_anterior: editionOf(cat, r.old_report_id),
        edicion_que_corrige: editionOf(cat, r.new_report_id),
      }
    }),
    meta: {
      ...sourceMeta(cat),
      total: count ?? null,
      limite: q.limite,
      nota: 'Las correcciones las hace el MEM al publicar ediciones nuevas; el Observatorio las registra sin modificarlas.',
    },
  }
})
