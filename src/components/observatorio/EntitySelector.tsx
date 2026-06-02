'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Entity } from '@/lib/supabase-types'

interface EntitySelectorProps {
  entities: Entity[]
  value?: string
  onChange: (value: string) => void
}

const entityLabels: Record<string, string> = {
  distribuidora: 'Distribuidora',
  generadora: 'Generadora',
  transmisora: 'Transmisora',
  comercializadora: 'Comercializadora',
  generadora_privada: 'Gen. Privada',
  regulador: 'Regulador',
}

export default function EntitySelector({
  entities,
  value,
  onChange,
}: EntitySelectorProps) {
  // Group entities by type
  const grouped = entities.reduce<Record<string, Entity[]>>((acc, entity) => {
    const type = entity.type || 'otro'
    if (!acc[type]) acc[type] = []
    acc[type].push(entity)
    return acc
  }, {})

  return (
    <Select value={value || 'all'} onValueChange={onChange}>
      <SelectTrigger className="w-full sm:w-[200px] border-[#e5e7eb] dark:border-[#30363d] dark:bg-[#161b22] dark:text-[#e6edf3] text-sm cursor-pointer">
        <SelectValue placeholder="Todas las entidades" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todas las entidades</SelectItem>
        {Object.entries(grouped).map(([type, items]) => (
          <span key={type} className="contents">
            {items.map((entity) => (
              <SelectItem key={entity.id} value={entity.slug}>
                {entity.name}
              </SelectItem>
            ))}
          </span>
        ))}
      </SelectContent>
    </Select>
  )
}
