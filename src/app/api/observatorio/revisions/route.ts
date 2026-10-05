import { NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * GET /api/observatorio/revisions
 * Registro público de correcciones: valores que el MEM cambió de una edición
 * del informe a la siguiente, agrupados por la edición que los corrigió.
 */
export async function GET() {
  if (!isSupabaseConfigured) return NextResponse.json({ editions: [], total: 0 })
  try {
    const [revRes, indRes, repRes] = await Promise.all([
      supabase.from('data_point_revisions')
        .select('indicator_id, date, old_value, new_value, old_report_id, new_report_id')
        .order('date', { ascending: false }).range(0, 9999),
      supabase.from('indicators')
        .select('id, slug, name, unit, is_breakdown, category:indicator_categories(slug, name)')
        .range(0, 4999),
      supabase.from('reports').select('id, title, edition, source_url, pdf_url').eq('source_org', 'MEM'),
    ])
    if (revRes.error) throw revRes.error

    const indicators = new Map((indRes.data ?? []).map(i => [i.id, i]))
    const reports = new Map((repRes.data ?? []).map(r => [r.id, r]))
    type Item = {
      indicator: { slug: string; name: string; unit: string; is_breakdown: boolean; category_slug: string | null; category_name: string | null }
      date: string
      old_value: number
      new_value: number
      previous_edition: string | null
    }
    const byEdition = new Map<string, { edition: string; title: string; source_url: string | null; pdf_url: string | null; items: Item[] }>()

    for (const r of revRes.data ?? []) {
      const ind = indicators.get(r.indicator_id)
      const rep = reports.get(r.new_report_id)
      if (!ind || !rep) continue
      const category = Array.isArray(ind.category) ? ind.category[0] : ind.category
      if (!byEdition.has(rep.id)) {
        byEdition.set(rep.id, { edition: rep.edition, title: rep.title, source_url: rep.source_url, pdf_url: rep.pdf_url, items: [] })
      }
      byEdition.get(rep.id)!.items.push({
        indicator: {
          slug: ind.slug, name: ind.name, unit: ind.unit, is_breakdown: ind.is_breakdown,
          category_slug: category?.slug ?? null, category_name: category?.name ?? null,
        },
        date: r.date,
        old_value: Number(r.old_value),
        new_value: Number(r.new_value),
        previous_edition: r.old_report_id ? reports.get(r.old_report_id)?.edition ?? null : null,
      })
    }

    const editions = [...byEdition.values()]
      .sort((a, b) => b.edition.localeCompare(a.edition))
      .map(e => ({ ...e, items: e.items.sort((a, b) => a.indicator.name.localeCompare(b.indicator.name) || b.date.localeCompare(a.date)) }))
    return NextResponse.json({ editions, total: editions.reduce((s, e) => s + e.items.length, 0) })
  } catch (err) {
    console.error('Error in revisions API:', err)
    return NextResponse.json({ error: 'Error al obtener las correcciones' }, { status: 500 })
  }
}
