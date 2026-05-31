'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { Suspense, useEffect } from 'react'
import {
  LayoutDashboard,
  Upload,
  BarChart3,
  Database,
  Zap,
  ArrowLeft,
  Settings,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/admin/observatorio', tab: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/observatorio?tab=upload', tab: 'upload', label: 'Cargar Datos', icon: Upload },
  { href: '/admin/observatorio?tab=indicators', tab: 'indicators', label: 'Indicadores', icon: BarChart3 },
  { href: '/admin/observatorio?tab=data', tab: 'data', label: 'Datos', icon: Database },
]

function AdminSidebar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab') || 'dashboard'

  return (
    <aside className="hidden md:flex w-64 flex-col bg-[#0d1f3c] border-r border-white/[0.06] flex-shrink-0">
      {/* Logo / Header */}
      <div className="p-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-white text-sm font-bold leading-tight">Observatorio</div>
            <div className="text-emerald-400/80 text-[10px] font-medium uppercase tracking-widest">Energético</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          Administración
        </div>
        {navItems.map((item) => {
          const isActive = pathname === '/admin/observatorio' && currentTab === item.tab
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-white/[0.06] space-y-1">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-white/[0.04] hover:text-slate-200 transition-all duration-200"
        >
          <ArrowLeft className="w-4 h-4 flex-shrink-0" />
          Volver al Portal
        </Link>
        <Link
          href="#"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-white/[0.04] hover:text-slate-200 transition-all duration-200"
        >
          <Settings className="w-4 h-4 flex-shrink-0" />
          Configuración
        </Link>
      </div>
    </aside>
  )
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Add admin-layout class to body so portal CSS (body:not(.admin-layout)) doesn't leak
  useEffect(() => {
    document.body.classList.add('admin-layout')
    return () => {
      document.body.classList.remove('admin-layout')
    }
  }, [])

  return (
    <div className="admin-layout dark min-h-screen flex bg-[#0a1628]">
      {/* Sidebar */}
      <Suspense
        fallback={
          <aside className="hidden md:flex w-64 flex-col bg-[#0d1f3c] border-r border-white/[0.06] flex-shrink-0 items-center justify-center">
            <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
          </aside>
        }
      >
        <AdminSidebar />
      </Suspense>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#0d1f3c] border-b border-white/[0.06] px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="text-white text-sm font-bold leading-tight">Observatorio Energético</div>
          <div className="text-emerald-400/80 text-[9px] font-medium uppercase tracking-widest">Panel Admin</div>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 min-h-screen md:ml-0">
        <div className="md:hidden h-14" /> {/* Spacer for mobile top bar */}
        {children}
      </main>
    </div>
  )
}
