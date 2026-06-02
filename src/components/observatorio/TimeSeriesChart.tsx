'use client'

import { useMemo, useCallback } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  Cell,
  Tooltip,
} from 'recharts'
import {
  ChartContainer,
} from '@/components/ui/chart'
import type { ChartType } from '@/lib/supabase-types'

interface TimeSeriesChartProps {
  data: { date: string; value: number }[]
  chartType: ChartType
  unit?: string
  color?: string
  height?: number
}

// Color palette for year differentiation
const YEAR_COLORS = [
  '#1a6b3c', '#0e7490', '#b45309', '#7c3aed',
  '#dc2626', '#0891b2', '#65a30d', '#c026d3',
  '#ea580c', '#4f46e5', '#059669', '#9333ea',
]

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

// Delayed tooltip: uses pure CSS animations for a 1-second delay.
// When the tooltip first appears (active=true), a loading state with progress bar
// is shown for 1 second, after which the actual value fades in.
// Since Recharts conditionally renders the tooltip content only when active=true,
// each new hover session starts fresh CSS animations.
function DelayedTooltip({ active, payload, label, unit }: any) {
  if (!active || !payload || payload.length === 0) return null

  const value = payload[0].value
  const formattedValue = typeof value === 'number'
    ? value.toLocaleString('es-DO', { maximumFractionDigits: 2 })
    : value

  const item = payload[0].payload
  const rawDate = item?.rawDate
  const dateStr = rawDate
    ? new Date(rawDate).toLocaleDateString('es-DO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : label

  return (
    <div className="bg-white dark:bg-[#161b22] border border-gray-200 dark:border-[#30363d] rounded-lg shadow-xl px-4 py-3 min-w-[160px] relative">
      <style>{`
        @keyframes tooltipProgress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        @keyframes tooltipLoadingFade {
          0%, 50% { opacity: 1; max-height: 40px; }
          100% { opacity: 0; max-height: 0; padding: 0; margin: 0; overflow: hidden; }
        }
        @keyframes tooltipValueReveal {
          0%, 50% { opacity: 0; transform: translateY(4px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Loading state — visible for first second then fades out */}
      <div
        className="overflow-hidden"
        style={{ animation: 'tooltipLoadingFade 1s ease forwards' }}
      >
        <p className="text-gray-500 dark:text-[#8b949e] text-xs font-medium mb-1">Pasa el cursor para ver el valor</p>
        <div className="h-1.5 w-24 bg-gray-100 dark:bg-[#30363d] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#1a6b3c] rounded-full"
            style={{ animation: 'tooltipProgress 1s linear forwards' }}
          />
        </div>
      </div>

      {/* Value state — hidden initially, fades in after 1 second */}
      <div style={{ animation: 'tooltipValueReveal 1s ease forwards' }}>
        <p className="text-gray-500 dark:text-[#8b949e] text-xs mb-1.5 font-medium">{dateStr}</p>
        <p className="text-[#1c1c1e] dark:text-[#e6edf3] text-lg font-bold leading-tight">
          {formattedValue}
          {unit && <span className="text-sm font-semibold text-gray-400 dark:text-[#8b949e] ml-1">{unit}</span>}
        </p>
      </div>
    </div>
  )
}

export default function TimeSeriesChart({
  data,
  chartType,
  unit = '',
  color = '#1a6b3c',
  height = 350,
}: TimeSeriesChartProps) {
  const config = {
    value: {
      label: unit || 'Valor',
      color,
    },
  }

  // Calculate max and median values
  const { maxValue, medianValue } = useMemo(() => {
    if (data.length === 0) return { maxValue: 0, medianValue: 0 }
    const values = data.map(d => d.value).filter(v => v !== null && v !== undefined)
    if (values.length === 0) return { maxValue: 0, medianValue: 0 }

    const max = Math.max(...values)
    const sorted = [...values].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    const median = sorted.length % 2 !== 0
      ? sorted[mid]
      : (sorted[mid - 1] + sorted[mid]) / 2

    return { maxValue: max, medianValue: median }
  }, [data])

  // Process data with smart X-axis labels
  const { isMultiYear, processedData, uniqueYears, yearColorMap } = useMemo(() => {
    if (data.length === 0) return {
      isMultiYear: false, processedData: [], uniqueYears: [],
      yearColorMap: {},
    }

    const dates = data.map(d => new Date(d.date))
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())))
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())))
    const monthDiff = (maxDate.getFullYear() - minDate.getFullYear()) * 12
      + (maxDate.getMonth() - minDate.getMonth())
    const multi = monthDiff > 12

    const yearsSet = new Set<string>()

    const processed = data.map((d) => {
      const date = new Date(d.date)
      const year = date.getFullYear().toString()
      const isNewYear = !yearsSet.has(year)
      if (isNewYear) {
        yearsSet.add(year)
      }

      let label: string
      if (multi) {
        const shortYear = year.slice(-2)
        label = `${MONTH_NAMES[date.getMonth()]} ${shortYear}`
      } else {
        label = MONTH_NAMES[date.getMonth()]
      }

      return {
        ...d,
        date: label,
        rawDate: d.date,
        year,
        month: date.getMonth(),
        isYearStart: isNewYear,
      }
    })

    const uniqueYears = Array.from(yearsSet).sort()
    const ycm: Record<string, string> = {}
    uniqueYears.forEach((year, i) => {
      ycm[year] = YEAR_COLORS[i % YEAR_COLORS.length]
    })

    return {
      isMultiYear: multi,
      processedData: processed,
      uniqueYears,
      yearColorMap: ycm,
    }
  }, [data])

  // Smart X-axis interval — show fewer ticks for readability
  const xInterval = useMemo(() => {
    const len = processedData.length
    if (len <= 12) return 0
    if (len <= 24) return 1
    if (len <= 48) return 2
    if (len <= 96) return 5
    if (isMultiYear) {
      // For multi-year: show roughly 1 tick per quarter per year
      const monthsPerYear = len / Math.max(uniqueYears.length, 1)
      if (monthsPerYear <= 12) return 3
      return Math.max(5, Math.floor(monthsPerYear / 4))
    }
    return Math.floor(len / 15)
  }, [processedData.length, isMultiYear, uniqueYears.length])

  // Format Y values
  const formatY = useCallback((v: number) => {
    if (Math.abs(v) >= 1000000) return `${(v / 1000000).toFixed(1)}M`
    if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(1)}k`
    return v.toLocaleString('es-DO', { maximumFractionDigits: 1 })
  }, [])

  const formatValue = useCallback((v: number) => v.toLocaleString('es-DO', { maximumFractionDigits: 2 }), [])

  // Compute Y-axis domain with padding for reference lines
  const yDomain = useMemo(() => {
    if (data.length === 0) return ['auto', 'auto']
    const values = data.map(d => d.value).filter(v => v !== null && v !== undefined)
    if (values.length === 0) return ['auto', 'auto']
    const min = Math.min(...values)
    const max = Math.max(...values)
    const padding = (max - min) * 0.18
    return [Math.floor(Math.max(0, min - padding)), Math.ceil(max + padding)]
  }, [data])

  // Custom X-axis tick component with year colors and month labels
  const renderXTick = useCallback((props: any) => {
    const { x, y, payload } = props
    const item = processedData[payload.index]
    if (!item) return null

    const isYearStart = item.isYearStart
    const yearColor = yearColorMap[item.year] || '#6b7280'

    if (isMultiYear) {
      return (
        <g transform={`translate(${x},${y})`}>
          {isYearStart && (
            <text
              x={0}
              y={12}
              textAnchor="middle"
              fill={yearColor}
              fontSize={11}
              fontWeight={800}
            >
              {item.year}
            </text>
          )}
          <text
            x={0}
            y={isYearStart ? 26 : 14}
            textAnchor="middle"
            fill={isYearStart ? yearColor : '#9ca3af'}
            fontSize={isYearStart ? 9 : 8}
            fontWeight={isYearStart ? 600 : 400}
          >
            {payload.value}
          </text>
        </g>
      )
    }

    // Single year: simple month labels
    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={12}
          textAnchor="middle"
          fill={isYearStart ? yearColor : '#6b7280'}
          fontSize={isYearStart ? 11 : 9}
          fontWeight={isYearStart ? 700 : 400}
        >
          {payload.value}
        </text>
      </g>
    )
  }, [processedData, yearColorMap, isMultiYear])

  const chartMargin = { top: 50, right: 120, bottom: 8, left: 8 }

  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return (
          <BarChart data={processedData} margin={chartMargin}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:[&>line]:stroke-[#30363d]" vertical={false} />
            <XAxis
              dataKey="date"
              tick={renderXTick}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
              interval={xInterval}
              height={isMultiYear ? 48 : 30}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#6b7280' }}
              className="dark:[&>g>text]:fill-[#8b949e]"
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
              tickFormatter={formatY}
              domain={yDomain}
              width={60}
            />
            <Tooltip
              content={<DelayedTooltip unit={unit} />}
              cursor={{ fill: 'rgba(26, 107, 60, 0.06)' }}
            />
            {maxValue > 0 && (
              <ReferenceLine
                y={maxValue}
                stroke="#dc2626"
                strokeDasharray="8 4"
                strokeWidth={1.5}
                label={{
                  value: `Máx: ${formatValue(maxValue)}${unit ? ` ${unit}` : ''}`,
                  position: 'insideTopRight',
                  fill: '#dc2626',
                  fontSize: 11,
                  fontWeight: 700,
                }}
              />
            )}
            {medianValue > 0 && medianValue !== maxValue && (
              <ReferenceLine
                y={medianValue}
                stroke="#f59e0b"
                strokeDasharray="6 4"
                strokeWidth={1.5}
                label={{
                  value: `Medio: ${formatValue(medianValue)}${unit ? ` ${unit}` : ''}`,
                  position: 'insideTopRight',
                  fill: '#f59e0b',
                  fontSize: 11,
                  fontWeight: 700,
                }}
              />
            )}
            <Bar
              dataKey="value"
              radius={[4, 4, 0, 0]}
              maxBarSize={50}
            >
              {processedData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={yearColorMap[entry.year] || color}
                  fillOpacity={entry.isYearStart ? 1 : 0.75}
                />
              ))}
            </Bar>
          </BarChart>
        )
      case 'area':
        return (
          <AreaChart data={processedData} margin={chartMargin}>
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:[&>line]:stroke-[#30363d]" vertical={false} />
            <XAxis
              dataKey="date"
              tick={renderXTick}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
              interval={xInterval}
              height={isMultiYear ? 48 : 30}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#6b7280' }}
              className="dark:[&>g>text]:fill-[#8b949e]"
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
              tickFormatter={formatY}
              domain={yDomain}
              width={60}
            />
            <Tooltip
              content={<DelayedTooltip unit={unit} />}
              cursor={{ fill: 'rgba(26, 107, 60, 0.06)' }}
            />
            {maxValue > 0 && (
              <ReferenceLine
                y={maxValue}
                stroke="#dc2626"
                strokeDasharray="8 4"
                strokeWidth={1.5}
                label={{
                  value: `Máx: ${formatValue(maxValue)}${unit ? ` ${unit}` : ''}`,
                  position: 'insideTopRight',
                  fill: '#dc2626',
                  fontSize: 11,
                  fontWeight: 700,
                }}
              />
            )}
            {medianValue > 0 && medianValue !== maxValue && (
              <ReferenceLine
                y={medianValue}
                stroke="#f59e0b"
                strokeDasharray="6 4"
                strokeWidth={1.5}
                label={{
                  value: `Medio: ${formatValue(medianValue)}${unit ? ` ${unit}` : ''}`,
                  position: 'insideTopRight',
                  fill: '#f59e0b',
                  fontSize: 11,
                  fontWeight: 700,
                }}
              />
            )}
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fill="url(#areaGradient)"
            />
          </AreaChart>
        )
      case 'line':
      default:
        return (
          <LineChart data={processedData} margin={chartMargin}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:[&>line]:stroke-[#30363d]" vertical={false} />
            <XAxis
              dataKey="date"
              tick={renderXTick}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
              interval={xInterval}
              height={isMultiYear ? 48 : 30}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#6b7280' }}
              className="dark:[&>g>text]:fill-[#8b949e]"
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
              tickFormatter={formatY}
              domain={yDomain}
              width={60}
            />
            <Tooltip
              content={<DelayedTooltip unit={unit} />}
              cursor={{ fill: 'rgba(26, 107, 60, 0.06)' }}
            />
            {maxValue > 0 && (
              <ReferenceLine
                y={maxValue}
                stroke="#dc2626"
                strokeDasharray="8 4"
                strokeWidth={1.5}
                label={{
                  value: `Máx: ${formatValue(maxValue)}${unit ? ` ${unit}` : ''}`,
                  position: 'insideTopRight',
                  fill: '#dc2626',
                  fontSize: 11,
                  fontWeight: 700,
                }}
              />
            )}
            {medianValue > 0 && medianValue !== maxValue && (
              <ReferenceLine
                y={medianValue}
                stroke="#f59e0b"
                strokeDasharray="6 4"
                strokeWidth={1.5}
                label={{
                  value: `Medio: ${formatValue(medianValue)}${unit ? ` ${unit}` : ''}`,
                  position: 'insideTopRight',
                  fill: '#f59e0b',
                  fontSize: 11,
                  fontWeight: 700,
                }}
              />
            )}
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={data.length <= 24 ? { r: 3, fill: color, strokeWidth: 2, stroke: '#fff' } : false}
              activeDot={{ r: 5, fill: color, stroke: '#fff', strokeWidth: 2 }}
            />
          </LineChart>
        )
    }
  }

  return (
    <ChartContainer
      config={config}
      className="w-full !aspect-auto"
      style={{ height }}
    >
      {renderChart()}
    </ChartContainer>
  )
}
