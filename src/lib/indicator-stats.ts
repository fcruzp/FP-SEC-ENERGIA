import { supabase } from '@/lib/supabase'

export interface IndicatorStats {
  indicator_id: string
  latest_date: string | null
  latest_value: number | null
  previous_date: string | null
  previous_value: number | null
  year_ago_value: number | null
  first_date: string | null
  point_count: number
  sparkline: { date: string; value: number }[] | null
}

/**
 * Resumen por indicador desde la vista materializada `indicator_stats`
 * (último valor, anterior, hace 12 meses y sparkline). Una fila por indicador,
 * así que no la afecta el tope de filas de la API.
 */
export async function fetchIndicatorStats(): Promise<Map<string, IndicatorStats>> {
  const { data, error } = await supabase.from('indicator_stats').select('*').range(0, 4999)
  if (error) throw error
  return new Map((data ?? []).map(row => [row.indicator_id, row as IndicatorStats]))
}

/** Campos de valor y variación que la web agrega a cada indicador. */
export function enrichWithStats<T extends { id: string }>(indicator: T, stats: IndicatorStats | undefined) {
  const latest = stats?.latest_value ?? null
  const previous = stats?.previous_value ?? null
  const yearAgo = stats?.year_ago_value ?? null
  return {
    ...indicator,
    latest_value: latest,
    latest_date: stats?.latest_date ?? null,
    previous_value: previous,
    change: latest !== null && previous !== null ? latest - previous : null,
    change_pct: latest !== null && previous !== null && previous !== 0
      ? ((latest - previous) / Math.abs(previous)) * 100
      : null,
    year_ago_value: yearAgo,
    yoy_change: latest !== null && yearAgo !== null ? latest - yearAgo : null,
    yoy_change_pct: latest !== null && yearAgo !== null && yearAgo !== 0
      ? ((latest - yearAgo) / Math.abs(yearAgo)) * 100
      : null,
    point_count: stats?.point_count ?? 0,
    sparkline_data: stats?.sparkline ?? [],
  }
}
