'use client'

import { Card } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react'
import { motion } from 'framer-motion'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
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
}: KPICardProps) {
  const isUp = change !== null && change !== undefined && change > 0
  const isDown = change !== null && change !== undefined && change < 0
  const isNeutral = !isUp && !isDown

  const displayValue = value !== null && value !== undefined
    ? typeof value === 'number'
      ? value.toLocaleString('es-DO', { maximumFractionDigits: 2 })
      : value
    : '—'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
    >
      <Card
        className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${
          featured
            ? 'bg-[#0a2e19] border-[#0a2e19] text-white'
            : 'bg-white border-[#e5e7eb]'
        }`}
      >
        <div className="p-5">
          {/* Header row */}
          <div className="flex items-start justify-between mb-4">
            {icon && (
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  featured
                    ? 'bg-white/10 text-white/80'
                    : 'bg-[#1a6b3c]/10 text-[#1a6b3c]'
                }`}
              >
                <CategoryIcon iconName={icon} size={20} />
              </div>
            )}
            {(change !== null && change !== undefined) && (
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                  isUp
                    ? featured
                      ? 'bg-[#4ade80]/20 text-[#4ade80]'
                      : 'bg-[#4ade80]/15 text-[#1a6b3c]'
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
                  : isUp
                  ? '↑'
                  : isDown
                  ? '↓'
                  : '—'}
              </span>
            )}
          </div>

          {/* Value */}
          <div
            className={`text-2xl font-extrabold leading-tight mb-1 ${
              featured ? 'text-white' : 'text-[#1c1c1e]'
            }`}
          >
            {displayValue}
            {unit && (
              <span className="text-base font-semibold ml-1 opacity-70">
                {unit}
              </span>
            )}
          </div>

          {/* Label */}
          <div
            className={`text-xs font-medium flex items-center gap-1 ${
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

          {/* Progress bar */}
          <div
            className={`h-1 rounded-full mt-4 overflow-hidden ${
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
      </Card>
    </motion.div>
  )
}
