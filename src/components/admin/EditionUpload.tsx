'use client'

import { useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, ExternalLink, FileSpreadsheet, Info, Loader2, Upload, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface CheckSummary {
  check: string
  description: string
  compared: number
  mismatches: number
  ok: boolean
  samples: string[]
  known: { key: string; explanation: string }[]
}

interface EditionReport {
  file: string
  edition: string
  latest_month: string
  values: number
  indicators: number
  sheets: { sheet: string; actualName: string; indicators: number; firstMonth: string; lastMonth: string }[]
  notes: string[]
  catalog_diffs: string[]
  catalog_diff_count: number
  edition_mismatch: string | null
  checks: CheckSummary[]
  can_load: boolean
  loaded?: boolean
  stats?: { inserted: number; revisions: number; unchanged: number; removed_indicators: number; latest_month: string }
  error?: string
}

type Step = 'idle' | 'validating' | 'validated' | 'loading' | 'loaded' | 'error'

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const editionLabel = (d: string) => `${MONTHS[Number(d.slice(5, 7)) - 1]} ${d.slice(0, 4)}`
const fmt = (n: number) => n.toLocaleString('es-DO')

/**
 * Carga de una edición del Informe de Desempeño del MEM en dos pasos:
 * validar (no escribe nada) y, si todo pasa, cargar.
 */
export default function EditionUpload({ onLoaded }: { onLoaded?: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [sourceUrl, setSourceUrl] = useState('')
  const [pdfUrl, setPdfUrl] = useState('')
  const [publishedAt, setPublishedAt] = useState('')
  const [step, setStep] = useState<Step>('idle')
  const [report, setReport] = useState<EditionReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const send = async (mode: 'validate' | 'load') => {
    if (!file) return
    setStep(mode === 'validate' ? 'validating' : 'loading')
    setError(null)
    const form = new FormData()
    form.append('file', file)
    form.append('mode', mode)
    if (sourceUrl.trim()) form.append('source_url', sourceUrl.trim())
    if (pdfUrl.trim()) form.append('pdf_url', pdfUrl.trim())
    if (publishedAt) form.append('published_at', publishedAt)
    try {
      const res = await fetch('/api/admin/mem-edition', { method: 'POST', body: form })
      const data = (await res.json()) as EditionReport
      if (data.edition) setReport(data)
      if (!res.ok) throw new Error(data.error || 'No se pudo procesar el archivo')
      setStep(mode === 'load' ? 'loaded' : 'validated')
      if (mode === 'load') onLoaded?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      setStep('error')
    }
  }

  const reset = () => {
    setFile(null)
    setReport(null)
    setError(null)
    setStep('idle')
    if (inputRef.current) inputRef.current.value = ''
  }

  const busy = step === 'validating' || step === 'loading'

  return (
    <div className="space-y-6">
      <Card className="bg-[#0d1f3c] border-white/[0.06]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            Edición del Informe de Desempeño (MEM)
          </CardTitle>
          <p className="text-slate-400 text-xs mt-1 leading-relaxed">
            Descarga el Excel de anexos desde{' '}
            <a href="https://mem.gob.do/category/sector-electrico/informe-de-desempeno/" target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline inline-flex items-center gap-1">
              mem.gob.do <ExternalLink className="w-3 h-3" aria-hidden="true" />
            </a>{' '}
            sin cambiarle el nombre (de él se deduce la edición). Primero se valida y no se escribe nada; si todo cuadra, se habilita la carga.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="mem-file" className="text-slate-300 text-xs">Archivo Excel (.xlsx)</Label>
            <Input
              id="mem-file"
              ref={inputRef}
              type="file"
              accept=".xlsx"
              disabled={busy}
              onChange={e => { setFile(e.target.files?.[0] ?? null); setReport(null); setStep('idle'); setError(null) }}
              className="mt-1 bg-[#0a1628] border-white/[0.08] text-slate-200 text-sm file:text-emerald-400 file:bg-transparent file:border-0 cursor-pointer"
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="mem-source" className="text-slate-300 text-xs">Enlace oficial del Excel (opcional)</Label>
              <Input id="mem-source" value={sourceUrl} onChange={e => setSourceUrl(e.target.value)} disabled={busy}
                placeholder="https://mem.gob.do/wp-content/uploads/…xlsx" className="mt-1 bg-[#0a1628] border-white/[0.08] text-white text-sm" />
            </div>
            <div>
              <Label htmlFor="mem-pdf" className="text-slate-300 text-xs">Enlace oficial del PDF (opcional)</Label>
              <Input id="mem-pdf" value={pdfUrl} onChange={e => setPdfUrl(e.target.value)} disabled={busy}
                placeholder="https://mem.gob.do/wp-content/uploads/…pdf" className="mt-1 bg-[#0a1628] border-white/[0.08] text-white text-sm" />
            </div>
            <div>
              <Label htmlFor="mem-published" className="text-slate-300 text-xs">Fecha de publicación en mem.gob.do (opcional)</Label>
              <Input id="mem-published" type="date" value={publishedAt} onChange={e => setPublishedAt(e.target.value)} disabled={busy}
                className="mt-1 bg-[#0a1628] border-white/[0.08] text-white text-sm" />
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => send('validate')} disabled={!file || busy} className="bg-emerald-600 hover:bg-emerald-500 text-white">
              {step === 'validating' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
              1. Validar
            </Button>
            <Button onClick={() => send('load')} disabled={!report?.can_load || busy || step === 'loaded'} variant="outline"
              className="border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 disabled:opacity-40">
              {step === 'loading' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              2. Cargar en el Observatorio
            </Button>
            {(report || error) && (
              <Button onClick={reset} variant="ghost" disabled={busy} className="text-slate-400 hover:text-white">Empezar de nuevo</Button>
            )}
          </div>
          {step === 'loading' && (
            <p className="text-xs text-slate-400">Cargando… puede tardar hasta un minuto. No cierres la página.</p>
          )}
        </CardContent>
      </Card>

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          <XCircle className="w-5 h-5 mt-0.5 flex-shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {step === 'loaded' && report?.stats && (
        <div className="flex items-start gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0 text-emerald-400" aria-hidden="true" />
          <div>
            <p className="font-semibold">Edición {editionLabel(report.edition)} cargada.</p>
            <p className="text-emerald-200/80 mt-1">
              {fmt(report.stats.inserted)} valores nuevos · {fmt(report.stats.revisions)} valores corregidos por el MEM respecto a la edición anterior
              · {fmt(report.stats.unchanged)} sin cambios. El Observatorio ya muestra los datos actualizados.
            </p>
          </div>
        </div>
      )}

      {report && (
        <Card className="bg-[#0d1f3c] border-white/[0.06]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
              {report.can_load
                ? <CheckCircle2 className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                : <AlertTriangle className="w-4 h-4 text-amber-400" aria-hidden="true" />}
              Informe de validación · edición {editionLabel(report.edition)}
            </CardTitle>
            <p className="text-slate-400 text-xs mt-1">
              {fmt(report.indicators)} indicadores · {fmt(report.values)} valores · último mes {editionLabel(report.latest_month)}
            </p>
          </CardHeader>
          <CardContent className="space-y-5 text-sm">
            {report.edition_mismatch && <p className="text-amber-300">⚠️ {report.edition_mismatch}</p>}

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Hojas leídas</h3>
              <ul className="space-y-1 text-slate-300">
                {report.sheets.map(s => (
                  <li key={s.sheet} className="flex justify-between gap-4">
                    <span>{s.sheet}{s.actualName !== s.sheet && !s.actualName.includes('+') ? ` (hoja "${s.actualName}")` : ''}</span>
                    <span className="text-slate-500 text-xs whitespace-nowrap">{fmt(s.indicators)} ind. · {s.firstMonth.slice(0, 7)} → {s.lastMonth.slice(0, 7)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Estructura del Excel</h3>
              {report.catalog_diff_count === 0
                ? <p className="text-emerald-300">✓ Idéntica al catálogo versionado.</p>
                : (
                  <div className="text-amber-200 space-y-1">
                    <p>⚠️ {report.catalog_diff_count} diferencias con el catálogo. El MEM cambió filas o etiquetas: hay que revisar el catálogo antes de cargar (usar el script con --accept-catalog).</p>
                    <pre className="text-[11px] whitespace-pre-wrap bg-black/30 rounded p-2 max-h-48 overflow-auto">{report.catalog_diffs.join('\n')}</pre>
                  </div>
                )}
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Verificaciones</h3>
              <ul className="space-y-3">
                {report.checks.map(c => (
                  <li key={c.check}>
                    <p className={c.ok ? 'text-emerald-300' : 'text-red-300'}>
                      {c.ok ? '✓' : '✗'} {c.description}
                    </p>
                    <p className="text-slate-500 text-xs">{fmt(c.compared)} comparaciones · {fmt(c.mismatches)} diferencias{c.known.length ? ` (${c.known.length} anomalías conocidas de la fuente)` : ''}</p>
                    {c.samples.length > 0 && (
                      <pre className="mt-1 text-[11px] whitespace-pre-wrap bg-black/30 rounded p-2 max-h-40 overflow-auto text-red-200">{c.samples.join('\n')}</pre>
                    )}
                    {c.known.map(k => (
                      <p key={k.key} className="text-slate-500 text-xs mt-1 flex gap-1"><Info className="w-3 h-3 mt-0.5 flex-shrink-0" aria-hidden="true" />{k.explanation}</p>
                    ))}
                  </li>
                ))}
              </ul>
            </div>

            {report.notes.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Observaciones</h3>
                <ul className="text-slate-400 text-xs space-y-1">{report.notes.map(n => <li key={n}>· {n}</li>)}</ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
