'use client'

import {
  TrendingUp,
  Building2,
  Factory,
  Droplets,
  Cable,
  Flame,
  BarChart3,
  AlertTriangle,
  Receipt,
  FileText,
  Zap,
  Activity,
  type LucideIcon,
} from 'lucide-react'

const iconMap: Record<string, LucideIcon> = {
  TrendingUp,
  Building2,
  Factory,
  Droplets,
  Cable,
  Flame,
  BarChart3,
  AlertTriangle,
  Receipt,
  FileText,
  Zap,
  Activity,
}

interface CategoryIconProps {
  iconName: string | null
  className?: string
  size?: number
}

export default function CategoryIcon({ iconName, className, size = 20 }: CategoryIconProps) {
  if (!iconName) {
    return <BarChart3 className={className} size={size} />
  }

  const IconComponent = iconMap[iconName]

  if (!IconComponent) {
    // If it's an emoji or unknown, render as text
    if (iconName.length <= 4) {
      return <span className={className} style={{ fontSize: size }}>{iconName}</span>
    }
    return <BarChart3 className={className} size={size} />
  }

  return <IconComponent className={className} size={size} />
}

export { iconMap }
