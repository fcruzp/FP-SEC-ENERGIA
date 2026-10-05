import { NextRequest, NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { getDefinition } from '@/lib/mem/definitions'

export const dynamic = 'force-dynamic'

/**
 * GET /api/observatorio/indicator-detail?slug=...
 * Ficha técnica de un indicador: definición y fórmula, procedencia del último dato
 * (edición, archivo, hoja y celda), notas metodológicas y correcciones del MEM.
 */
export async function GET(request: NextRequest) {
  const slug = new URL(request.url).searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: 'Parámetro requerido: slug' }, { status: 400 })
  if (!isSupabaseConfigured) return NextResponse.json({ error: 'Base de datos no configurada' }, { status: 503 })

  try {
    const { data: indicator, error } = await supabase
      .from('indicators')
      .select('id, slug, name, unit, source, notes, source_sheet, source_label, frequency')
      .eq('slug', slug)
      .maybeSingle()
    if (error) throw error
    if (!indicator) return NextResponse.json({ error: `Indicador no encontrado: ${slug}` }, { status: 404 })

    const [latestRes, firstRes, revisionsRes, reportsRes, runRes] = await Promise.all([
      supabase.from('data_points').select('date, value, source_cell, report_id')
        .eq('indicator_id', indicator.id).order('date', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('data_points').select('date')
        .eq('indicator_id', indicator.id).order('date', { ascending: true }).limit(1).maybeSingle(),
      supabase.from('data_point_revisions').select('date, old_value, new_value, old_report_id, new_report_id, created_at')
        .eq('indicator_id', indicator.id).order('date', { ascending: false }).range(0, 999),
      supabase.from('reports').select('id, title, edition, source_url, pdf_url, publish_date')
        .eq('source_org', 'MEM').order('edition', { ascending: false }),
      supabase.from('ingestion_runs').select('finished_at')
        .eq('status', 'success').order('finished_at', { ascending: false }).limit(1).maybeSingle(),
    ])

    const reports = new Map((reportsRes.data ?? []).map(r => [r.id, r]))
    const editionOf = (id: string | null) => {
      const r = id ? reports.get(id) : null
      return r ? { title: r.title, edition: r.edition, source_url: r.source_url, pdf_url: r.pdf_url } : null
    }
    const latest = latestRes.data
    const latestReport = (reportsRes.data ?? [])[0] ?? null

    return NextResponse.json({
      indicator: {
        slug: indicator.slug,
        name: indicator.name,
        unit: indicator.unit,
        notes: indicator.notes,
        source_sheet: indicator.source_sheet,
        source_label: indicator.source_label,
      },
      definition: getDefinition(indicator.slug),
      coverage: { first_date: firstRes.data?.date ?? null, last_date: latest?.date ?? null },
      latest_point: latest
        ? { date: latest.date, value: Number(latest.value), source_cell: latest.source_cell, first_published_in: editionOf(latest.report_id) }
        : null,
      // Edición vigente del informe (la más reciente cargada)
      current_edition: latestReport ? editionOf(latestReport.id) : null,
      last_update: runRes.data?.finished_at ?? null,
      revisions: (revisionsRes.data ?? []).map(r => ({
        date: r.date,
        old_value: Number(r.old_value),
        new_value: Number(r.new_value),
        from_edition: editionOf(r.old_report_id),
        to_edition: editionOf(r.new_report_id),
      })),
    })
  } catch (err) {
    console.error('Error in indicator-detail API:', err)
    return NextResponse.json({ error: 'Error al obtener la ficha del indicador' }, { status: 500 })
  }
}
