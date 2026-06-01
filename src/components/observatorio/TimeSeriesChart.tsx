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
  Label,
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

// Custom tooltip component with hover delay via CSS animation
function CustomTooltip({ active, payload, label, unit }: any) {
  if (!active || !payload || payload.length === 0) return null

  const value = payload[0].value
  const formattedValue = typeof value === 'number'
    ? value.toLocaleString('es-DO', { maximumFractionDigits: 2 })
    : value

  return (
    <div
      className="bg-white border border-gray-200 rounded-lg shadow-xl px-4 py-3 min-w-[140px]"
      style={{
        animation: 'tooltipFadeIn 1.5s ease forwards',
      }}
    >
      <style>{`
        @keyframes tooltipFadeIn {
          0% { opacity: 0; transform: translateY(4px); }
          80% { opacity: 0; transform: translateY(4px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <p className="text-gray-500 text-xs mb-1.5 font-medium">{label}</p>
      <p className="text-[#1c1c1e] text-lg font-bold leading-tight">
        {formattedValue}
        {unit && <span className="text-sm font-semibold text-gray-400 ml-1">{unit}</span>}
      </p>
      {payload[0].payload?.year && (
        <p className="text-[10px] text-gray-400 mt-1">{payload[0].payload.year}</p>
      )}
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
    max: {
      label: 'Max',
      color: '#dc2626',
    },
    median: {
      label: 'Mediana',
      color: '#f59e0b',
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
        // Multi-year: "Ene 09", "Ene 10", etc.
        const shortYear = year.slice(-2)
        label = `${MONTH_NAMES[date.getMonth()]} ${shortYear}`
      } else {
        // Single year or less: just month name
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

  // Smart X-axis interval
  const xInterval = useMemo(() => {
    const len = processedData.length
    if (len <= 12) return 0
    if (len <= 24) return 1
    if (len <= 48) return 3
    if (len <= 96) return 5
    if (isMultiYear) {
      // For multi-year, aim for ~12 month ticks per year
      const monthsPerYear = len / Math.max(uniqueYears.length, 1)
      if (monthsPerYear <= 12) return 2
      return Math.floor(monthsPerYear / 6)
    }
    return Math.floor(len / 20)
  }, [processedData.length, isMultiYear, uniqueYears.length])

  // Format Y values
  const formatY = (v: number) => {
    if (Math.abs(v) >= 1000000) return `${(v / 1000000).toFixed(1)}M`
    if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(1)}k`
    return v.toLocaleString('es-DO', { maximumFractionDigits: 1 })
  }

  const formatValue = (v: number) => v.toLocaleString('es-DO', { maximumFractionDigits: 2 })

  const commonProps = {
    data: processedData,
    margin: { top: 36, right: 20, bottom: 4, left: 8 },
  }

  // Reference lines for max and median
  const referenceLines = (
    <>
      {maxValue > 0 && (
        <ReferenceLine
          y={maxValue}
          stroke="#dc2626"
          strokeDasharray="6 4"
          strokeWidth={1.5}
        >
          <Label
            value={`Max: ${formatValue(maxValue)}${unit ? ` ${unit}` : ''}`}
            position="insideTopRight"
            fill="#dc2626"
            fontSize={11}
            fontWeight={600}
          />
        </ReferenceLine>
      )}
      {medianValue > 0 && medianValue !== maxValue && (
        <ReferenceLine
          y={medianValue}
          stroke="#f59e0b"
          strokeDasharray="4 4"
          strokeWidth={1.5}
        >
          <Label
            value={`Mediana: ${formatValue(medianValue)}${unit ? ` ${unit}` : ''}`}
            position="insideTopRight"
            fill="#f59e0b"
            fontSize={11}
            fontWeight={600}
          />
        </ReferenceLine>
      )}
    </>
  )

  // Custom X-axis tick component
  const renderXTick = useCallback((props: any) => {
    const { x, y, payload } = props
    const item = processedData[payload.index]
    const isYearStart = item?.isYearStart
    const yearColor = item ? (yearColorMap[item.year] || '#6b7280') : '#6b7280'

    return (
      <g transform={`translate(${x},${y})`}>
        {isYearStart && (
          <circle cx={0} cy={-4} r={2.5} fill={yearColor} />
        )}
        <text
          x={0}
          y={isYearStart ? 14 : 12}
          textAnchor="middle"
          fill={isYearStart ? yearColor : '#9ca3af'}
          fontSize={isYearStart ? 11 : 9}
          fontWeight={isYearStart ? 700 : 400}
        >
          {payload.value}
        </text>
      </g>
    )
  }, [processedData, yearColorMap])

  const commonAxisProps = (
    <>
      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
      <XAxis
        dataKey="date"
        tick={renderXTick}
        tickLine={false}
        axisLine={{ stroke: '#e5e7eb' }}
        interval={xInterval}
      />
      <YAxis
        tick={{ fontSize: 11, fill: '#6b7280' }}
        tickLine={false}
        axisLine={{ stroke: '#e5e7eb' }}
        tickFormatter={formatY}
        domain={['auto', 'auto']}
      />
      <Tooltip
        content={<CustomTooltip unit={unit} />}
        cursor={{ fill: 'rgba(26, 107, 60, 0.06)' }}
      />
      {referenceLines}
    </>
  )

  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return (
          <BarChart {...commonProps}>
            {commonAxisProps}
            <Bar
              dataKey="value"
              radius={[4, 4, 0, 0]}
              maxBarSize={50}
            >
              {processedData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={yearColorMap[entry.year] || color}
                  fillOpacity={entry.isYearStart ? 1 : 0.7}
                />
              ))}
            </Bar>
          </BarChart>
        )
      case 'area':
        return (
          <AreaChart {...commonProps}>
            {commonAxisProps}
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
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
          <LineChart {...commonProps}>
            {commonAxisProps}
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
    <ChartContainer config={config} className="w-full" style={{ height }}>
      {renderChart()}
    </ChartContainer>
  )
}
