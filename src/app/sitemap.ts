import type { MetadataRoute } from 'next'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

const BASE = 'https://energia-fp.netlify.app'
export const revalidate = 3600

/** Portal, páginas del Observatorio, categorías e indicadores principales con datos. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = ['', '/observatorio', '/observatorio/metodologia', '/observatorio/correcciones', '/multimedia']
    .map(path => ({ url: `${BASE}${path}`, changeFrequency: 'monthly', priority: path === '' ? 1 : 0.8 }))
  if (!isSupabaseConfigured) return pages

  const [{ data: categories }, { data: indicators }, { data: stats }] = await Promise.all([
    supabase.from('indicator_categories').select('id, slug'),
    supabase.from('indicators').select('id, slug, category_id').eq('is_active', true).eq('is_breakdown', false).range(0, 4999),
    supabase.from('indicator_stats').select('indicator_id, latest_date').range(0, 4999),
  ])
  const catSlug = new Map((categories ?? []).map(c => [c.id, c.slug]))
  const latest = new Map((stats ?? []).map(s => [s.indicator_id, s.latest_date as string]))
  const withData = (indicators ?? []).filter(i => latest.has(i.id))
  const usedCategories = new Set(withData.map(i => i.category_id))

  return [
    ...pages,
    ...[...usedCategories].map(id => ({ url: `${BASE}/observatorio/${catSlug.get(id)}`, changeFrequency: 'monthly' as const, priority: 0.7 })),
    ...withData.map(i => ({
      url: `${BASE}/observatorio/${catSlug.get(i.category_id)}/${i.slug}`,
      lastModified: latest.get(i.id),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ]
}
