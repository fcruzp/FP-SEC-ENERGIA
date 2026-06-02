import { NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * GET /api/observatorio/summary
 * Returns aggregate stats for the observatorio hero banner:
 *   - total_indicators: count of active non-breakdown indicators
 *   - total_data_points: count of all data points
 *   - latest_period: the most recent observation date (month/year)
 *   - last_upload_at: when the most recent data point was inserted into the DB
 *   - data_sources: list of distinct source_file values
 */
export async function GET() {
  try {
    if (!isSupabaseConfigured) {
      return NextResponse.json({ total_indicators: 0, total_data_points: 0, total_categories: 0, latest_period: null, last_upload_at: null, data_sources: [] })
    }

    // 1. Count active parent indicators
    const { count: totalIndicators, error: indError } = await supabase
      .from('indicators')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .eq('is_breakdown', false)

    if (indError) {
      console.error('Error counting indicators:', indError)
    }

    // 2. Count total data points
    const { count: totalDataPoints, error: dpCountError } = await supabase
      .from('data_points')
      .select('*', { count: 'exact', head: true })

    if (dpCountError) {
      console.error('Error counting data points:', dpCountError)
    }

    // 3. Get latest observation period and last upload time
    const { data: latestDp, error: latestError } = await supabase
      .from('data_points')
      .select('date, created_at')
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (latestError) {
      console.error('Error fetching latest data point:', latestError)
    }

    // 4. Get the most recent upload (created_at) across all data points
    const { data: latestUpload, error: uploadError } = await supabase
      .from('data_points')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (uploadError) {
      console.error('Error fetching latest upload:', uploadError)
    }

    // 5. Get distinct source files (data sources)
    const { data: sources, error: srcError } = await supabase
      .from('data_points')
      .select('source_file')
      .not('source_file', 'is', null)

    if (srcError) {
      console.error('Error fetching sources:', srcError)
    }

    // Deduplicate sources
    const uniqueSources = [...new Set((sources || []).map(s => s.source_file).filter(Boolean))]

    // 6. Count categories
    const { count: totalCategories, error: catError } = await supabase
      .from('indicator_categories')
      .select('*', { count: 'exact', head: true })

    if (catError) {
      console.error('Error counting categories:', catError)
    }

    return NextResponse.json({
      total_indicators: totalIndicators || 0,
      total_data_points: totalDataPoints || 0,
      total_categories: totalCategories || 0,
      latest_period: latestDp?.date || null,
      last_upload_at: latestUpload?.created_at || null,
      data_sources: uniqueSources,
    })
  } catch (err) {
    console.error('Unexpected error in GET /api/observatorio/summary:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
