'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react'
import Link from 'next/link'

interface DashboardOverviewChartProps {
  indicator: {
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
  } | null
}

export default function DashboardOverviewChart({ indicator }: DashboardOverviewChartProps) {
  if (!indicator || !indicator.time_series || indicator.time_series.length === 0) {
    return (
      <Card className="bg-white dark:bg-[#161b22] border-[#e5e7eb] dark:border-[#30363d] p-6 h-full min-h-[320px] flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 text-[#d1d5db] dark:text-[#484f58] mx-auto mb-3" />
          <p className="text-sm text-[#9ca3af] dark:text-[#8b949e]">Sin datos de serie temporal disponibles</p>
        </div>
      </Card>
    )
  }

  const data = indicator.time_series.map((point, idx) => ({
    ...point,
    idx,
    // Format date for display
    label: formatDateLabel(point.date),
  }))

  const isUp = indicator.change !== null && indicator.change !== undefined && indicator.change > 0
  const isDown = indicator.change !== null && indicator.change !== undefined && indicator.change < 0

  const formatYAxis = (value: number) => {
    if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
    if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}k`
    return value.toLocaleString('es-DO', { maximumFractionDigits: 1 })
  }

  const displayValue = indicator.latest_value !== null && indicator.latest_value !== undefined
    ? indicator.latest_value.toLocaleString('es-DO', { maximumFractionDigits: 2 })
    : '—'

  return (
    <Card className="bg-white dark:bg-[#161b22] border-[#e5e7eb] dark:border-[#30363d] overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-5 pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              {indicator.category?.color && (
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: indicator.category.color }}
                />
              )}
              <span className="text-[11px] font-semibold text-[#6b7280] dark:text-[#8b949e] uppercase tracking-wider">
                {indicator.category?.name || 'Indicador Destacado'}
              </span>
            </div>
            <h3 className="text-base font-bold text-[#1c1c1e] dark:text-[#e6edf3] leading-tight truncate">
              {indicator.name}
            </h3>
          </div>

          <div className="text-right flex-shrink-0">
            <div className="text-2xl font-extrabold text-[#1c1c1e] dark:text-[#e6edf3] leading-tight">
              {displayValue}
              {indicator.unit && (
                <span className="text-sm font-semibold ml-1 text-[#6b7280] dark:text-[#8b949e]">{indicator.unit}</span>
              )}
            </div>
            {indicator.change_pct !== null && indicator.change_pct !== undefined && (
              <span
                className={`inline-flex items-center gap-1 text-xs font-bold ${
                  isUp ? 'text-[#1a6b3c] dark:text-[#4ade80]' : isDown ? 'text-red-600 dark:text-red-400' : 'text-[#6b7280] dark:text-[#8b949e]'
                }`}
              >
                {isUp && <TrendingUp className="h-3 w-3" />}
                {isDown && <TrendingDown className="h-3 w-3" />}
                {!isUp && !isDown && <Minus className="h-3 w-3" />}
                {isUp ? '+' : ''}{indicator.change_pct.toFixed(1)}%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Chart — fixed height to prevent infinite vertical growth */}
      <div className="px-2 pb-4" style={{ height: '280px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: 8 }}>
            <defs>
              <linearGradient id="overviewGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1a6b3c" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#1a6b3c" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:[&>line]:stroke-[#30363d]" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              className="dark:[&>g>text]:fill-[#8b949e]"
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={formatYAxis}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              className="dark:[&>g>text]:fill-[#8b949e]"
              tickLine={false}
              axisLine={false}
              width={60}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--tooltip-bg, #fff)',
                border: '1px solid var(--tooltip-border, #e5e7eb)',
                borderRadius: '10px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                padding: '10px 14px',
                fontSize: '12px',
                color: 'var(--tooltip-color, #1c1c1e)',
              }}
              formatter={(value: number) => [
                `${value.toLocaleString('es-DO', { maximumFractionDigits: 2 })}${indicator.unit ? ` ${indicator.unit}` : ''}`,
                indicator.name,
              ]}
              labelFormatter={(label: string) => label}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#1a6b3c"
              strokeWidth={2.5}
              fill="url(#overviewGradient)"
              dot={false}
              activeDot={{
                r: 5,
                fill: '#1a6b3c',
                stroke: '#fff',
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Footer link */}
      {indicator.category_slug && (
        <div className="px-6 pb-4">
          <Link
            href={`/observatorio/${indicator.category_slug}/${indicator.slug}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2d9e5f] dark:text-[#4ade80] hover:text-[#1a6b3c] dark:hover:text-[#4ade80] transition-colors"
          >
            Ver detalle del indicador
            <TrendingUp className="h-3 w-3" />
          </Link>
        </div>
      )}
    </Card>
  )
}

function formatDateLabel(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T12:00:00')
    return d.toLocaleDateString('es-DO', { month: 'short', year: '2-digit' })
  } catch {
    return dateStr
  }
}
