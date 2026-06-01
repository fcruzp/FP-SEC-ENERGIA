'use client'

import Link from 'next/link'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { BarChart3, Home } from 'lucide-react'
import CategoryIcon from './CategoryIcon'

interface BreadcrumbItemData {
  label: string
  href?: string
}

interface ObservatorioHeaderProps {
  breadcrumbs: BreadcrumbItemData[]
  title?: string
  description?: string
  icon?: string
}

export default function ObservatorioHeader({
  breadcrumbs,
  title,
  description,
  icon,
}: ObservatorioHeaderProps) {

  return (
    <header className="border-b border-[#e5e7eb] bg-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top bar */}
        <div className="flex items-center justify-between h-14">
          <Link
            href="/observatorio"
            className="flex items-center gap-2 text-sm font-medium text-[#6b7280] hover:text-[#1a6b3c] transition-colors"
          >
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Observatorio Energético</span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-[#6b7280] hover:text-[#1a6b3c] transition-colors"
          >
            <Home className="h-3.5 w-3.5" />
            <span>Portal</span>
          </Link>
        </div>

        {/* Breadcrumb */}
        <div className="pb-3">
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs.map((item, index) => {
                const isLast = index === breadcrumbs.length - 1
                return (
                  <span key={index} className="contents">
                    <BreadcrumbItem>
                      {isLast ? (
                        <BreadcrumbPage className="text-[#1a6b3c] font-medium">
                          {item.label}
                        </BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink
                          asChild
                          className="text-[#6b7280] hover:text-[#1a6b3c]"
                        >
                          <Link href={item.href || '#'}>{item.label}</Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                    {!isLast && <BreadcrumbSeparator className="text-[#d1d5db]" />}
                  </span>
                )
              })}
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Title section */}
        {(title || description) && (
          <div className="pb-5">
            <div className="flex items-center gap-3">
              {icon && (
                <span className="text-[#1a6b3c]">
                  <CategoryIcon iconName={icon} size={24} />
                </span>
              )}
              {title && (
                <h1 className="text-xl sm:text-2xl font-bold text-[#1c1c1e]">
                  {title}
                </h1>
              )}
            </div>
            {description && (
              <p className="mt-2 text-sm text-[#6b7280] max-w-2xl leading-relaxed">
                {description}
              </p>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
