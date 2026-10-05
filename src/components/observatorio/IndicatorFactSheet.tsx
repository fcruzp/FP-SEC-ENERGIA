'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ExternalLink, FileSpreadsheet, FileText, History } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDateOnly } from '@/lib/dates'

interface EditionRef { title: string; edition: string; source_url: string | null; pdf_url: string | null }

interface IndicatorDetail {
  indicator: { slug: string; name: string; unit: string; notes: string | null; source_sheet: string | null; source_label: string | null }
  definition: { definition: string; formula?: string; primarySource?: string } | null
  coverage: { first_date: string | null; last_date: string | null }
  latest_point: { date: string; value: number; source_cell: string | null; first_published_in: EditionRef | null } | null
  current_edition: EditionRef | null
  last_update: string | null
  revisions: { date: string; old_value: number; new_value: number; from_edition: EditionRef | null; to_edition: EditionRef | null }[]
}

const monthYear = (d: string | null | undefined) => (d ? formatDateOnly(d, { month: 'long', year: 'numeric' }) : '—')
const num = (n: number) => n.toLocaleString('es-DO', { maximumFractionDigits: 3 })

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-[#6b7280] dark:text-[#8b949e] uppercase tracking-wide mb-1">{label}</p>
      <div className="text-sm text-[#1c1c1e] dark:text-[#e6edf3] leading-relaxed">{children}</div>
    </div>
  )
}

function FileLink({ href, icon: Icon, children }: { href: string; icon: typeof FileText; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-[#1a6b3c] dark:text-[#4ade80] underline underline-offset-2 hover:opacity-80">
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />{children}<ExternalLink className="h-3 w-3" aria-hidden="true" />
    </a>
  )
}

/**
 * Ficha técnica del indicador: definición, fórmula, procedencia exacta del último dato,
 * notas metodológicas y correcciones que el MEM ha hecho a la serie.
 */
export default function IndicatorFactSheet({ slug, unit, frequency, entityName }: {
  slug: string
  unit?: string
  frequency?: string
  entityName?: string
}) {
  const [detail, setDetail] = useState<IndicatorDetail | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/observatorio/indicator-detail?slug=${encodeURIComponent(slug)}`)
      .then(res => (res.ok ? res.json() : Promise.reject(res.status)))
      .then(json => { if (!cancelled) setDetail(json) })
      .catch(() => { if (!cancelled) setFailed(true) })
    return () => { cancelled = true }
  }, [slug])

  if (failed) return <p className="text-sm text-[#6b7280]">No se pudo cargar la ficha del indicador.</p>
  if (!detail) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => <div key={i}><Skeleton className="h-3 w-20 mb-1" /><Skeleton className="h-4 w-full" /></div>)}
      </div>
    )
  }

  const { definition, latest_point: latest, current_edition: current } = detail
  return (
    <div className="space-y-4">
      {definition && (
        <Row label="Definición">
          <p>{definition.definition}</p>
          {definition.formula && (
            <p className="mt-2 rounded-md bg-[#f4f6f4] dark:bg-[#0d1117] px-3 py-2 font-mono text-xs text-[#374151] dark:text-[#c9d1d9]">
              {definition.formula}
            </p>
          )}
        </Row>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Row label="Unidad">{unit || '—'}</Row>
        <Row label="Frecuencia">{frequency || 'Mensual'}</Row>
        {entityName && <Row label="Entidad">{entityName}</Row>}
        <Row label="Cobertura">{monthYear(detail.coverage.first_date)} – {monthYear(detail.coverage.last_date)}</Row>
      </div>

      <Row label="Fuente">
        <p>Ministerio de Energía y Minas (MEM), <em>Informe de Desempeño de las Empresas Eléctricas Estatales</em>
          {current ? `, edición ${monthYear(current.edition)}` : ''}.</p>
        {current && (
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs">
            {current.source_url && <FileLink href={current.source_url} icon={FileSpreadsheet}>Excel oficial</FileLink>}
            {current.pdf_url && <FileLink href={current.pdf_url} icon={FileText}>PDF del informe</FileLink>}
          </div>
        )}
      </Row>

      {latest && (
        <Row label="Último dato">
          <p>{monthYear(latest.date)}: <strong>{num(latest.value)}</strong> {unit}</p>
          <p className="text-xs text-[#6b7280] dark:text-[#8b949e] mt-0.5">
            {latest.source_cell && <>Celda <span className="font-mono">{latest.source_cell}</span>{' · '}</>}
            {latest.first_published_in && <>publicado en la edición {monthYear(latest.first_published_in.edition)}</>}
          </p>
        </Row>
      )}

      {definition?.primarySource && <Row label="Origen del dato"><p className="text-[13px]">{definition.primarySource}</p></Row>}

      {detail.indicator.notes && (
        <Row label="Notas metodológicas"><p className="text-[13px]">{detail.indicator.notes}</p></Row>
      )}

      <Row label={`Correcciones del MEM (${detail.revisions.length})`}>
        {detail.revisions.length === 0 ? (
          <p className="text-[13px] text-[#6b7280] dark:text-[#8b949e]">Sin correcciones registradas entre las ediciones cargadas.</p>
        ) : (
          <ul className="space-y-1.5 text-[13px]">
            {detail.revisions.slice(0, 6).map(r => (
              <li key={`${r.date}-${r.to_edition?.edition}`} className="flex flex-wrap gap-x-2">
                <span className="font-medium">{monthYear(r.date)}:</span>
                <span className="line-through text-[#9ca3af]">{num(r.old_value)}</span>
                <span>→ {num(r.new_value)}</span>
                <span className="text-xs text-[#6b7280] dark:text-[#8b949e]">(edición {monthYear(r.to_edition?.edition)})</span>
              </li>
            ))}
            {detail.revisions.length > 6 && (
              <li className="text-xs text-[#6b7280]">y {detail.revisions.length - 6} más.</li>
            )}
          </ul>
        )}
        <Link href="/observatorio/correcciones" className="mt-2 inline-flex items-center gap-1 text-xs text-[#1a6b3c] dark:text-[#4ade80] underline underline-offset-2">
          <History className="h-3.5 w-3.5" aria-hidden="true" /> Registro de correcciones
        </Link>
      </Row>

      {detail.last_update && (
        <p className="text-xs text-[#9ca3af] dark:text-[#8b949e] pt-2 border-t border-[#f3f4f6] dark:border-[#21262d]">
          Actualizado en el Observatorio el {new Date(detail.last_update).toLocaleDateString('es-DO', { day: 'numeric', month: 'long', year: 'numeric' })}.{' '}
          <Link href="/observatorio/metodologia" className="underline underline-offset-2">Metodología</Link>
        </p>
      )}
    </div>
  )
}
