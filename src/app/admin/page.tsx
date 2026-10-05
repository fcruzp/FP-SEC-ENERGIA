'use client'

import { formatDateOnly, toDateOnly } from '@/lib/dates'
import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  LayoutDashboard,
  Upload,
  BarChart3,
  Database,
  TrendingUp,
  Hash,
  Building2,
  FolderOpen,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  RefreshCw,
  CalendarDays,
  Clock,
  Zap,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import EditionUpload from '@/components/admin/EditionUpload'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { CategoryWithIndicators, Indicator } from '@/lib/supabase-types'

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────
interface DashboardStats {
  totalCategories: number
  totalIndicators: number
  totalEntities: number
  totalDataPoints: number
}

interface RecentDataPoint {
  id: string
  value: number
  date: string
  period_type: string
  source_file: string | null
  is_estimated: boolean
  created_at: string
  indicator: { id: string; name: string; unit: string; slug: string } | null
  entity: { id: string; name: string; slug: string } | null
}

type UploadStatus = 'idle' | 'uploading' | 'processing' | 'success' | 'error'

// ──────────────────────────────────────────────
// Stat Card Component
// ──────────────────────────────────────────────
function StatCard({
  title,
  value,
  icon: Icon,
  subtitle,
  color,
}: {
  title: string
  value: number | string
  icon: React.ElementType
  subtitle?: string
  color: 'emerald' | 'cyan' | 'amber' | 'rose'
}) {
  const colorMap = {
    emerald: {
      bg: 'bg-emerald-500/10',
      icon: 'text-emerald-400',
      border: 'border-emerald-500/20',
    },
    cyan: {
      bg: 'bg-cyan-500/10',
      icon: 'text-cyan-400',
      border: 'border-cyan-500/20',
    },
    amber: {
      bg: 'bg-amber-500/10',
      icon: 'text-amber-400',
      border: 'border-amber-500/20',
    },
    rose: {
      bg: 'bg-rose-500/10',
      icon: 'text-rose-400',
      border: 'border-rose-500/20',
    },
  }
  const c = colorMap[color]

  return (
    <Card className={`bg-[#0d1f3c] border-white/[0.06] ${c.border}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {title}
          </CardTitle>
          <div className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center`}>
            <Icon className={`w-4.5 h-4.5 ${c.icon}`} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-extrabold text-white tracking-tight">{value}</div>
        {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  )
}

// ──────────────────────────────────────────────
// Main Page Component
// ──────────────────────────────────────────────
function ObservatorioAdminContent() {
  const searchParams = useSearchParams()
  const defaultTab = searchParams.get('tab') || 'dashboard'

  // ── State ──
  const [stats, setStats] = useState<DashboardStats>({
    totalCategories: 0,
    totalIndicators: 0,
    totalEntities: 0,
    totalDataPoints: 0,
  })
  const [statsLoading, setStatsLoading] = useState(true)

  const [categories, setCategories] = useState<CategoryWithIndicators[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)

  const [recentData, setRecentData] = useState<RecentDataPoint[]>([])
  const [recentDataLoading, setRecentDataLoading] = useState(true)
  const [recentDataTotal, setRecentDataTotal] = useState(0)



  // ── Data Fetching ──
  const fetchStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const [catRes, indRes, entRes, dpRes] = await Promise.all([
        fetch('/api/observatorio/categories'),
        fetch('/api/observatorio/indicators?parent_only=true'),
        fetch('/api/observatorio/entities'),
        fetch('/api/admin/recent-data-points?limit=1'),
      ])

      const catData = await catRes.json()
      const indData = await indRes.json()
      const entData = await entRes.json()
      const dpData = await dpRes.json()

      setStats({
        totalCategories: catData.categories?.length ?? 0,
        totalIndicators: indData.indicators?.length ?? 0,
        totalEntities: entData.entities?.length ?? 0,
        totalDataPoints: dpData.total_count ?? 0,
      })
    } catch (err) {
      console.error('Error fetching stats:', err)
    } finally {
      setStatsLoading(false)
    }
  }, [])

  const fetchCategories = useCallback(async () => {
    setCategoriesLoading(true)
    try {
      const res = await fetch('/api/observatorio/categories?with_indicators=true')
      const data = await res.json()
      setCategories(data.categories ?? [])
    } catch (err) {
      console.error('Error fetching categories:', err)
    } finally {
      setCategoriesLoading(false)
    }
  }, [])

  const fetchRecentData = useCallback(async () => {
    setRecentDataLoading(true)
    try {
      const res = await fetch('/api/admin/recent-data-points?limit=20')
      const data = await res.json()
      setRecentData(data.data_points ?? [])
      setRecentDataTotal(data.total_count ?? 0)
    } catch (err) {
      console.error('Error fetching recent data:', err)
    } finally {
      setRecentDataLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
    fetchCategories()
    fetchRecentData()
  }, [fetchStats, fetchCategories, fetchRecentData])

  // ── Helpers ──
  const formatNumber = (n: number) =>
    new Intl.NumberFormat('es-DO').format(n)

  const formatDate = (d: string) =>
    formatDateOnly(d, { year: 'numeric', month: 'short' })

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const chartTypeLabels: Record<string, string> = {
    line: 'Línea',
    bar: 'Barras',
    pie: 'Torta',
    area: 'Área',
    gauge: 'Medidor',
    sparkline: 'Sparkline',
  }

  // ── Mobile Nav Tabs ──
  const mobileNavItems = [
    { value: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { value: 'upload', label: 'Cargar', icon: Upload },
    { value: 'indicators', label: 'Indicadores', icon: BarChart3 },
    { value: 'data', label: 'Datos', icon: Database },
  ]

  return (
    <div className="min-h-screen">
      <Tabs defaultValue={defaultTab} className="flex flex-col h-full">
        {/* Mobile tab navigation */}
        <div className="md:hidden px-4 pt-2">
          <TabsList className="w-full bg-[#0d1f3c] border border-white/[0.06] h-auto p-1">
            {mobileNavItems.map((item) => (
              <TabsTrigger
                key={item.value}
                value={item.value}
                className="flex-1 flex-col items-center gap-1 py-2 text-[10px] data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400"
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* ═══════════════════════════════════════════════
           TAB: Dashboard
           ═══════════════════════════════════════════════ */}
        <TabsContent value="dashboard" className="flex-1 p-4 md:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                Panel de Control
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Resumen general del Observatorio Energético
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Categorías"
                value={statsLoading ? '—' : formatNumber(stats.totalCategories)}
                icon={FolderOpen}
                subtitle="Categorías de indicadores"
                color="emerald"
              />
              <StatCard
                title="Indicadores"
                value={statsLoading ? '—' : formatNumber(stats.totalIndicators)}
                icon={TrendingUp}
                subtitle="Indicadores principales"
                color="cyan"
              />
              <StatCard
                title="Entidades"
                value={statsLoading ? '—' : formatNumber(stats.totalEntities)}
                icon={Building2}
                subtitle="Entidades del sector"
                color="amber"
              />
              <StatCard
                title="Datos"
                value={statsLoading ? '—' : formatNumber(stats.totalDataPoints)}
                icon={Hash}
                subtitle="Puntos de datos totales"
                color="rose"
              />
            </div>

            {/* Recent Data Points Quick View */}
            <Card className="bg-[#0d1f3c] border-white/[0.06]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                    <Database className="w-4 h-4 text-cyan-400" />
                    Últimos Datos Cargados
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={fetchRecentData}
                    className="text-slate-400 hover:text-white h-7 text-xs"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Actualizar
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {recentDataLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
                    <span className="ml-3 text-slate-400 text-sm">Cargando datos...</span>
                  </div>
                ) : recentData.length === 0 ? (
                  <div className="text-center py-12">
                    <Database className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">No hay datos cargados aún</p>
                    <p className="text-slate-500 text-xs mt-1">
                      Utiliza la pestaña &quot;Cargar Datos&quot; para importar archivos XLS
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="max-h-80">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/[0.06] hover:bg-transparent">
                          <TableHead className="text-slate-400 text-xs">Indicador</TableHead>
                          <TableHead className="text-slate-400 text-xs">Entidad</TableHead>
                          <TableHead className="text-slate-400 text-xs text-right">Valor</TableHead>
                          <TableHead className="text-slate-400 text-xs">Fecha</TableHead>
                          <TableHead className="text-slate-400 text-xs hidden md:table-cell">Fuente</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentData.slice(0, 5).map((dp) => (
                          <TableRow key={dp.id} className="border-white/[0.04]">
                            <TableCell className="text-slate-200 text-xs font-medium">
                              {dp.indicator?.name ?? '—'}
                            </TableCell>
                            <TableCell className="text-slate-400 text-xs">
                              {dp.entity?.name ?? '—'}
                            </TableCell>
                            <TableCell className="text-emerald-400 text-xs font-semibold text-right">
                              {typeof dp.value === 'number' ? dp.value.toLocaleString('es-DO') : dp.value}
                            </TableCell>
                            <TableCell className="text-slate-400 text-xs">
                              {formatDate(dp.date)}
                            </TableCell>
                            <TableCell className="text-slate-500 text-xs hidden md:table-cell">
                              {dp.source_file || '—'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══════════════════════════════════════════════
           TAB: Upload
           ═══════════════════════════════════════════════ */}
        <TabsContent value="upload" className="flex-1 p-4 md:p-8">
          <div className="max-w-3xl mx-auto space-y-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                Cargar edición del MEM
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Cada edición mensual del Informe de Desempeño trae toda la historia; se validan sus 11 hojas antes de cargar.
              </p>
            </div>
            <EditionUpload onLoaded={() => { fetchStats(); fetchRecentData() }} />
          </div>
        </TabsContent>

        {/* ═══════════════════════════════════════════════
           TAB: Indicators Browser
           ═══════════════════════════════════════════════ */}
        <TabsContent value="indicators" className="flex-1 p-4 md:p-8">
          <div className="max-w-5xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                  Categorías e Indicadores
                </h1>
                <p className="text-slate-400 text-sm mt-1">
                  {categoriesLoading
                    ? 'Cargando...'
                    : `${categories.length} categorías con ${categories.reduce((a, c) => a + (c.indicators?.length ?? 0), 0)} indicadores`}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchCategories}
                className="border-white/[0.1] text-slate-300 hover:bg-white/[0.04] h-8"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1" />
                Actualizar
              </Button>
            </div>

            {/* Categories Accordion */}
            {categoriesLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
                <span className="ml-3 text-slate-400 text-sm">Cargando categorías...</span>
              </div>
            ) : categories.length === 0 ? (
              <Card className="bg-[#0d1f3c] border-white/[0.06]">
                <CardContent className="py-16 text-center">
                  <FolderOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400 text-sm">No hay categorías configuradas</p>
                  <p className="text-slate-500 text-xs mt-1">
                    Las categorías se crean al importar datos XLS
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Accordion type="multiple" className="space-y-3">
                {categories.map((cat) => (
                  <AccordionItem
                    key={cat.id}
                    value={cat.id}
                    className="bg-[#0d1f3c] border border-white/[0.06] rounded-xl overflow-hidden px-0"
                  >
                    <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-white/[0.02]">
                      <div className="flex items-center gap-3 flex-1">
                        <div
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: cat.color || '#10b981' }}
                        />
                        <div className="flex-1 text-left">
                          <span className="text-white font-semibold text-sm">{cat.name}</span>
                          {cat.description && (
                            <p className="text-slate-500 text-xs mt-0.5">{cat.description}</p>
                          )}
                        </div>
                        <Badge
                          variant="secondary"
                          className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] font-semibold mr-2"
                        >
                          {cat.indicator_count} indicadores
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-5 pb-4">
                      {cat.indicators && cat.indicators.length > 0 ? (
                        <div className="space-y-1 mt-2">
                          {/* Table header */}
                          <div className="grid grid-cols-12 gap-2 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                            <div className="col-span-4">Nombre</div>
                            <div className="col-span-2">Unidad</div>
                            <div className="col-span-2">Gráfico</div>
                            <div className="col-span-2">Frecuencia</div>
                            <div className="col-span-2">Tipo</div>
                          </div>
                          {/* Indicator rows */}
                          {cat.indicators.map((ind: Indicator) => (
                            <div
                              key={ind.id}
                              className="grid grid-cols-12 gap-2 px-3 py-2.5 rounded-lg hover:bg-white/[0.03] transition-colors items-center"
                            >
                              <div className="col-span-4 text-slate-200 text-xs font-medium truncate">
                                {ind.name}
                              </div>
                              <div className="col-span-2 text-slate-400 text-xs">
                                {ind.unit || '—'}
                              </div>
                              <div className="col-span-2">
                                <Badge
                                  variant="outline"
                                  className="text-[10px] border-white/[0.08] text-slate-400 h-5"
                                >
                                  {chartTypeLabels[ind.chart_type] || ind.chart_type}
                                </Badge>
                              </div>
                              <div className="col-span-2 text-slate-400 text-xs capitalize">
                                {ind.frequency}
                              </div>
                              <div className="col-span-2">
                                {ind.is_breakdown ? (
                                  <Badge className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/20 h-5">
                                    Desglose
                                  </Badge>
                                ) : (
                                  <Badge className="text-[10px] bg-cyan-500/10 text-cyan-400 border-cyan-500/20 h-5">
                                    Principal
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-500 text-xs py-4 text-center">
                          No hay indicadores en esta categoría
                        </p>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>
        </TabsContent>

        {/* ═══════════════════════════════════════════════
           TAB: Data Points
           ═══════════════════════════════════════════════ */}
        <TabsContent value="data" className="flex-1 p-4 md:p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                  Datos Recientes
                </h1>
                <p className="text-slate-400 text-sm mt-1">
                  {recentDataLoading
                    ? 'Cargando...'
                    : `${formatNumber(recentDataTotal)} puntos de datos en total`}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchRecentData}
                className="border-white/[0.1] text-slate-300 hover:bg-white/[0.04] h-8"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1" />
                Actualizar
              </Button>
            </div>

            {/* Data Table */}
            <Card className="bg-[#0d1f3c] border-white/[0.06]">
              <CardContent className="p-0">
                {recentDataLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
                    <span className="ml-3 text-slate-400 text-sm">Cargando datos...</span>
                  </div>
                ) : recentData.length === 0 ? (
                  <div className="text-center py-16">
                    <Database className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400 text-sm">No hay datos cargados</p>
                    <p className="text-slate-500 text-xs mt-1">
                      Los datos aparecerán aquí después de cargar archivos XLS
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="max-h-[600px]">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/[0.06] hover:bg-transparent">
                          <TableHead className="text-slate-400 text-xs">Indicador</TableHead>
                          <TableHead className="text-slate-400 text-xs">Entidad</TableHead>
                          <TableHead className="text-slate-400 text-xs text-right">Valor</TableHead>
                          <TableHead className="text-slate-400 text-xs">Fecha</TableHead>
                          <TableHead className="text-slate-400 text-xs">Período</TableHead>
                          <TableHead className="text-slate-400 text-xs hidden md:table-cell">Archivo Fuente</TableHead>
                          <TableHead className="text-slate-400 text-xs hidden lg:table-cell">Creado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentData.map((dp) => (
                          <TableRow key={dp.id} className="border-white/[0.04]">
                            <TableCell className="text-slate-200 text-xs font-medium max-w-[180px] truncate">
                              {dp.indicator?.name ?? '—'}
                              {dp.is_estimated && (
                                <Badge className="ml-1.5 text-[9px] bg-amber-500/10 text-amber-400 border-amber-500/20 h-4 px-1">
                                  Est.
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-slate-400 text-xs">
                              {dp.entity?.name ?? '—'}
                            </TableCell>
                            <TableCell className="text-emerald-400 text-xs font-semibold text-right tabular-nums">
                              {typeof dp.value === 'number' ? dp.value.toLocaleString('es-DO', { maximumFractionDigits: 2 }) : dp.value}
                            </TableCell>
                            <TableCell className="text-slate-300 text-xs">
                              {formatDate(dp.date)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className="text-[10px] border-white/[0.08] text-slate-400 h-5 capitalize"
                              >
                                {dp.period_type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-slate-500 text-xs hidden md:table-cell max-w-[150px] truncate">
                              {dp.source_file || '—'}
                            </TableCell>
                            <TableCell className="text-slate-500 text-xs hidden lg:table-cell">
                              {formatDate(dp.created_at)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function ObservatorioAdminPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#0a1628]">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        </div>
      }
    >
      <ObservatorioAdminContent />
    </Suspense>
  )
}
