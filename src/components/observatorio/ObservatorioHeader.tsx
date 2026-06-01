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
import { Home } from 'lucide-react'

interface BreadcrumbItemData {
  label: string
  href?: string
}

interface ObservatorioHeaderProps {
  breadcrumbs: BreadcrumbItemData[]
}

export default function ObservatorioHeader({
  breadcrumbs,
}: ObservatorioHeaderProps) {

  return (
    <header className="bg-[#0a2e19] sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-10">
          {/* Home / Portal button */}
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition-colors"
          >
            <Home className="h-3.5 w-3.5" />
            <span>Portal</span>
          </Link>

          {/* Breadcrumb */}
          <Breadcrumb>
            <BreadcrumbList className="text-xs">
              {breadcrumbs.map((item, index) => {
                const isLast = index === breadcrumbs.length - 1
                return (
                  <span key={index} className="contents">
                    <BreadcrumbItem>
                      {isLast ? (
                        <BreadcrumbPage className="text-white/90 font-medium text-xs">
                          {item.label}
                        </BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink
                          asChild
                          className="text-white/50 hover:text-white/80 text-xs"
                        >
                          <Link href={item.href || '#'}>{item.label}</Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                    {!isLast && <BreadcrumbSeparator className="text-white/25" />}
                  </span>
                )
              })}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>
    </header>
  )
}
