'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import type { IndicatorWithData } from '@/lib/supabase-types'
import SparklineChart from './SparklineChart'

interface IndicatorCardProps {
  indicator: IndicatorWithData
  categorySlug: string
  index?: number
}

const frequencyLabels: Record<string, string> = {
  daily: 'Diario',
  weekly: 'Semanal',
  monthly: 'Mensual',
  quarterly: 'Trimestral',
  yearly: 'Anual',
}

export default function IndicatorCard({
  indicator,
  categorySlug,
  index = 0,
}: IndicatorCardProps) {
  const isUp = indicator.change !== null && indicator.change > 0
  const isDown = indicator.change !== null && indicator.change < 0
  const hasData = indicator.latest_value !== null && indicator.latest_value !== undefined

  const displayValue = hasData
    ? indicator.latest_value!.toLocaleString('es-DO', { maximumFractionDigits: 2 })
    : null

  // Prepare sparkline data (last 12 data points)
  const sparklineData = indicator.data_points
    ? indicator.data_points.slice(-12).map((dp) => ({
        date: dp.date,
        value: dp.value,
      }))
    : []

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
    >
      <Link href={`/observatorio/${categorySlug}/${indicator.slug}`}>
        <Card className="group relative overflow-hidden border-[#e5e7eb] dark:border-[#30363d] bg-white dark:bg-[#161b22] hover:border-[#2d9e5f] dark:hover:border-[#4ade80] hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 cursor-pointer">
          <div className="p-5">
            {/* Top row: name + frequency */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <h3 className="text-sm font-semibold text-[#1c1c1e] dark:text-[#e6edf3] leading-tight line-clamp-2 flex-1">
                {indicator.name}
              </h3>
              <Badge
                variant="secondary"
                className="shrink-0 text-[10px] font-semibold uppercase tracking-wide bg-[#f4f6f4] dark:bg-[#161b22] text-[#6b7280] dark:text-[#8b949e] border-0"
              >
                {frequencyLabels[indicator.frequency] || indicator.frequency}
              </Badge>
            </div>

            {/* Value row */}
            <div className="flex items-end justify-between gap-3 mb-3">
              <div>
                {hasData ? (
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-extrabold text-[#1c1c1e] dark:text-[#e6edf3]">
                      {displayValue}
                    </span>
                    {indicator.unit && (
                      <span className="text-sm font-medium text-[#6b7280] dark:text-[#8b949e]">
                        {indicator.unit}
                      </span>
                    )}
                  </div>
                ) : (
                  <Badge
                    variant="outline"
                    className="text-[10px] font-semibold text-[#6b7280] dark:text-[#8b949e] border-[#e5e7eb] dark:border-[#30363d]"
                  >
                    Sin datos
                  </Badge>
                )}

                {/* Change badge */}
                {indicator.change_pct !== null && indicator.change_pct !== undefined && (
                  <span
                    className={`inline-flex items-center gap-1 mt-1.5 text-xs font-semibold ${
                      isUp
                        ? 'text-[#1a6b3c] dark:text-[#4ade80]'
                        : isDown
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-[#6b7280] dark:text-[#8b949e]'
                    }`}
                  >
                    {isUp && <TrendingUp className="h-3 w-3" />}
                    {isDown && <TrendingDown className="h-3 w-3" />}
                    {!isUp && !isDown && <Minus className="h-3 w-3" />}
                    {isUp ? '+' : ''}
                    {indicator.change_pct.toFixed(1)}%
                  </span>
                )}
              </div>

              {/* Sparkline */}
              {sparklineData.length > 1 && (
                <div className="w-24 h-10 shrink-0">
                  <SparklineChart
                    data={sparklineData}
                    color={isDown ? '#ef4444' : '#1a6b3c'}
                  />
                </div>
              )}
            </div>

            {/* Arrow indicator on hover */}
            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-1 group-hover:translate-x-0">
              <ArrowRight className="h-4 w-4 text-[#2d9e5f] dark:text-[#4ade80]" />
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  )
}
