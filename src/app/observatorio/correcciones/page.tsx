'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ExternalLink, FileSpreadsheet, History } from 'lucide-react'
import ObservatorioHeader from '@/components/observatorio/ObservatorioHeader'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDateOnly } from '@/lib/dates'

interface Item {
  indicator: { slug: string; name: string; unit: string; is_breakdown: boolean; category_slug: string | null; category_name: string | null }
  date: string
  old_value: number
  new_value: number
  previous_edition: string | null
}
interface EditionGroup { edition: string; title: string; source_url: string | null; pdf_url: string | null; items: Item[] }

const monthYear = (d: string | null) => (d ? formatDateOnly(d, { month: 'long', year: 'numeric' }) : '—')
const shortMonth = (d: string) => formatDateOnly(d, { month: 'short', year: 'numeric' })
const num = (n: number) => n.toLocaleString('es-DO', { maximumFractionDigits: 3 })

export default function CorreccionesPage() {
  const [editions, setEditions] = useState<EditionGroup[] | null>(null)
  const [total, setTotal] = useState(0)
  const [showBreakdowns, setShowBreakdowns] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch('/api/observatorio/revisions')
      .then(res => (res.ok ? res.json() : Promise.reject(res.status)))
      .then(json => { setEditions(json.editions); setTotal(json.total) })
      .catch(() => setError(true))
  }, [])

  // Dentro de cada edición, agrupar por indicador
  const grouped = useMemo(() => (editions ?? []).map(e => {
    const byIndicator = new Map<string, Item[]>()
    for (const item of e.items) {
      if (!showBreakdowns && item.indicator.is_breakdown) continue
      if (!byIndicator.has(item.indicator.slug)) byIndicator.set(item.indicator.slug, [])
      byIndicator.get(item.indicator.slug)!.push(item)
    }
    return { ...e, indicators: [...byIndicator.values()] }
  }), [editions, showBreakdowns])

  return (
    <>
      <ObservatorioHeader breadcrumbs={[{ label: 'Observatorio', href: '/observatorio' }, { label: 'Correcciones del MEM' }]} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#1a6b3c] dark:text-[#4ade80] mb-1">Transparencia</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1c1c1e] dark:text-[#e6edf3] flex items-center gap-2">
            <History className="h-6 w-6" aria-hidden="true" /> Registro de correcciones del MEM
          </h1>
          <p className="mt-2 text-sm text-[#4b5563] dark:text-[#8b949e] max-w-3xl leading-relaxed">
            Cada edición mensual del <em>Informe de Desempeño de las Empresas Eléctricas Estatales</em> trae de nuevo toda la serie
            histórica. Al cargarla, el Observatorio compara cada valor con el de la edición anterior: si el Ministerio de Energía y Minas
            cambió un dato ya publicado, la corrección se registra aquí y el Observatorio muestra el valor más reciente.
          </p>
        </div>

        {error && <p className="text-sm text-red-600">No se pudieron cargar las correcciones.</p>}
        {!editions && !error && <div className="space-y-3">{[0, 1, 2].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>}

        {editions && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#e5e7eb] dark:border-[#30363d] bg-white dark:bg-[#161b22] px-4 py-3 text-sm">
              <span className="text-[#374151] dark:text-[#c9d1d9]">
                <strong>{total}</strong> valores corregidos en {editions.length} {editions.length === 1 ? 'edición' : 'ediciones'}.
              </span>
              <label className="inline-flex items-center gap-2 text-[#4b5563] dark:text-[#8b949e] cursor-pointer">
                <input type="checkbox" checked={showBreakdowns} onChange={e => setShowBreakdowns(e.target.checked)} className="accent-[#1a6b3c]" />
                Incluir desgloses por empresa y partida
              </label>
            </div>

            {grouped.map(e => (
              <Card key={e.edition} className="border-[#e5e7eb] dark:border-[#30363d] bg-white dark:bg-[#161b22] p-4 sm:p-6">
                <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
                  <h2 className="text-lg font-bold text-[#1c1c1e] dark:text-[#e6edf3]">Edición {monthYear(e.edition)}</h2>
                  <div className="flex gap-4 text-xs">
                    {e.source_url && (
                      <a href={e.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[#1a6b3c] dark:text-[#4ade80] underline underline-offset-2">
                        <FileSpreadsheet className="h-3.5 w-3.5" aria-hidden="true" /> Excel oficial <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      </a>
                    )}
                  </div>
                </div>
                {e.indicators.length === 0 ? (
                  <p className="text-sm text-[#6b7280]">Solo hay correcciones en desgloses; activa la opción de arriba para verlas.</p>
                ) : (
                  <ul className="divide-y divide-[#f3f4f6] dark:divide-[#21262d]">
                    {e.indicators.map(items => {
                      const ind = items[0].indicator
                      return (
                        <li key={ind.slug} className="py-3">
                          <div className="flex flex-wrap items-baseline gap-x-2">
                            {ind.category_slug ? (
                              <Link href={`/observatorio/${ind.category_slug}/${ind.slug}`} className="font-semibold text-[#1c1c1e] dark:text-[#e6edf3] hover:underline">{ind.name}</Link>
                            ) : <span className="font-semibold">{ind.name}</span>}
                            <span className="text-xs text-[#6b7280] dark:text-[#8b949e]">{ind.category_name} · {ind.unit}</span>
                          </div>
                          <ul className="mt-1.5 grid sm:grid-cols-2 gap-x-6 gap-y-1 text-[13px]">
                            {items.map(it => {
                              const diff = it.new_value - it.old_value
                              const pct = it.old_value !== 0 ? (diff / Math.abs(it.old_value)) * 100 : null
                              return (
                                <li key={it.date} className="flex flex-wrap gap-x-2 text-[#374151] dark:text-[#c9d1d9]">
                                  <span className="w-20 text-[#6b7280] dark:text-[#8b949e]">{shortMonth(it.date)}</span>
                                  <span className="line-through text-[#9ca3af]">{num(it.old_value)}</span>
                                  <span>→ {num(it.new_value)}</span>
                                  {pct !== null && (
                                    <span className={`text-xs ${diff > 0 ? 'text-[#1a6b3c] dark:text-[#4ade80]' : 'text-[#b91c1c] dark:text-[#f87171]'}`}>
                                      ({diff > 0 ? '+' : ''}{pct.toLocaleString('es-DO', { maximumFractionDigits: Math.abs(pct) < 1 ? 2 : 1 })} %)
                                    </span>
                                  )}
                                </li>
                              )
                            })}
                          </ul>
                          {items[0].previous_edition && (
                            <p className="mt-1 text-xs text-[#9ca3af]">Valor anterior publicado en la edición {monthYear(items[0].previous_edition)}.</p>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                )}
              </Card>
            ))}

            <p className="text-xs text-[#6b7280] dark:text-[#8b949e]">
              Fuente: Ministerio de Energía y Minas (MEM), ediciones sucesivas del Informe de Desempeño. Comparación realizada por el Observatorio.{' '}
              <Link href="/observatorio/metodologia" className="underline underline-offset-2">Metodología</Link>
            </p>
          </>
        )}
      </div>
    </>
  )
}
