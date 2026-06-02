'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Home, ChevronRight } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'

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
    <header className="bg-[#0a2e19] dark:bg-[#071d10] sticky top-0 z-40 border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 h-12">
          {/* FP Logo */}
          <Link
            href="/"
            className="flex-shrink-0 cursor-pointer"
            title="Fuerza del Pueblo · Secretaría de Energía"
          >
            <Image
              src="/fp-logo.png"
              alt="Fuerza del Pueblo"
              width={32}
              height={32}
              className="h-7 w-7 sm:h-8 sm:w-8 rounded-full ring-1 ring-white/10"
              priority
            />
          </Link>

          {/* Separator after logo */}
          <div className="w-px h-5 bg-white/15 flex-shrink-0" />

          {/* Home / Portal button */}
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors flex-shrink-0 cursor-pointer"
          >
            <Home className="h-4 w-4" />
            <span>Portal</span>
          </Link>

          {/* Separator */}
          <ChevronRight className="h-3.5 w-3.5 text-white/25 flex-shrink-0" />

          {/* Custom Breadcrumb — no shadcn defaults to avoid dark-on-dark */}
          <nav aria-label="breadcrumb" className="flex items-center gap-1.5 min-w-0 overflow-hidden flex-1">
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
                        className="text-white/50 hover:text-white/80 transition-colors truncate cursor-pointer"
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

          {/* Theme toggle */}
          <div className="flex-shrink-0">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  )
}
