'use client'

import Link from 'next/link'
import { Home, ChevronRight } from 'lucide-react'

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
        <div className="flex items-center gap-3 h-11">
          {/* Home / Portal button */}
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors flex-shrink-0"
          >
            <Home className="h-4 w-4" />
            <span>Portal</span>
          </Link>

          {/* Separator */}
          <ChevronRight className="h-3.5 w-3.5 text-white/25 flex-shrink-0" />

          {/* Custom Breadcrumb — no shadcn defaults to avoid dark-on-dark */}
          <nav aria-label="breadcrumb" className="flex items-center gap-1.5 min-w-0 overflow-hidden">
            <ol className="flex flex-wrap items-center gap-1.5 text-sm">
              {breadcrumbs.map((item, index) => {
                const isLast = index === breadcrumbs.length - 1
                return (
                  <li key={index} className="inline-flex items-center gap-1.5">
                    {isLast ? (
                      <span className="text-white font-medium truncate">
                        {item.label}
                      </span>
                    ) : (
                      <Link
                        href={item.href || '#'}
                        className="text-white/50 hover:text-white/80 transition-colors truncate"
                      >
                        {item.label}
                      </Link>
                    )}
                    {!isLast && (
                      <ChevronRight className="h-3.5 w-3.5 text-white/25 flex-shrink-0" />
                    )}
                  </li>
                )
              })}
            </ol>
          </nav>
        </div>
      </div>
    </header>
  )
}
