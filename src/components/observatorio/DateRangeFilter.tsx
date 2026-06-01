'use client'

import { Button } from '@/components/ui/button'
import { useState } from 'react'

interface DateRangeFilterProps {
  onRangeChange: (range: { from?: string; to?: string } | null) => void
}

type RangeKey = '1y' | '3y' | '5y' | 'all'

const ranges: { key: RangeKey; label: string }[] = [
  { key: '1y', label: '1 Año' },
  { key: '3y', label: '3 Años' },
  { key: '5y', label: '5 Años' },
  { key: 'all', label: 'Todo' },
]

export default function DateRangeFilter({ onRangeChange }: DateRangeFilterProps) {
  const [active, setActive] = useState<RangeKey>('all')

  const handleRangeClick = (key: RangeKey) => {
    setActive(key)

    if (key === 'all') {
      onRangeChange(null)
      return
    }

    const now = new Date()
    const from = new Date(now)

    switch (key) {
      case '1y':
        from.setFullYear(now.getFullYear() - 1)
        break
      case '3y':
        from.setFullYear(now.getFullYear() - 3)
        break
      case '5y':
        from.setFullYear(now.getFullYear() - 5)
        break
    }

    onRangeChange({
      from: from.toISOString().split('T')[0],
      to: now.toISOString().split('T')[0],
    })
  }

  return (
    <div className="flex items-center gap-1.5">
      {ranges.map(({ key, label }) => (
        <Button
          key={key}
          variant={active === key ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleRangeClick(key)}
          className={
            active === key
              ? 'bg-[#1a6b3c] hover:bg-[#2d9e5f] text-white text-xs h-8'
              : 'border-[#e5e7eb] text-[#6b7280] hover:text-[#1a6b3c] hover:border-[#1a6b3c] text-xs h-8'
          }
        >
          {label}
        </Button>
      ))}
    </div>
  )
}
