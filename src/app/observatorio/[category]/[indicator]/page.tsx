'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Info,
  Calendar,
  Database,
  BarChart3,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import ObservatorioHeader from '@/components/observatorio/ObservatorioHeader'
import TimeSeriesChart from '@/components/observatorio/TimeSeriesChart'
import EntitySelector from '@/components/observatorio/EntitySelector'
import DateRangeFilter from '@/components/observatorio/DateRangeFilter'
import DataTableView from '@/components/observatorio/DataTableView'
import CategoryIcon from '@/components/observatorio/CategoryIcon'
import type {
  IndicatorCategory,
  IndicatorWithData,
  DataPoint,
  Entity,
  ChartType,
} from '@/lib/supabase-types'

const frequencyLabels: Record<string, string> = {
  daily: 'Diario',
  weekly: 'Semanal',
  monthly: 'Mensual',
  quarterly: 'Trimestral',
  yearly: 'Anual',
}

const chartTypeLabels: Record<string, string> = {
  line: 'Línea',
  bar: 'Barras',
  area: 'Área',
  pie: 'Circular',
  gauge: 'Medidor',
  sparkline: 'Tendencia',
}

export default function IndicatorDetailPage() {
  const params = useParams()
  const categorySlug = params.category as string
  const indicatorSlug = params.indicator as string

  const [category, setCategory] = useState<IndicatorCategory | null>(null)
  const [indicator, setIndicator] = useState<IndicatorWithData | null>(null)
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([])
  const [entities, setEntities] = useState<Entity[]>([])
  const [loading, setLoading] = useState(true)
  const [chartLoading, setChartLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedEntity, setSelectedEntity] = useState<string>('all')
  const [dateRange, setDateRange] = useState<{ from?: string; to?: string } | null>(null)

  // Fetch category and indicator metadata
  useEffect(() => {
    async function fetchMetadata() {
      try {
        setLoading(true)

        // Fetch categories to find current category
        const catRes = await fetch('/api/observatorio/categories?with_indicators=true')
        const catData = await catRes.json()
        const found = (catData.categories || []).find(
          (c: IndicatorCategory & { slug: string }) => c.slug === categorySlug
        )

        if (found) {
          setCategory(found)
        }

        // Fetch indicator data (with latest values)
        const indRes = await fetch(
          `/api/observatorio/indicators?category_slug=${categorySlug}&with_data=true`
        )
        const indData = await indRes.json()
        const foundIndicator = (indData.indicators || []).find(
          (ind: IndicatorWithData) => ind.slug === indicatorSlug
        )

        if (!foundIndicator) {
          setError('Indicador no encontrado')
          return
        }

        setIndicator(foundIndicator)

        // Fetch entities
        const entRes = await fetch('/api/observatorio/entities')
        const entData = await entRes.json()
        setEntities(entData.entities || [])
      } catch (err) {
        console.error('Error fetching indicator metadata:', err)
        setError('Error al cargar los datos')
      } finally {
        setLoading(false)
      }
    }

    if (categorySlug && indicatorSlug) {
      fetchMetadata()
    }
  }, [categorySlug, indicatorSlug])

  // Fetch data points (chart data)
  const fetchDataPoints = useCallback(
    async (entitySlug?: string, range?: { from?: string; to?: string } | null) => {
      if (!indicatorSlug) return

      try {
        setChartLoading(true)

        let url = `/api/observatorio/data-points?indicator_slug=${indicatorSlug}`
        if (entitySlug && entitySlug !== 'all') {
          url += `&entity_slug=${entitySlug}`
        }
        if (range?.from) {
          url += `&from=${range.from}`
        }
        if (range?.to) {
          url += `&to=${range.to}`
        }

        const res = await fetch(url)
        const data = await res.json()

        if (data.error) {
          console.error('API error:', data.error)
          setDataPoints([])
          return
        }

        setDataPoints(data.data_points || [])
      } catch (err) {
        console.error('Error fetching data points:', err)
        setDataPoints([])
      } finally {
        setChartLoading(false)
      }
    },
    [indicatorSlug]
  )

  // Initial data fetch when indicator is loaded
  useEffect(() => {
    if (indicator) {
      fetchDataPoints(selectedEntity, dateRange)
    }
  }, [indicator, selectedEntity, dateRange, fetchDataPoints])

  const handleEntityChange = (value: string) => {
    setSelectedEntity(value)
  }

  const handleDateRangeChange = (range: { from?: string; to?: string } | null) => {
    setDateRange(range)
  }

  const isUp = indicator?.change !== null && indicator?.change !== undefined && indicator.change > 0
  const isDown = indicator?.change !== null && indicator?.change !== undefined && indicator.change < 0
  const hasData = indicator?.latest_value !== null && indicator?.latest_value !== undefined

  const displayValue = hasData
    ? indicator!.latest_value!.toLocaleString('es-DO', { maximumFractionDigits: 2 })
    : '—'

  const chartData = dataPoints.map((dp) => ({
    date: dp.date,
    value: dp.value,
  }))

  if (error) {
    return (
      <div className="min-h-screen bg-[#f4f6f4]">
        <ObservatorioHeader
          breadcrumbs={[
            { label: 'Observatorio', href: '/observatorio' },
            { label: category?.name || categorySlug, href: `/observatorio/${categorySlug}` },
            { label: 'Error' },
          ]}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-xl font-bold text-[#1c1c1e] mb-2">{error}</h2>
          <p className="text-sm text-[#6b7280]">
            El indicador que busca no existe o ha sido removido.
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
          {
            label: category?.name || categorySlug,
            href: `/observatorio/${categorySlug}`,
          },
          { label: indicator?.name || indicatorSlug },
        ]}
      />

      {/* Indicator header card */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-0 pt-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="border-[#e5e7eb] bg-white overflow-hidden">
            {/* Green accent bar */}
            <div
              className="h-1.5"
              style={{ backgroundColor: category?.color || '#1a6b3c' }}
            />
            <div className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* Left: indicator info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    {category?.icon && (
                      <span className="text-[#1a6b3c]">
                        <CategoryIcon iconName={category.icon} size={24} />
                      </span>
                    )}
                    <h1 className="text-xl sm:text-2xl font-bold text-[#1c1c1e]">
                      {loading ? (
                        <Skeleton className="h-7 w-64" />
                      ) : (
                        indicator?.name
                      )}
                    </h1>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {/* Latest value */}
                    <div className="flex items-baseline gap-1.5">
                      {loading ? (
                        <Skeleton className="h-9 w-24" />
                      ) : (
                        <>
                          <span className="text-3xl font-extrabold text-[#1c1c1e]">
                            {displayValue}
                          </span>
                          {indicator?.unit && (
                            <span className="text-base font-semibold text-[#6b7280]">
                              {indicator.unit}
                            </span>
                          )}
                        </>
                      )}
                    </div>

                    {/* Change badge */}
                    {!loading && indicator?.change_pct !== null && indicator?.change_pct !== undefined && (
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold ${
                          isUp
                            ? 'bg-[#4ade80]/15 text-[#1a6b3c]'
                            : isDown
                            ? 'bg-red-50 text-red-600'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {isUp && <TrendingUp className="h-3.5 w-3.5" />}
                        {isDown && <TrendingDown className="h-3.5 w-3.5" />}
                        {!isUp && !isDown && <Minus className="h-3.5 w-3.5" />}
                        {isUp ? '+' : ''}
                        {indicator.change_pct.toFixed(1)}%
                      </span>
                    )}

                    {/* Frequency badge */}
                    {!loading && indicator?.frequency && (
                      <Badge
                        variant="secondary"
                        className="bg-[#f4f6f4] text-[#6b7280] border-0 text-xs font-semibold uppercase tracking-wide"
                      >
                        {frequencyLabels[indicator.frequency] || indicator.frequency}
                      </Badge>
                    )}

                    {/* Chart type badge */}
                    {!loading && indicator?.chart_type && (
                      <Badge
                        variant="outline"
                        className="text-[10px] font-semibold text-[#6b7280] border-[#e5e7eb]"
                      >
                        {chartTypeLabels[indicator.chart_type] || indicator.chart_type}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Right: quick metadata */}
                {!loading && indicator && (
                  <div className="flex flex-wrap gap-4 lg:gap-6 text-sm">
                    {indicator.latest_date && (
                      <div className="flex items-center gap-2 text-[#6b7280]">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Último:{' '}
                          {new Date(indicator.latest_date).toLocaleDateString('es-DO', {
                            year: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-[#6b7280]">
                      <Database className="h-4 w-4" />
                      <span>{dataPoints.length} registros</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Chart Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card className="border-[#e5e7eb] bg-white overflow-hidden">
          <div className="p-6">
            {/* Chart controls */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-[#1a6b3c]" />
                <h2 className="text-base font-bold text-[#1c1c1e]">
                  Serie Histórica
                </h2>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                {/* Entity selector */}
                {entities.length > 0 && (
                  <EntitySelector
                    entities={entities}
                    value={selectedEntity}
                    onChange={handleEntityChange}
                  />
                )}

                {/* Date range filter */}
                <DateRangeFilter onRangeChange={handleDateRangeChange} />
              </div>
            </div>

            {/* Chart */}
            {chartLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-[350px] w-full rounded-lg" />
              </div>
            ) : chartData.length > 0 ? (
              <TimeSeriesChart
                data={chartData}
                chartType={indicator?.chart_type || 'line'}
                unit={indicator?.unit}
                color={category?.color || '#1a6b3c'}
                height={380}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] text-center">
                <Database className="h-10 w-10 text-[#d1d5db] mb-3" />
                <p className="text-sm font-semibold text-[#6b7280] mb-1">
                  No hay datos disponibles
                </p>
                <p className="text-xs text-[#9ca3af]">
                  Intenta cambiar el filtro de entidad o rango de fechas.
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Bottom section: Metadata + Data Table */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Metadata card */}
          <div>
            <Card className="border-[#e5e7eb] bg-white h-fit">
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Info className="h-4 w-4 text-[#1a6b3c]" />
                  <h3 className="text-sm font-bold text-[#1c1c1e]">
                    Información del Indicador
                  </h3>
                </div>

                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i}>
                        <Skeleton className="h-3 w-20 mb-1" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <MetadataRow label="Unidad" value={indicator?.unit || '—'} />
                    <MetadataRow
                      label="Frecuencia"
                      value={
                        indicator?.frequency
                          ? frequencyLabels[indicator.frequency]
                          : '—'
                      }
                    />
                    <MetadataRow
                      label="Tipo de gráfico"
                      value={
                        indicator?.chart_type
                          ? chartTypeLabels[indicator.chart_type]
                          : '—'
                      }
                    />
                    <MetadataRow label="Fuente" value={indicator?.source || '—'} />
                    {indicator?.description && (
                      <div>
                        <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-1">
                          Descripción
                        </p>
                        <p className="text-sm text-[#1c1c1e] leading-relaxed">
                          {indicator.description}
                        </p>
                      </div>
                    )}
                    {indicator?.entity && (
                      <MetadataRow
                        label="Entidad"
                        value={indicator.entity.name}
                      />
                    )}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Data table */}
          <div className="lg:col-span-2">
            <Card className="border-[#e5e7eb] bg-white">
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Database className="h-4 w-4 text-[#1a6b3c]" />
                  <h3 className="text-sm font-bold text-[#1c1c1e]">
                    Datos Históricos
                  </h3>
                  <Badge
                    variant="secondary"
                    className="bg-[#f4f6f4] text-[#6b7280] border-0 text-xs ml-auto"
                  >
                    {dataPoints.length} registros
                  </Badge>
                </div>

                {chartLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-8 w-full" />
                    ))}
                  </div>
                ) : (
                  <DataTableView
                    dataPoints={dataPoints}
                    unit={indicator?.unit}
                  />
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

function MetadataRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-1">
        {label}
      </p>
      <p className="text-sm text-[#1c1c1e] font-medium">{value}</p>
    </div>
  )
}
