'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'
import ObservatorioHeader from '@/components/observatorio/ObservatorioHeader'
import IndicatorCard from '@/components/observatorio/IndicatorCard'
import CategoryIcon from '@/components/observatorio/CategoryIcon'
import type { IndicatorCategory, IndicatorWithData } from '@/lib/supabase-types'

export default function CategoryPage() {
  const params = useParams()
  const categorySlug = params.category as string

  const [category, setCategory] = useState<IndicatorCategory | null>(null)
  const [indicators, setIndicators] = useState<IndicatorWithData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)

        // Fetch categories to find current category info
        const catRes = await fetch('/api/observatorio/categories?with_indicators=true')
        const catData = await catRes.json()
        const found = (catData.categories || []).find(
          (c: IndicatorCategory & { slug: string }) => c.slug === categorySlug
        )

        if (!found) {
          setError('Categoría no encontrada')
          return
        }

        setCategory(found)

        // Fetch indicators for this category with data
        const indRes = await fetch(
          `/api/observatorio/indicators?category_slug=${categorySlug}&with_data=true&parent_only=true`
        )
        const indData = await indRes.json()
        setIndicators(indData.indicators || [])
      } catch (err) {
        console.error('Error fetching category data:', err)
        setError('Error al cargar los datos')
      } finally {
        setLoading(false)
      }
    }

    if (categorySlug) {
      fetchData()
    }
  }, [categorySlug])

  if (error) {
    return (
      <div className="min-h-screen bg-[#f4f6f4]">
        <ObservatorioHeader
          breadcrumbs={[
            { label: 'Observatorio', href: '/observatorio' },
            { label: 'Error' },
          ]}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-xl font-bold text-[#1c1c1e] mb-2">{error}</h2>
          <p className="text-sm text-[#6b7280]">
            La categoría que busca no existe o ha sido removida.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f4f6f4]">
      <ObservatorioHeader
        breadcrumbs={[
          { label: 'Observatorio', href: '/observatorio' },
          { label: category?.name || categorySlug },
        ]}
        title={category?.name}
        description={category?.description || undefined}
        icon={category?.icon || undefined}
      />

      {/* Category banner */}
      {category && (
        <div
          className="relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${category.color || '#0a2e19'}dd 0%, ${category.color || '#1a6b3c'}aa 100%)`,
          }}
        >
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center text-white/90">
                <CategoryIcon iconName={category.icon} size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {category.name}
                </h2>
                <p className="text-sm text-white/70 mt-1">
                  {indicators.length} indicadores disponibles
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Indicators Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-5 border-[#e5e7eb]">
                <div className="flex items-start justify-between mb-3">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-4 w-20 mb-3" />
                <Skeleton className="h-10 w-full" />
              </Card>
            ))}
          </div>
        ) : indicators.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📭</div>
            <h3 className="text-lg font-bold text-[#1c1c1e] mb-2">
              Sin indicadores disponibles
            </h3>
            <p className="text-sm text-[#6b7280]">
              Esta categoría aún no tiene indicadores registrados.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {indicators.map((indicator, index) => (
              <IndicatorCard
                key={indicator.id}
                indicator={indicator}
                categorySlug={categorySlug}
                index={index}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
