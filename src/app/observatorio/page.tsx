'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { BarChart3, Activity, Database, Calendar, ArrowRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import KPICard from '@/components/observatorio/KPICard'
import ObservatorioHeader from '@/components/observatorio/ObservatorioHeader'
import CategoryIcon from '@/components/observatorio/CategoryIcon'
import type { CategoryWithIndicators, IndicatorWithData } from '@/lib/supabase-types'

interface CategoryStats {
  totalIndicators: number
  totalDataPoints: number
  dateRange: { min: string; max: string } | null
}

export default function ObservatorioPage() {
  const [categories, setCategories] = useState<CategoryWithIndicators[]>([])
  const [topIndicators, setTopIndicators] = useState<IndicatorWithData[]>([])
  const [stats, setStats] = useState<CategoryStats>({
    totalIndicators: 0,
    totalDataPoints: 0,
    dateRange: null,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch categories
        const catRes = await fetch('/api/observatorio/categories')
        const catData = await catRes.json()
        setCategories(catData.categories || [])

        // Fetch indicators with data for KPI display
        const indRes = await fetch('/api/observatorio/indicators?with_data=true&parent_only=true')
        const indData = await indRes.json()
        const allIndicators: IndicatorWithData[] = indData.indicators || []

        // Pick top indicators for KPI cards (those with data)
        const withData = allIndicators.filter(
          (ind) => ind.latest_value !== null && ind.latest_value !== undefined
        )
        setTopIndicators(withData.slice(0, 6))

        // Calculate stats
        const totalIndicators = allIndicators.length
        let totalDataPoints = 0
        let minDate: string | null = null
        let maxDate: string | null = null

        for (const ind of allIndicators) {
          if (ind.data_points) {
            totalDataPoints += ind.data_points.length
          }
          if (ind.latest_date) {
            if (!maxDate || ind.latest_date > maxDate) maxDate = ind.latest_date
            if (!minDate || ind.latest_date < minDate) minDate = ind.latest_date
          }
        }

        setStats({
          totalIndicators,
          totalDataPoints,
          dateRange:
            minDate && maxDate ? { min: minDate, max: maxDate } : null,
        })
      } catch (err) {
        console.error('Error fetching observatorio data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('es-DO', {
        year: 'numeric',
        month: 'long',
      })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f6f4]">
      {/* Header */}
      <ObservatorioHeader
        breadcrumbs={[{ label: 'Observatorio Energético' }]}
      />

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[#0a2e19] via-[#0f4526] to-[#1a6b3c] relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#4ade80] rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#2d9e5f] rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-[#4ade80]" />
              </div>
              <Badge className="bg-[#4ade80]/15 text-[#4ade80] border-0 text-[10px] font-semibold uppercase tracking-wider">
                Panel de Datos en Tiempo Real
              </Badge>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
              Observatorio{' '}
              <span className="text-[#4ade80]">Energético</span>
            </h1>

            <p className="text-sm text-white/70 max-w-2xl leading-relaxed mb-5">
              Monitoreo continuo de los indicadores clave del sector eléctrico
              dominicano. Datos actualizados, visualizaciones interactivas y
              análisis del mercado energético.
            </p>

            {/* Stats row */}
            <div className="flex flex-wrap gap-5 sm:gap-8">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <Activity className="h-3.5 w-3.5 text-[#4ade80]" />
                </div>
                <div>
                  <div className="text-lg font-extrabold text-[#4ade80]">
                    {loading ? (
                      <Skeleton className="h-5 w-10 bg-white/20" />
                    ) : (
                      stats.totalIndicators
                    )}
                  </div>
                  <div className="text-[10px] text-white/50 font-medium">
                    Indicadores
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <Database className="h-3.5 w-3.5 text-[#4ade80]" />
                </div>
                <div>
                  <div className="text-lg font-extrabold text-[#4ade80]">
                    {loading ? (
                      <Skeleton className="h-5 w-14 bg-white/20" />
                    ) : (
                      stats.totalDataPoints.toLocaleString('es-DO')
                    )}
                  </div>
                  <div className="text-[10px] text-white/50 font-medium">
                    Puntos de Datos
                  </div>
                </div>
              </div>

              {stats.dateRange && (
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                    <Calendar className="h-3.5 w-3.5 text-[#4ade80]" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">
                      {formatDate(stats.dateRange.min)} — {formatDate(stats.dateRange.max)}
                    </div>
                    <div className="text-[10px] text-white/50 font-medium">
                      Período Cubierto
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Top KPI Section */}
        {topIndicators.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 rounded-full bg-[#1a6b3c]" />
              <h2 className="text-lg font-bold text-[#1c1c1e]">
                Indicadores Destacados
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="p-5 border-[#e5e7eb]">
                      <Skeleton className="h-10 w-10 rounded-xl mb-4" />
                      <Skeleton className="h-8 w-24 mb-2" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-1 w-full mt-4 rounded-full" />
                    </Card>
                  ))
                : topIndicators.map((ind, i) => (
                    <KPICard
                      key={ind.id}
                      title={ind.name}
                      value={ind.latest_value}
                      unit={ind.unit}
                      change={ind.change}
                      changePct={ind.change_pct}
                      icon={ind.category?.icon || '📊'}
                      featured={i === 1}
                      index={i}
                    />
                  ))}
            </div>
          </section>
        )}

        {/* Categories Section */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-6 rounded-full bg-[#1a6b3c]" />
            <h2 className="text-lg font-bold text-[#1c1c1e]">
              Categorías de Indicadores
            </h2>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="p-6 border-[#e5e7eb]">
                  <Skeleton className="h-12 w-12 rounded-xl mb-4" />
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-3" />
                  <Skeleton className="h-4 w-full" />
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((cat, index) => (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: index * 0.06 }}
                >
                  <Link href={`/observatorio/${cat.slug}`}>
                    <Card className="group relative overflow-hidden border-[#e5e7eb] bg-white hover:border-[#2d9e5f] hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 cursor-pointer h-full">
                      {/* Green accent line */}
                      <div
                        className="absolute top-0 left-0 right-0 h-0.5 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"
                        style={{ backgroundColor: cat.color || '#1a6b3c' }}
                      />

                      <div className="p-6">
                        {/* Icon + Count */}
                        <div className="flex items-start justify-between mb-4">
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center"
                            style={{
                              backgroundColor: cat.color
                                ? `${cat.color}18`
                                : '#1a6b3c18',
                              color: cat.color || '#1a6b3c',
                            }}
                          >
                            <CategoryIcon iconName={cat.icon} size={24} />
                          </div>
                          <Badge
                            variant="secondary"
                            className="bg-[#f4f6f4] text-[#1a6b3c] border-0 font-semibold text-xs"
                          >
                            {cat.indicator_count} indicadores
                          </Badge>
                        </div>

                        {/* Name */}
                        <h3 className="text-base font-bold text-[#1c1c1e] mb-2 group-hover:text-[#1a6b3c] transition-colors">
                          {cat.name}
                        </h3>

                        {/* Description */}
                        {cat.description && (
                          <p className="text-sm text-[#6b7280] leading-relaxed line-clamp-2 mb-4">
                            {cat.description}
                          </p>
                        )}

                        {/* Explore link */}
                        <div className="flex items-center gap-1.5 text-sm font-semibold text-[#2d9e5f] opacity-0 group-hover:opacity-100 transition-all duration-200">
                          <span>Explorar</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </div>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* Footer info */}
        <div className="mt-16 pt-8 border-t border-[#e5e7eb]">
          <p className="text-sm text-[#6b7280] text-center">
            Datos proporcionados por la Secretaría de Energía de Fuerza del Pueblo
          </p>
        </div>
      </div>
    </div>
  )
}
