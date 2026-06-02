'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { BarChart3, Activity, Database, Calendar, ArrowRight, Info, Zap, Layers, TrendingUp } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import KPICard from '@/components/observatorio/KPICard'
import ObservatorioHeader from '@/components/observatorio/ObservatorioHeader'
import DashboardOverviewChart from '@/components/observatorio/DashboardOverviewChart'
import TrendMovers from '@/components/observatorio/TrendMovers'
import CategoryIcon from '@/components/observatorio/CategoryIcon'

interface ObservatorioStats {
  total_indicators: number
  total_data_points: number
  total_categories: number
  latest_period: string | null
  last_upload_at: string | null
  data_sources: string[]
}

interface TopIndicator {
  id: string
  name: string
  slug: string
  unit?: string
  description?: string | null
  latest_value: number | null
  latest_date?: string
  change?: number | null
  change_pct?: number | null
  icon?: string
  category?: { id: string; name: string; slug: string; color?: string; icon?: string }
  sparkline_data: { date: string; value: number }[]
}

interface FeaturedIndicator {
  id: string
  name: string
  slug: string
  unit?: string
  description?: string
  latest_value: number | null
  latest_date?: string
  change_pct?: number | null
  change?: number | null
  category_slug?: string
  category?: { name?: string; color?: string; slug?: string }
  time_series: { date: string; value: number }[]
}

interface TrendItem {
  id: string
  name: string
  slug: string
  change_pct: number | null
  latest_value: number | null
  unit?: string
  category_slug?: string
  category_name?: string
  category_color?: string
}

interface CategoryData {
  id: string
  name: string
  slug: string
  description?: string | null
  icon?: string
  color?: string
  indicator_count: number
}

