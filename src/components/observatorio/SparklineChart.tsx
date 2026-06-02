'use client'

import {
  LineChart,
  Line,
  ResponsiveContainer,
} from 'recharts'

interface SparklineChartProps {
  data: { date: string; value: number }[]
  color?: string
  height?: number
}

export default function SparklineChart({
  data,
  color = '#1a6b3c',
  height = 40,
}: SparklineChartProps) {
  if (!data || data.length < 2) return null

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
