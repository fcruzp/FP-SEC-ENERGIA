import { apiRoute } from '@/lib/api-v1/http'
import { addMonths, currentReport, getCatalog, memSource, toPeriod } from '@/lib/api-v1/catalog'
import { SOURCES } from '@/lib/sources'

export const dynamic = 'force-dynamic'

/** GET /api/v1/meta — fuentes, ediciones cargadas, última actualización y próxima edición esperada. */
export const GET = apiRoute('read:catalog', async ({ client }) => {
  const cat = await getCatalog()
  const current = currentReport(cat)
  const values = [...cat.stats.values()].reduce((sum, s) => sum + Number(s.point_count ?? 0), 0)

  return {
    data: {
      observatorio: 'Observatorio Energético — Secretaría de Energía, Fuerza del Pueblo',
      cliente: client.name,
      fuentes: [
        { codigo: 'MEM', organismo: SOURCES.MEM.institution, publicacion: SOURCES.MEM.publication, pagina: SOURCES.MEM.url, estado: 'activa' },
        { codigo: 'OC', organismo: SOURCES.OC.institution, publicacion: SOURCES.OC.publication, pagina: SOURCES.OC.url, estado: 'en preparación' },
      ],
      edicion_vigente: current ? memSource(current) : null,
      ediciones: [...cat.reports].reverse().map(r => ({
        edicion: toPeriod(r.edition),
        titulo: r.title,
        publicado: r.publish_date,
        excel_url: r.source_url,
        pdf_url: r.pdf_url,
      })),
      calendario: current ? {
        proxima_edicion: toPeriod(addMonths(current.edition, 1)),
        // El MEM publica cada edición unos dos meses después del cierre del mes
        publicacion_estimada: toPeriod(addMonths(current.edition, 4)),
      } : null,
      ultima_actualizacion: cat.lastUpdate,
      totales: {
        indicadores: cat.indicators.length,
        principales: cat.indicators.filter(i => !i.is_breakdown).length,
        desgloses: cat.indicators.filter(i => i.is_breakdown).length,
        valores: values,
        categorias: cat.categories.length,
      },
      periodicidad: 'mensual',
    },
  }
})