export default function ObservatorioPage() {
  const [stats, setStats] = useState<ObservatorioStats>({
    total_indicators: 0,
    total_data_points: 0,
    total_categories: 0,
    latest_period: null,
    last_upload_at: null,
    data_sources: [],
  })
  const [topIndicators, setTopIndicators] = useState<TopIndicator[]>([])
  const [featuredIndicator, setFeaturedIndicator] = useState<FeaturedIndicator | null>(null)
  const [trendMovers, setTrendMovers] = useState<{ gainers: TrendItem[]; losers: TrendItem[] }>({ gainers: [], losers: [] })
  const [categories, setCategories] = useState<CategoryData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDashboard() {
      try {
        // Try the unified dashboard API first
        const res = await fetch('/api/observatorio/dashboard')
        if (res.ok) {
          const data = await res.json()
          if (!data.error) {
            setStats(data.summary)
            setTopIndicators(data.top_indicators || [])
            setFeaturedIndicator(data.featured_indicator || null)
            setTrendMovers(data.trend_movers || { gainers: [], losers: [] })
            setCategories(data.categories || [])
            return
          }
        }
        // Fallback: use separate API endpoints if dashboard fails
        await fetchFromSeparateEndpoints()
      } catch {
        // JSON parse error or network issue — fallback
        await fetchFromSeparateEndpoints()
      } finally {
        setLoading(false)
      }
    }

    async function fetchFromSeparateEndpoints() {
      try {
        // Fetch summary
        const sumRes = await fetch('/api/observatorio/summary')
        if (sumRes.ok) {
          const sumData = await sumRes.json()
          if (!sumData.error) setStats(sumData)
        }

        // Fetch categories
        const catRes = await fetch('/api/observatorio/categories')
        if (catRes.ok) {
          const catData = await catRes.json()
          setCategories(catData.categories || [])
        }

        // Fetch indicators with data for KPI display
        const indRes = await fetch('/api/observatorio/indicators?with_data=true&parent_only=true')
        if (indRes.ok) {
          const indData = await indRes.json()
          const allIndicators = indData.indicators || []
          const withData = allIndicators.filter(
            (ind: TopIndicator) => ind.latest_value !== null && ind.latest_value !== undefined
          )
          setTopIndicators(withData.slice(0, 6))

          // Build simple trend movers from available data
          const withChange = withData
            .filter((ind: TopIndicator & { change_pct: number }) =>
              ind.change_pct !== null && ind.change_pct !== undefined && Math.abs(ind.change_pct) < 1000
            )
            .sort((a: TopIndicator & { change_pct: number }, b: TopIndicator & { change_pct: number }) =>
              Math.abs(b.change_pct) - Math.abs(a.change_pct)
            )
          setTrendMovers({
            gainers: withChange.filter((ind: TopIndicator & { change_pct: number }) => ind.change_pct > 0).slice(0, 4).map((ind: TopIndicator) => ({
              id: ind.id, name: ind.name, slug: ind.slug,
              change_pct: ind.change_pct, latest_value: ind.latest_value,
              unit: ind.unit, category_slug: ind.category?.slug,
              category_name: ind.category?.name, category_color: ind.category?.color,
            })),
            losers: withChange.filter((ind: TopIndicator & { change_pct: number }) => ind.change_pct < 0).slice(0, 4).map((ind: TopIndicator) => ({
              id: ind.id, name: ind.name, slug: ind.slug,
              change_pct: ind.change_pct, latest_value: ind.latest_value,
              unit: ind.unit, category_slug: ind.category?.slug,
              category_name: ind.category?.name, category_color: ind.category?.color,
            })),
          })

          // Set featured indicator with empty time series (chart will show fallback)
          if (withData.length > 1) {
            setFeaturedIndicator({
              ...withData[1],
              category_slug: withData[1].category?.slug,
              time_series: [],
            })
          } else if (withData.length > 0) {
            setFeaturedIndicator({
              ...withData[0],
              category_slug: withData[0].category?.slug,
              time_series: [],
            })
          }
        }
      } catch {
        // Silently fail — page will show empty state
      }
    }

    fetchDashboard()
  }, [])

  const formatMonth = (dateStr: string) => {
    try {
      return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-DO', {
        year: 'numeric',
        month: 'long',
      })
    } catch {
      return dateStr
    }
  }

  const formatUploadDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('es-DO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateStr
    }
  }

  const maxIndicatorCount = Math.max(...categories.map(c => c.indicator_count), 1)

  return (
    <div className="min-h-screen bg-[#f4f6f4] dark:bg-[#0d1117]">
      {/* Header */}
      <ObservatorioHeader
        breadcrumbs={[{ label: 'Observatorio Energético' }]}
      />

      {/* Hero Section - Compact & Data-Rich */}
      <div className="bg-gradient-to-br from-[#0a2e19] via-[#0f4526] to-[#1a6b3c] relative overflow-hidden">
        {/* Animated grid pattern */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }} />
        {/* Glow effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-1/4 w-80 h-80 bg-[#4ade80] rounded-full blur-[100px] opacity-[0.07]" />
          <div className="absolute bottom-0 left-1/4 w-60 h-60 bg-[#2d9e5f] rounded-full blur-[80px] opacity-[0.05]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Title row */}
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-[#4ade80]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-[#4ade80]/15 text-[#4ade80] border-0 text-[9px] font-bold uppercase tracking-widest">
                      Panel en Vivo
                    </Badge>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold text-white mt-0.5">
                    Observatorio <span className="text-[#4ade80]">Energético</span>
                  </h1>
                </div>
              </div>
              <Link
                href="#indicadores"
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/8 text-white/70 hover:text-white hover:bg-white/12 text-xs font-semibold transition-all border border-white/10 cursor-pointer"
              >
                Explorar datos
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {/* Stats row - Dashboard style */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard
                icon={<Calendar className="h-4 w-4 text-[#4ade80]" />}
                label="Última Actualización"
                value={loading ? null : stats.latest_period ? formatMonth(stats.latest_period) : 'Sin datos'}
                tooltip={stats.last_upload_at ? `Datos subidos el ${formatUploadDate(stats.last_upload_at)}` : 'Sin registro de carga'}
                loading={loading}
              />
              <StatCard
                icon={<Activity className="h-4 w-4 text-[#4ade80]" />}
                label="Indicadores"
                value={loading ? null : stats.total_indicators}
                accent
                loading={loading}
              />
              <StatCard
                icon={<Database className="h-4 w-4 text-[#4ade80]" />}
                label="Registros"
                value={loading ? null : stats.total_data_points.toLocaleString('es-DO')}
                accent
                loading={loading}
              />
              <StatCard
                icon={<Layers className="h-4 w-4 text-[#4ade80]" />}
                label="Fuente"
                value={loading ? null : stats.data_sources.length > 0
                  ? `MIM.gob.do${stats.data_sources.length > 1 ? ` +${stats.data_sources.length - 1}` : ''}`
                  : 'MIM.gob.do'}
                loading={loading}
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-8">
        {/* Overview + Trends Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-12">
          {/* Main overview chart - 2/3 width */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-1.5 h-5 rounded-full bg-[#1a6b3c]" />
              <h2 className="text-sm font-bold text-[#1c1c1e] dark:text-[#e6edf3]">Serie Temporal Destacada</h2>
              <Badge variant="secondary" className="bg-[#f4f6f4] dark:bg-[#161b22] text-[#1a6b3c] border-0 text-[10px] font-semibold">
                Vista General
              </Badge>
            </div>
            {loading ? (
              <Card className="bg-white dark:bg-[#161b22] border-[#e5e7eb] dark:border-[#30363d] p-6 h-[340px]">
                <Skeleton className="h-6 w-48 mb-4" />
                <Skeleton className="h-full w-full rounded-lg" />
              </Card>
            ) : (
              <DashboardOverviewChart indicator={featuredIndicator} />
            )}
          </div>

          {/* Trends sidebar - 1/3 width */}
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-1.5 h-5 rounded-full bg-[#f59e0b]" />
              <h2 className="text-sm font-bold text-[#1c1c1e] dark:text-[#e6edf3]">Tendencias</h2>
              <Zap className="h-3.5 w-3.5 text-[#f59e0b]" />
            </div>
            {loading ? (
              <Card className="bg-white dark:bg-[#161b22] border-[#e5e7eb] dark:border-[#30363d] p-6 h-[340px]">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full mb-3 rounded-lg" />
                ))}
              </Card>
            ) : (
              <TrendMovers gainers={trendMovers.gainers} losers={trendMovers.losers} />
            )}
          </div>
        </div>

        {/* KPI Cards Section */}
        <div id="indicadores" className="mb-8">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-1.5 h-5 rounded-full bg-[#1a6b3c]" />
              <h2 className="text-sm font-bold text-[#1c1c1e] dark:text-[#e6edf3]">Indicadores Destacados</h2>
              <Badge variant="secondary" className="bg-[#f4f6f4] dark:bg-[#161b22] text-[#1a6b3c] border-0 text-[10px] font-semibold">
                {topIndicators.length} activos
              </Badge>
            </div>
            <Link
              href="#categorias"
              className="text-xs font-semibold text-[#2d9e5f] hover:text-[#4ade80] dark:hover:text-[#4ade80] transition-colors flex items-center gap-1 cursor-pointer"
            >
              Ver categorías
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="p-4 border-[#e5e7eb] dark:border-[#30363d] bg-white dark:bg-[#161b22]">
                    <div className="flex items-center gap-2.5 mb-3">
                      <Skeleton className="h-9 w-9 rounded-lg" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                    <Skeleton className="h-7 w-20 mb-3" />
                    <Skeleton className="h-0.5 w-full rounded-full" />
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
                    description={ind.description}
                    featured={i === 1}
                    index={i}
                    categorySlug={ind.category?.slug}
                    indicatorSlug={ind.slug}
                    sparklineData={ind.sparkline_data}
                  />
                ))}
          </div>
        </div>

        {/* Categories Section - Compact Dashboard Style */}
        <div id="categorias">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-1.5 h-5 rounded-full bg-[#1a6b3c]" />
              <h2 className="text-sm font-bold text-[#1c1c1e] dark:text-[#e6edf3]">Categorías de Indicadores</h2>
              <Badge variant="secondary" className="bg-[#f4f6f4] dark:bg-[#161b22] text-[#1a6b3c] border-0 text-[10px] font-semibold">
                {stats.total_categories} áreas
              </Badge>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="p-4 border-[#e5e7eb] dark:border-[#30363d] bg-white dark:bg-[#161b22]">
                  <Skeleton className="h-10 w-10 rounded-xl mb-3" />
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-2 w-full rounded-full" />
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {categories.map((cat, index) => (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.04 }}
                >
                  <Link href={`/observatorio/${cat.slug}`}>
                    <Card className="group relative overflow-hidden border-[#e5e7eb] dark:border-[#30363d] bg-white dark:bg-[#161b22] hover:border-[#2d9e5f]/40 dark:hover:border-[#4ade80]/40 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 cursor-pointer">
                      {/* Top accent line */}
                      <div
                        className="absolute top-0 left-0 right-0 h-[2px] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"
                        style={{ backgroundColor: cat.color || '#1a6b3c' }}
                      />

                      <div className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{
                              backgroundColor: cat.color ? `${cat.color}12` : '#1a6b3c12',
                              color: cat.color || '#1a6b3c',
                            }}
                          >
                            <CategoryIcon iconName={cat.icon ?? null} size={18} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-sm font-bold text-[#1c1c1e] dark:text-[#e6edf3] group-hover:text-[#1a6b3c] dark:group-hover:text-[#4ade80] transition-colors leading-tight truncate">
                              {cat.name}
                            </h3>
                            <span className="text-[10px] text-[#9ca3af] dark:text-[#8b949e] font-medium">
                              {cat.indicator_count} indicadores
                            </span>
                          </div>
                          <ArrowRight className="h-3.5 w-3.5 text-[#9ca3af] dark:text-[#8b949e] group-hover:text-[#2d9e5f] dark:group-hover:text-[#4ade80] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                        </div>

                        {/* Progress bar showing relative size */}
                        <div className="h-1.5 rounded-full bg-[#f4f6f4] dark:bg-[#21262d] overflow-hidden">
                          <motion.div
                            className="h-full rounded-full transition-colors"
                            style={{ backgroundColor: cat.color || '#1a6b3c' }}
                            initial={{ width: 0 }}
                            animate={{ width: `${(cat.indicator_count / maxIndicatorCount) * 100}%` }}
                            transition={{ duration: 0.8, delay: 0.2 + index * 0.05 }}
                          />
                        </div>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-[#e5e7eb] dark:border-[#30363d]">
          <div className="flex items-center justify-center gap-2 text-xs text-[#9ca3af] dark:text-[#8b949e]">
            <TrendingUp className="h-3 w-3" />
            <span>Datos proporcionados por la Secretaría de Energía de Fuerza del Pueblo</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Stat card sub-component for hero ── */
function StatCard({
  icon,
  label,
  value,
  accent = false,
  tooltip,
  loading,
}: {
  icon: React.ReactNode
  label: string
  value: string | number | null
  accent?: boolean
  tooltip?: string
  loading: boolean
}) {
  return (
    <div className="bg-white/[0.06] backdrop-blur-sm rounded-xl border border-white/[0.08] px-3.5 py-3 hover:bg-white/[0.08] transition-colors">
      <div className="flex items-center gap-2 mb-1.5">
        <div className="w-7 h-7 rounded-md bg-white/10 flex items-center justify-center">
          {icon}
        </div>
        <span className="text-[10px] text-white/50 font-medium uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex items-center gap-1.5">
        {loading ? (
          <Skeleton className="h-5 w-20 bg-white/15" />
        ) : (
          <>
            <span className={`text-base font-extrabold leading-tight ${accent ? 'text-[#4ade80]' : 'text-white'}`}>
              {value}
            </span>
            {tooltip && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-white/30 hover:text-white/60 cursor-help transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    {tooltip}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </>
        )}
      </div>
    </div>
  )
}
