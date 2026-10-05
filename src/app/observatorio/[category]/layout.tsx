import type { Metadata } from 'next'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export const revalidate = 3600

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params
  if (!isSupabaseConfigured) return { title: 'Observatorio Energético' }
  const { data } = await supabase.from('indicator_categories').select('name, description').eq('slug', category).maybeSingle()
  if (!data) return { title: 'Observatorio Energético' }
  const description = data.description ?? `Indicadores de ${data.name} con datos oficiales del Ministerio de Energía y Minas.`
  return {
    title: `${data.name} · Observatorio Energético`,
    description,
    alternates: { canonical: `/observatorio/${category}` },
    openGraph: { title: data.name, description },
  }
}

export default function CategoryLayout({ children }: { children: React.ReactNode }) {
  return children
}
