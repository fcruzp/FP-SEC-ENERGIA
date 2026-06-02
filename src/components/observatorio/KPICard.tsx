'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Minus, Info, ArrowUpRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  AreaChart,
  Area,
  ResponsiveContainer,
} from 'recharts'
import CategoryIcon from './CategoryIcon'

interface KPICardProps {
  title: string
  value: number | string | null
  unit?: string
  change?: number | null
  changePct?: number | null
  icon?: string
  label?: string
  description?: string | null
  featured?: boolean
  index?: number
  categorySlug?: string
  indicatorSlug?: string
  sparklineData?: { date: string; value: number }[]
}

export default function KPICard({
  title,
  value,
  unit,
  change,
  changePct,
  icon,
  label,
  description,
  featured = false,
  index = 0,
  categorySlug,
  indicatorSlug,
  sparklineData,
}: KPICardProps) {
  const isUp = change !== null && change !== undefined && change > 0
  const isDown = change !== null && change !== undefined && change < 0
  const isNeutral = !isUp && !isDown

  const displayValue = value !== null && value !== undefined
    ? typeof value === 'number'
      ? value.toLocaleString('es-DO', { maximumFractionDigits: 2 })
      : value
    : '—'

  const hasSparkline = sparklineData && sparklineData.length >= 2
  const href = categorySlug && indicatorSlug
    ? `/observatorio/${categorySlug}/${indicatorSlug}`
    : '#'

  const isLink = categorySlug && indicatorSlug

  const content = (
    <Card
      className={`relative overflow-hidden transition-all duration-300 ${
        isLink ? 'hover:shadow-lg hover:-translate-y-0.5 cursor-pointer' : ''
      } ${
        featured
          ? 'bg-gradient-to-br from-[#0a2e19] via-[#0f3d20] to-[#1a6b3c] border-[#0a2e19] text-white shadow-lg shadow-[#0a2e19]/20'
          : 'bg-white border-[#e5e7eb]'
      }`}
    >
      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {icon && (
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  featured
                    ? 'bg-white/10 text-white/80'
                    : 'bg-[#1a6b3c]/8 text-[#1a6b3c]'
                }`}
              >
                <CategoryIcon iconName={icon} size={18} />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div
                className={`text-[11px] font-medium flex items-center gap-1 leading-tight ${
                  featured ? 'text-white/60' : 'text-[#6b7280]'
                }`}
              >
                <span className="truncate">{title || label}</span>
                {description && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className={`h-3 w-3 flex-shrink-0 cursor-help transition-colors ${
                          featured ? 'text-white/30 hover:text-white/60' : 'text-[#9ca3af] hover:text-[#6b7280]'
                        }`} />
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-[260px] text-xs leading-relaxed">
                        {description}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>
          </div>

          {(change !== null && change !== undefined) && (
            <span
              className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold flex-shrink-0 ${
                isUp
                  ? featured
                    ? 'bg-[#4ade80]/20 text-[#4ade80]'
                    : 'bg-[#4ade80]/12 text-[#1a6b3c]'
                  : isDown
                  ? featured
                    ? 'bg-red-400/20 text-red-300'
                    : 'bg-red-50 text-red-600'
                  : featured
                  ? 'bg-white/10 text-white/60'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {isUp && <TrendingUp className="h-3 w-3" />}
              {isDown && <TrendingDown className="h-3 w-3" />}
              {isNeutral && <Minus className="h-3 w-3" />}
              {changePct !== null && changePct !== undefined
                ? `${isUp ? '+' : ''}${changePct.toFixed(1)}%`
                : isUp ? '↑' : isDown ? '↓' : '—'}
            </span>
          )}
        </div>

        {/* Value + Sparkline row */}
        <div className="flex items-end justify-between gap-3">
          <div>
            <div
              className={`text-2xl font-extrabold leading-tight ${
                featured ? 'text-white' : 'text-[#1c1c1e]'
              }`}
            >
              {displayValue}
              {unit && (
                <span className={`text-sm font-semibold ml-1 ${
                  featured ? 'text-white/60' : 'text-[#6b7280]'
                }`}>
                  {unit}
                </span>
              )}
            </div>
          </div>

          {/* Sparkline */}
          {hasSparkline && (
            <div className="w-24 h-10 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparklineData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
                  <defs>
                    <linearGradient id={`sparkGrad-${index}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={featured ? '#4ade80' : (isDown ? '#ef4444' : '#1a6b3c')} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={featured ? '#4ade80' : (isDown ? '#ef4444' : '#1a6b3c')} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={featured ? '#4ade80' : (isDown ? '#ef4444' : '#1a6b3c')}
                    strokeWidth={1.5}
                    fill={`url(#sparkGrad-${index})`}
                    dot={false}
                    isAnimationActive={true}
                    animationDuration={800}
                    animationBegin={200 + index * 100}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div
          className={`h-0.5 rounded-full mt-3 overflow-hidden ${
            featured ? 'bg-white/10' : 'bg-[#e5e7eb]'
          }`}
        >
          <motion.div
            className={`h-full rounded-full ${
              featured ? 'bg-[#4ade80]' : 'bg-[#1a6b3c]'
            }`}
            initial={{ width: 0 }}
            animate={{
              width: changePct
                ? `${Math.min(Math.abs(changePct), 100)}%`
                : '50%',
            }}
            transition={{ duration: 1.2, delay: 0.3 + index * 0.08 }}
          />
        </div>
      </div>

      {/* Hover arrow indicator */}
      {isLink && (
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-200">
          <ArrowUpRight className={`h-3.5 w-3.5 ${featured ? 'text-white/40' : 'text-[#9ca3af]'}`} />
        </div>
      )}
    </Card>
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="group"
    >
      {isLink ? (
        <Link href={href}>{content}</Link>
      ) : (
        content
      )}
    </motion.div>
  )
}
