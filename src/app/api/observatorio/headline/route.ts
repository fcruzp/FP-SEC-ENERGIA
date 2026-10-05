import { NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/** Indicadores clave de la portada. Todos provienen del MEM. */
const HEADLINE = [
  { key: 'perdidas', slug: 'perdidas-ano-movil-porcentaje', label: 'Pérdidas EDEs (año móvil)' },
  { key: 'cri', slug: 'cri-ano-movil-porcentaje', label: 'CRI EDEs (año móvil)' },
  { key: 'cobranzas', slug: 'cobranzas-ano-movil-porcentaje', label: 'Cobranza EDEs (año móvil)' },
] as const

/** Participación renovable = hidráulica + renovable no convencional (eólica, solar, biomasa). */
const RENEWABLE_SLUGS = ['composicion-hidraulica-pp', 'composicion-total-renovable-no-convencional-pp']

/** Generación por tipo de combustible (GWh). */
const GENERATION = [
  { slug: 'generacion-gas-natural', label: 'Gas natural', renewable: false },
  { slug: 'generacion-carbon-mineral', label: 'Carbón', renewable: false },
  { slug: 'generacion-fuel-oil-6', label: 'Fuel oil', renewable: false },
  { slug: 'generacion-solar-fv', label: 'Solar', renewable: true },
  { slug: 'generacion-hidraulica', label: 'Hidráulica', renewable: true },
  { slug: 'generacion-eolica', label: 'Eólica', renewable: true },
  { slug: 'generacion-biomasa', label: 'Biomasa', renewable: true },
] as const

interface Point { value: number; date: string; source_file: string | null }

interface HeadlineStat {
  key: string
  label: string
  value: number
  unit: string
  date: string
  /** Valor del mismo mes del año anterior, para la variación interanual */
  previous_year_value: number | null
}

/**
 * GET /api/observatorio/headline
 * Datos reales para la portada: indicadores clave con variación interanual,
 * y generación por fuente de los últimos 12 meses. Incluye la fecha y el
 * archivo de origen para citar la fuente.
 */
export async function GET() {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ stats: [], generation: null, source_file: null })
  }

  try {
    const slugs = [...HEADLINE.map(h => h.slug), ...RENEWABLE_SLUGS, ...GENERATION.map(g => g.slug)]
    const { data: indicators, error: indError } = await supabase
      .from('indicators')
      .select('id, slug')
      .in('slug', slugs)
    if (indError) throw indError

    const idBySlug = new Map((indicators ?? []).map(i => [i.slug, i.id]))

    // Últimos 13 meses de cada indicador (una consulta por indicador: evita el tope de filas)
    const series = new Map<string, Point[]>()
    await Promise.all(slugs.map(async (slug) => {
      const id = idBySlug.get(slug)
      if (!id) return
      const { data } = await supabase
        .from('data_points')
        .select('value, date, source_file')
        .eq('indicator_id', id)
        .eq('period_type', 'monthly')
        .order('date', { ascending: false })
        .limit(13)
      if (data?.length) series.set(slug, data)
    }))

    const sameMonthLastYear = (points: Point[]) => {
      const [latest] = points
      const target = `${Number(latest.date.slice(0, 4)) - 1}${latest.date.slice(4)}`
      return points.find(p => p.date === target)?.value ?? null
    }

    const stats: HeadlineStat[] = []
    for (const h of HEADLINE) {
      const points = series.get(h.slug)
      if (!points) continue
      stats.push({
        key: h.key,
        label: h.label,
        value: points[0].value,
        unit: '%',
        date: points[0].date,
        previous_year_value: sameMonthLastYear(points),
      })
    }

    // Renovables: solo si ambos componentes son del mismo mes
    const hydro = series.get(RENEWABLE_SLUGS[0])
    const nonConventional = series.get(RENEWABLE_SLUGS[1])
    if (hydro && nonConventional && hydro[0].date === nonConventional[0].date) {
      const prevHydro = sameMonthLastYear(hydro)
      const prevNonConventional = sameMonthLastYear(nonConventional)
      stats.push({
        key: 'renovable',
        label: 'Generación renovable',
        value: hydro[0].value + nonConventional[0].value,
        unit: '%',
        date: hydro[0].date,
        previous_year_value:
          prevHydro !== null && prevNonConventional !== null ? prevHydro + prevNonConventional : null,
      })
    }

    // Generación de los últimos 12 meses, solo si todas las fuentes cubren los mismos meses
    let generation: { from: string; to: string; sources: { label: string; gwh: number; renewable: boolean }[] } | null = null
    const genSeries = GENERATION.map(g => ({ ...g, points: (series.get(g.slug) ?? []).slice(0, 12) }))
    const to = genSeries[0]?.points[0]?.date
    const from = genSeries[0]?.points[11]?.date
    if (to && from && genSeries.every(g => g.points.length === 12 && g.points[0].date === to && g.points[11].date === from)) {
      generation = {
        from,
        to,
        sources: genSeries
          .map(g => ({ label: g.label, renewable: g.renewable, gwh: g.points.reduce((sum, p) => sum + p.value, 0) }))
          .sort((a, b) => b.gwh - a.gwh),
      }
    }

    const sourceFile = series.get(HEADLINE[0].slug)?.[0]?.source_file ?? null
    return NextResponse.json({ stats, generation, source_file: sourceFile })
  } catch (error) {
    console.error('Error in headline API:', error)
    return NextResponse.json({ stats: [], generation: null, source_file: null }, { status: 500 })
  }
}
