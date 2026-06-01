'use client'

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
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import type { ChartType } from '@/lib/supabase-types'

interface TimeSeriesChartProps {
  data: { date: string; value: number }[]
  chartType: ChartType
  unit?: string
  color?: string
  height?: number
}

const chartConfig = {
  value: {
    label: 'Valor',
    color: '#1a6b3c',
  },
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

  // Format dates for display
  const formattedData = data.map((d) => ({
    ...d,
    date: formatDateLabel(d.date),
  }))

  const commonProps = {
    data: formattedData,
    margin: { top: 8, right: 8, bottom: 8, left: 8 },
  }

  const commonAxisProps = (
    <>
      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
      <XAxis
        dataKey="date"
        tick={{ fontSize: 11, fill: '#6b7280' }}
        tickLine={false}
        axisLine={{ stroke: '#e5e7eb' }}
        interval="preserveStartEnd"
      />
      <YAxis
        tick={{ fontSize: 11, fill: '#6b7280' }}
        tickLine={false}
        axisLine={{ stroke: '#e5e7eb' }}
        tickFormatter={(v: number) =>
          v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toString()
        }
      />
      <ChartTooltip
        content={
          <ChartTooltipContent
            formatter={(value: number) => [
              `${value.toLocaleString('es-DO', { maximumFractionDigits: 2 })} ${unit}`,
              config.value.label,
            ]}
          />
        }
      />
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
              fill={color}
              radius={[4, 4, 0, 0]}
              maxBarSize={50}
            />
          </BarChart>
        )
      case 'area':
        return (
          <AreaChart {...commonProps}>
            {commonAxisProps}
            <defs>
              <linearGradient id="fillGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fill="url(#fillGradient)"
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

function formatDateLabel(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return dateStr

    // Check if it's a quarterly date (YYYY-QN format or YYYY-MM that maps to quarters)
    if (dateStr.includes('Q')) return dateStr

    const month = date.getMonth()
    const year = date.getFullYear()

    // For monthly data, show abbreviated month
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    return `${monthNames[month]} ${year}`
  } catch {
    return dateStr
  }
}
