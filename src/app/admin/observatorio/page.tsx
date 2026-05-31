'use client'

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

  // Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadResult, setUploadResult] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Date range filter state
  const [dateRangePreset, setDateRangePreset] = useState<string>('current-month')
  const [customDateFrom, setCustomDateFrom] = useState<string>('')
  const [customDateTo, setCustomDateTo] = useState<string>('')

  // ── Date Range Helpers ──
  const getDateRangeFromPreset = useCallback((preset: string): { dateFrom?: string; dateTo?: string } => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() // 0-indexed

    switch (preset) {
      case 'current-month': {
        // First day of current month to first day of next month
        const from = new Date(year, month, 1)
        const to = new Date(year, month + 1, 1)
        return { dateFrom: from.toISOString().split('T')[0], dateTo: to.toISOString().split('T')[0] }
      }
      case 'last-3-months': {
        const from = new Date(year, month - 2, 1)
        const to = new Date(year, month + 1, 1)
        return { dateFrom: from.toISOString().split('T')[0], dateTo: to.toISOString().split('T')[0] }
      }
      case 'last-6-months': {
        const from = new Date(year, month - 5, 1)
        const to = new Date(year, month + 1, 1)
        return { dateFrom: from.toISOString().split('T')[0], dateTo: to.toISOString().split('T')[0] }
      }
      case 'last-12-months': {
        const from = new Date(year, month - 11, 1)
        const to = new Date(year, month + 1, 1)
        return { dateFrom: from.toISOString().split('T')[0], dateTo: to.toISOString().split('T')[0] }
      }
      case 'current-year': {
        const from = new Date(year, 0, 1)
        const to = new Date(year, month + 1, 1)
        return { dateFrom: from.toISOString().split('T')[0], dateTo: to.toISOString().split('T')[0] }
      }
      case 'custom': {
        return {
          dateFrom: customDateFrom || undefined,
          dateTo: customDateTo || undefined,
        }
      }
      case 'full':
      default:
        return {} // No filter = full historical load
    }
  }, [customDateFrom, customDateTo])

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

  // ── Upload Handlers ──
  const handleFileSelect = (file: File) => {
    if (!file.name.match(/\.(xlsx?|xls)$/i)) {
      setUploadError('Solo se aceptan archivos .xlsx o .xls')
      return
    }
    setUploadFile(file)
    setUploadError(null)
    setUploadResult(null)
    setUploadStatus('idle')
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  const handleUpload = async () => {
    if (!uploadFile) return

    setUploadStatus('uploading')
    setUploadProgress(10)
    setUploadError(null)
    setUploadResult(null)

    try {
      // Simulate upload progress while file is being read
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 5, 40))
      }, 200)

      // Convert file to base64 for transport
      const arrayBuffer = await uploadFile.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)
      let binary = ''
      for (let i = 0; i < uint8Array.length; i++) {
        binary += String.fromCharCode(uint8Array[i])
      }
      const base64 = btoa(binary)

      clearInterval(progressInterval)
      setUploadProgress(50)
      setUploadStatus('processing')

      // Send to parse-xls API
      const dateRange = getDateRangeFromPreset(dateRangePreset)
      const response = await fetch('/api/admin/parse-xls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_data: base64,
          file_name: uploadFile.name,
          mode: 'full',
          date_from: dateRange.dateFrom,
          date_to: dateRange.dateTo,
        }),
      })

      setUploadProgress(90)

      const data = await response.json()

      if (!response.ok || data.success === false) {
        throw new Error(data.error || 'Error al procesar el archivo')
      }

      setUploadProgress(100)
      setUploadStatus('success')
      const insertedCount = data.data_points_inserted ?? 0
      const extractedCount = data.data_points_extracted ?? 0
      setUploadResult(
        data.message || `Procesado: ${insertedCount} data_points insertados de ${extractedCount} extraídos`
      )

      // Refresh data after upload
      setTimeout(() => {
        fetchStats()
        fetchRecentData()
      }, 500)
    } catch (err) {
      setUploadStatus('error')
      setUploadError(err instanceof Error ? err.message : 'Error desconocido')
    }
  }

  const resetUpload = () => {
    setUploadFile(null)
    setUploadStatus('idle')
    setUploadProgress(0)
    setUploadResult(null)
    setUploadError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Date range preset labels and descriptions
  const dateRangePresets = [
    { value: 'current-month', label: 'Mes en curso', desc: '~1,000 datos', icon: Zap },
    { value: 'last-3-months', label: 'Últimos 3 meses', desc: '~4,500 datos', icon: Clock },
    { value: 'last-12-months', label: 'Últimos 12 meses', desc: '~15,000 datos', icon: Clock },
    { value: 'current-year', label: 'Año en curso', desc: '~2,300 datos', icon: CalendarDays },
    { value: 'custom', label: 'Personalizado', desc: 'Rango manual', icon: CalendarDays },
    { value: 'full', label: 'Carga completa', desc: '~200,000+ datos ⚠️', icon: Database },
  ]

  // ── Helpers ──
  const formatNumber = (n: number) =>
    new Intl.NumberFormat('es-DO').format(n)

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('es-DO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })

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
            {/* Header */}
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                Cargar Datos
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Importa archivos Excel (.xlsx) con datos de indicadores energéticos
              </p>
            </div>

            {/* ─── Date Range Selection ─── */}
            <Card className="bg-[#0d1f3c] border-white/[0.06]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-emerald-400" />
                  Rango de Fechas a Procesar
                </CardTitle>
                <p className="text-slate-500 text-xs mt-1">
                  Cada XLS contiene toda la historia (2009→presente). Selecciona el segmento que deseas cargar para agilizar el proceso.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Preset buttons */}
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {dateRangePresets.map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() => setDateRangePreset(preset.value)}
                      className={`
                        flex flex-col items-center gap-1 px-3 py-2.5 rounded-lg text-center
                        transition-all duration-150 border
                        ${dateRangePreset === preset.value
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                          : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:bg-white/[0.04] hover:border-white/[0.1]'
                        }
                      `}
                    >
                      <preset.icon className="w-4 h-4" />
                      <span className="text-[11px] font-semibold leading-tight">{preset.label}</span>
                      <span className="text-[9px] opacity-60 leading-tight">{preset.desc}</span>
                    </button>
                  ))}
                </div>

                {/* Custom date inputs */}
                {dateRangePreset === 'custom' && (
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1.5">
                      <Label className="text-slate-400 text-xs">Desde</Label>
                      <Input
                        type="date"
                        value={customDateFrom}
                        onChange={(e) => setCustomDateFrom(e.target.value)}
                        className="bg-[#0a1628] border-white/[0.08] text-white text-sm h-9"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-slate-400 text-xs">Hasta</Label>
                      <Input
                        type="date"
                        value={customDateTo}
                        onChange={(e) => setCustomDateTo(e.target.value)}
                        className="bg-[#0a1628] border-white/[0.08] text-white text-sm h-9"
                      />
                    </div>
                  </div>
                )}

                {/* Active range summary */}
                <div className="flex items-center gap-2 bg-white/[0.02] rounded-lg px-3 py-2 border border-white/[0.04]">
                  <span className="text-slate-500 text-xs">Rango activo:</span>
                  <span className="text-emerald-400 text-xs font-semibold">
                    {dateRangePreset === 'full'
                      ? 'Toda la historia (2009 → presente)'
                      : dateRangePreset === 'custom'
                        ? `${customDateFrom || '...'} → ${customDateTo || '...'}`
                        : dateRangePresets.find(p => p.value === dateRangePreset)?.label
                    }
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* ─── Upload Area ─── */}
            <Card className="bg-[#0d1f3c] border-white/[0.06]">
              <CardContent className="p-6">
                {/* Drag & Drop Zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`
                    relative border-2 border-dashed rounded-xl p-8 md:p-12 text-center
                    transition-all duration-200 cursor-pointer
                    ${isDragging
                      ? 'border-emerald-400 bg-emerald-500/5'
                      : uploadFile
                        ? 'border-emerald-500/30 bg-emerald-500/5'
                        : 'border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.01]'
                    }
                  `}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileSelect(file)
                    }}
                  />

                  {uploadFile ? (
                    <div className="space-y-3">
                      <div className="w-14 h-14 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto">
                        <FileSpreadsheet className="w-7 h-7 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">{uploadFile.name}</p>
                        <p className="text-slate-400 text-xs mt-1">
                          {formatFileSize(uploadFile.size)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="w-14 h-14 rounded-xl bg-white/[0.04] flex items-center justify-center mx-auto">
                        <Upload className="w-7 h-7 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">
                          Arrastra tu archivo aquí
                        </p>
                        <p className="text-slate-400 text-xs mt-1">
                          o haz clic para seleccionar — .xlsx, .xls
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* File Info & Action */}
                {uploadFile && (
                  <div className="mt-6 space-y-4">
                    {/* Progress */}
                    {(uploadStatus === 'uploading' || uploadStatus === 'processing') && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">
                            {uploadStatus === 'uploading' ? 'Subiendo archivo...' : 'Procesando datos...'}
                          </span>
                          <span className="text-emerald-400 font-semibold">{uploadProgress}%</span>
                        </div>
                        <Progress
                          value={uploadProgress}
                          className="h-2 bg-white/[0.06] [&>div]:bg-emerald-500"
                        />
                      </div>
                    )}

                    {/* Success */}
                    {uploadStatus === 'success' && (
                      <div className="flex items-start gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-emerald-400 text-sm font-semibold">Procesado exitosamente</p>
                          <p className="text-slate-400 text-xs mt-1">{uploadResult}</p>
                        </div>
                      </div>
                    )}

                    {/* Error */}
                    {uploadStatus === 'error' && (
                      <div className="flex items-start gap-3 bg-rose-500/10 border border-rose-500/20 rounded-lg p-4">
                        <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-rose-400 text-sm font-semibold">Error al procesar</p>
                          <p className="text-slate-400 text-xs mt-1">{uploadError}</p>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                      <Button
                        onClick={handleUpload}
                        disabled={uploadStatus === 'uploading' || uploadStatus === 'processing'}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex-1"
                      >
                        {(uploadStatus === 'uploading' || uploadStatus === 'processing') ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Procesando...
                          </>
                        ) : (
                          <>
                            <FileSpreadsheet className="w-4 h-4 mr-2" />
                            Parsear y Cargar
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={resetUpload}
                        className="border-white/[0.1] text-slate-300 hover:bg-white/[0.04]"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Limpiar
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Info box */}
            <Card className="bg-[#0d1f3c] border-white/[0.06]">
              <CardContent className="p-6">
                <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  Formato esperado del archivo
                </h3>
                <ul className="space-y-2 text-slate-400 text-xs">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">•</span>
                    Archivo .xlsx con hojas nombradas según las categorías de indicadores
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">•</span>
                    Primera fila con encabezados: indicador, entidad, fecha, valor
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">•</span>
                    Fechas en formato YYYY-MM-DD o YYYY-MM
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">•</span>
                    Valores numéricos sin formato de moneda ni separadores de miles
                  </li>
                </ul>
              </CardContent>
            </Card>
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
