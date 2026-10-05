import type { Metadata } from 'next'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { getDefinition } from '@/lib/mem/definitions'

export const revalidate = 3600

/** Título y descripción propios de cada indicador (buscadores y vistas previas al compartir). */
export async function generateMetadata({ params }: { params: Promise<{ category: string; indicator: string }> }): Promise<Metadata> {
  const { category, indicator: slug } = await params
  const fallback: Metadata = { title: 'Indicador · Observatorio Energético' }
  if (!isSupabaseConfigured) return fallback
  const { data } = await supabase.from('indicators').select('name, unit').eq('slug', slug).maybeSingle()
  if (!data) return fallback
  const definition = getDefinition(slug)?.definition
  const description = `${data.name} (${data.unit}). ${definition ?? ''} Serie mensual con datos oficiales del Ministerio de Energía y Minas.`.trim()
  return {
    title: `${data.name} · Observatorio Energético`,
    description,
    alternates: { canonical: `/observatorio/${category}/${slug}` },
    openGraph: { title: data.name, description, type: 'article' },
  }
}

export default function IndicatorLayout({ children }: { children: React.ReactNode }) {
  return children
}
