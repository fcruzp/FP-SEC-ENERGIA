'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { motion } from 'framer-motion'

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

interface TrendMoversProps {
  gainers: TrendItem[]
  losers: TrendItem[]
}

export default function TrendMovers({ gainers, losers }: TrendMoversProps) {
  const hasData = gainers.length > 0 || losers.length > 0

  if (!hasData) {
    return (
      <Card className="bg-white dark:bg-[#161b22] border-[#e5e7eb] dark:border-[#30363d] p-6 h-full min-h-[320px] flex items-center justify-center">
        <p className="text-sm text-[#9ca3af] dark:text-[#8b949e]">Sin datos de tendencias</p>
      </Card>
    )
  }

  return (
    <Card className="bg-white dark:bg-[#161b22] border-[#e5e7eb] dark:border-[#30363d] overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex-shrink-0">
        <h3 className="text-sm font-bold text-[#1c1c1e] dark:text-[#e6edf3]">Tendencias</h3>
        <p className="text-[11px] text-[#9ca3af] dark:text-[#8b949e] mt-0.5">Mayores cambios en el período</p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-4">
        {/* Gainers */}
        {gainers.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-1.5 mb-2.5">
              <div className="w-5 h-5 rounded-md bg-[#4ade80]/15 flex items-center justify-center">
                <TrendingUp className="h-3 w-3 text-[#1a6b3c]" />
              </div>
              <span className="text-[11px] font-semibold text-[#1a6b3c] uppercase tracking-wide">Al alza</span>
            </div>
            <div className="space-y-1.5">
              {gainers.map((item, i) => (
                <TrendRow key={item.id} item={item} type="gainer" index={i} />
              ))}
            </div>
          </div>
        )}

        {/* Losers */}
        {losers.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2.5">
              <div className="w-5 h-5 rounded-md bg-red-50 flex items-center justify-center">
                <TrendingDown className="h-3 w-3 text-red-600" />
              </div>
              <span className="text-[11px] font-semibold text-red-600 uppercase tracking-wide">A la baja</span>
            </div>
            <div className="space-y-1.5">
              {losers.map((item, i) => (
                <TrendRow key={item.id} item={item} type="loser" index={i} />
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

function TrendRow({ item, type, index }: { item: TrendItem; type: 'gainer' | 'loser'; index: number }) {
  const isGainer = type === 'gainer'
  const pct = item.change_pct ?? 0
  const absPct = Math.abs(pct)
  const barWidth = Math.min(absPct, 50) / 50 * 100 // Cap at 50% for visual

  const href = item.category_slug
    ? `/observatorio/${item.category_slug}/${item.slug}`
    : '#'

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Link href={href} className="block group cursor-pointer">
        <div className="relative rounded-lg overflow-hidden hover:bg-[#f9fafb] dark:hover:bg-[#21262d] transition-colors py-2 px-2.5 -mx-2.5">
          {/* Background bar */}
          <div
            className="absolute inset-y-0 rounded-lg opacity-[0.07] transition-all duration-500"
            style={{
              [isGainer ? 'left' : 'right']: 0,
              width: `${barWidth}%`,
              backgroundColor: isGainer ? '#1a6b3c' : '#ef4444',
            }}
          />

          <div className="relative flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-[#1c1c1e] dark:text-[#e6edf3] truncate group-hover:text-[#1a6b3c] dark:group-hover:text-[#4ade80] transition-colors leading-tight">
                {item.name}
              </p>
              {item.category_name && (
                <p className="text-[10px] text-[#9ca3af] dark:text-[#8b949e] truncate mt-0.5">
                  {item.category_name}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {item.latest_value !== null && item.latest_value !== undefined && (
                <span className="text-[11px] font-medium text-[#6b7280] dark:text-[#8b949e]">
                  {item.latest_value.toLocaleString('es-DO', { maximumFractionDigits: 1 })}
                  {item.unit && <span className="text-[9px] ml-0.5">{item.unit}</span>}
                </span>
              )}
              <span
                className={`inline-flex items-center text-[11px] font-bold px-1.5 py-0.5 rounded ${
                  isGainer
                    ? 'text-[#1a6b3c] dark:text-[#4ade80] bg-[#4ade80]/10 dark:bg-[#4ade80]/15'
                    : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
                }`}
              >
                {isGainer ? '+' : ''}{pct.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
