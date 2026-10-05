'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export interface BreakdownOption {
  slug: string
  label: string
}

interface BreakdownSelectorProps {
  options: BreakdownOption[]
  value: string
  onChange: (slug: string) => void
}

/** Selector entre el total de un indicador y sus desgloses (por empresa o componente). */
export default function BreakdownSelector({ options, value, onChange }: BreakdownSelectorProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        aria-label="Desglose del indicador"
        className="w-full sm:w-[240px] border-[#e5e7eb] dark:border-[#30363d] dark:bg-[#161b22] dark:text-[#e6edf3] text-sm cursor-pointer"
      >
        <SelectValue placeholder="Desglose" />
      </SelectTrigger>
      <SelectContent>
        {options.map(option => (
          <SelectItem key={option.slug} value={option.slug}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
