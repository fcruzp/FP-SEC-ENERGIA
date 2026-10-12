'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, BookOpen, Check, Copy, KeyRound, Loader2, Plus, RefreshCw, ShieldOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ApiClient {
  id: string
  name: string
  description: string | null
  contact: string | null
  key_prefix: string
  scopes: string[]
  rate_limit_per_minute: number
  rate_limit_per_day: number
  expires_at: string | null
  revoked_at: string | null
  last_used_at: string | null
  created_at: string
}
interface UsageRow { client_id: string | null; day: string; requests: number; errors: number; avg_ms: number | null }

const SCOPE_LABELS: Record<string, string> = {
  'read:catalog': 'Catálogo',
  'read:data': 'Datos',
  'read:revisions': 'Correcciones',
}

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('es-DO', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

function statusOf(c: ApiClient): { label: string; className: string } {
  if (c.revoked_at) return { label: 'Revocada', className: 'bg-red-500/15 text-red-300' }
  if (c.expires_at && new Date(c.expires_at) <= new Date()) return { label: 'Vencida', className: 'bg-amber-500/15 text-amber-300' }
  if (c.expires_at && new Date(c.expires_at).getTime() - Date.now() < 30 * 86_400_000) return { label: 'Vence pronto', className: 'bg-amber-500/15 text-amber-300' }
  return { label: 'Activa', className: 'bg-emerald-500/15 text-emerald-300' }
}

/** Pestaña "Integraciones": llaves de la API /api/v1 por aplicación. */
export default function ApiKeysManager() {
  const [clients, setClients] = useState<ApiClient[]>([])
  const [usage, setUsage] = useState<UsageRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [revealed, setRevealed] = useState<{ name: string; key: string; replaces?: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [form, setForm] = useState({ name: '', contact: '', description: '', days: '365', perMinute: '60', perDay: '10000' })
  const [scopes, setScopes] = useState<string[]>(Object.keys(SCOPE_LABELS))

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/api-keys')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setClients(data.clients)
      setUsage(data.usage)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const usageBy = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString().slice(0, 10)
    const map = new Map<string, { today: number; week: number; errors: number; month: number }>()
    for (const u of usage) {
      if (!u.client_id) continue
      const m = map.get(u.client_id) ?? { today: 0, week: 0, errors: 0, month: 0 }
      m.month += u.requests
      if (u.day >= weekAgo) { m.week += u.requests; m.errors += u.errors }
      if (u.day === today) m.today += u.requests
      map.set(u.client_id, m)
    }
    return map
  }, [usage])

  const anonymousFailures = usage.filter(u => !u.client_id).reduce((s, u) => s + u.requests, 0)

  const send = async (method: 'POST' | 'PATCH', body: object) => {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/api-keys', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      if (data.key) {
        setRevealed({ name: data.client.name, key: data.key, replaces: data.replaces })
        setCopied(false)
      }
      await load()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
      return false
    } finally {
      setBusy(false)
    }
  }

  const create = async () => {
    const ok = await send('POST', {
      name: form.name,
      contact: form.contact || undefined,
      description: form.description || undefined,
      days: Number(form.days),
      scopes,
      rate_limit_per_minute: Number(form.perMinute),
      rate_limit_per_day: Number(form.perDay),
    })
    if (ok) setForm(f => ({ ...f, name: '', contact: '', description: '' }))
  }

  const revoke = (c: ApiClient) => {
    if (window.confirm(`¿Revocar la llave ${c.key_prefix}… de "${c.name}"? La aplicación dejará de tener acceso de inmediato.`)) {
      send('PATCH', { id: c.id, action: 'revoke' })
    }
  }

  const rotate = (c: ApiClient) => {
    if (window.confirm(`Se creará una llave nueva para "${c.name}". La actual seguirá activa hasta que la revoque. ¿Continuar?`)) {
      send('PATCH', { id: c.id, action: 'rotate' })
    }
  }

  const copy = async () => {
    if (!revealed) return
    await navigator.clipboard.writeText(revealed.key)
    setCopied(true)
  }

  const inputClass = 'mt-1 bg-[#0a1628] border-white/[0.08] text-white text-sm'

  return (
    <div className="space-y-6">
      {revealed && (
        <Card className="bg-emerald-950/40 border-emerald-500/40">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-start gap-2 text-emerald-300 text-sm font-semibold">
              <KeyRound className="w-4 h-4 mt-0.5 flex-shrink-0" />
              Llave nueva para “{revealed.name}”. Cópiela ahora: no se volverá a mostrar.
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <code className="flex-1 rounded-md bg-[#0a1628] border border-white/[0.08] px-3 py-2 text-sm text-white break-all select-all">{revealed.key}</code>
              <Button onClick={copy} className="bg-emerald-600 hover:bg-emerald-500 text-white">
                {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                {copied ? 'Copiada' : 'Copiar'}
              </Button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Guárdela en las variables de entorno de la aplicación (p. ej. <code>FP_ENERGIA_API_KEY</code>), nunca en el código ni en un chat.
              {revealed.replaces && <> Cuando la aplicación ya use la nueva, revoque la anterior (<code>{revealed.replaces}…</code>).</>}
            </p>
            <Button variant="ghost" size="sm" onClick={() => setRevealed(null)} className="text-slate-400 hover:text-white">Ya la guardé, ocultar</Button>
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      <Card className="bg-[#0d1f3c] border-white/[0.06]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-emerald-400" /> Nueva llave
          </CardTitle>
          <p className="text-slate-400 text-xs mt-1">Una llave por aplicación. Solo da acceso de lectura a /api/v1.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="k-name" className="text-slate-300 text-xs">Aplicación *</Label>
              <Input id="k-name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Sky" className={inputClass} />
            </div>
            <div>
              <Label htmlFor="k-contact" className="text-slate-300 text-xs">Responsable</Label>
              <Input id="k-contact" value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} placeholder="Nombre o correo" className={inputClass} />
            </div>
            <div>
              <Label htmlFor="k-desc" className="text-slate-300 text-xs">Uso</Label>
              <Input id="k-desc" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Agente de análisis" className={inputClass} />
            </div>
            <div>
              <Label htmlFor="k-days" className="text-slate-300 text-xs">Vigencia</Label>
              <select id="k-days" value={form.days} onChange={e => setForm({ ...form, days: e.target.value })}
                className="mt-1 w-full h-9 rounded-md bg-[#0a1628] border border-white/[0.08] text-white text-sm px-2">
                <option value="90">90 días</option>
                <option value="180">6 meses</option>
                <option value="365">1 año (recomendado)</option>
                <option value="0">Sin vencimiento</option>
              </select>
            </div>
            <div>
              <Label htmlFor="k-min" className="text-slate-300 text-xs">Peticiones por minuto</Label>
              <Input id="k-min" type="number" min={1} max={1000} value={form.perMinute} onChange={e => setForm({ ...form, perMinute: e.target.value })} className={inputClass} />
            </div>
            <div>
              <Label htmlFor="k-day" className="text-slate-300 text-xs">Peticiones por día</Label>
              <Input id="k-day" type="number" min={1} value={form.perDay} onChange={e => setForm({ ...form, perDay: e.target.value })} className={inputClass} />
            </div>
          </div>
          <fieldset>
            <legend className="text-slate-300 text-xs mb-2">Permisos</legend>
            <div className="flex flex-wrap gap-4">
              {Object.entries(SCOPE_LABELS).map(([scope, label]) => (
                <label key={scope} className="flex items-center gap-2 text-sm text-slate-200">
                  <input type="checkbox" checked={scopes.includes(scope)} className="accent-emerald-500"
                    onChange={e => setScopes(e.target.checked ? [...scopes, scope] : scopes.filter(s => s !== scope))} />
                  {label} <span className="text-slate-500 text-xs">({scope})</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="flex flex-wrap gap-3 items-center">
            <Button onClick={create} disabled={busy || form.name.trim().length < 2 || scopes.length === 0} className="bg-emerald-600 hover:bg-emerald-500 text-white">
              {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <KeyRound className="w-4 h-4 mr-2" />}
              Crear llave
            </Button>
            <a href="/desarrolladores" target="_blank" className="text-emerald-400 text-sm inline-flex items-center gap-1 underline">
              <BookOpen className="w-4 h-4" /> Documentación de la API
            </a>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#0d1f3c] border-white/[0.06]">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold text-white">Llaves emitidas</CardTitle>
          <Button variant="ghost" size="sm" onClick={load} disabled={loading} className="text-slate-400 hover:text-white">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>
        <CardContent>
          {loading && clients.length === 0 ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-emerald-400 animate-spin" /></div>
          ) : clients.length === 0 ? (
            <p className="text-slate-400 text-sm py-6 text-center">Todavía no hay llaves.</p>
          ) : (
            <div className="space-y-3">
              {clients.map(c => {
                const st = statusOf(c)
                const u = usageBy.get(c.id)
                const active = !c.revoked_at
                return (
                  <div key={c.id} className="rounded-lg border border-white/[0.06] bg-[#0a1628] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-white font-semibold">{c.name}</span>
                          <span className={`text-[11px] rounded px-2 py-0.5 ${st.className}`}>{st.label}</span>
                          <code className="text-xs text-slate-400">{c.key_prefix}…</code>
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          {[c.contact, c.description].filter(Boolean).join(' · ') || 'Sin responsable indicado'}
                        </div>
                        <div className="text-xs text-slate-500 mt-2 flex flex-wrap gap-x-4 gap-y-1">
                          <span>Permisos: {c.scopes.map(s => SCOPE_LABELS[s] ?? s).join(', ')}</span>
                          <span>Límite: {c.rate_limit_per_minute}/min · {c.rate_limit_per_day.toLocaleString('es-DO')}/día</span>
                          <span>Creada: {fmtDate(c.created_at)}</span>
                          <span>Vence: {c.expires_at ? fmtDate(c.expires_at) : 'no vence'}</span>
                          <span>Último uso: {fmtDate(c.last_used_at)}</span>
                          {c.revoked_at && <span className="text-red-300">Revocada: {fmtDate(c.revoked_at)}</span>}
                        </div>
                        <div className="text-xs text-slate-300 mt-2">
                          Uso: {u?.today ?? 0} hoy · {u?.week ?? 0} en 7 días · {u?.month ?? 0} en 30 días
                          {u && u.errors > 0 && <span className="text-amber-300"> · {u.errors} con error en 7 días</span>}
                        </div>
                      </div>
                      {active && (
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" disabled={busy} onClick={() => rotate(c)}
                            className="border-white/[0.1] bg-transparent text-slate-200 hover:bg-white/[0.05]">
                            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Rotar
                          </Button>
                          <Button variant="outline" size="sm" disabled={busy} onClick={() => revoke(c)}
                            className="border-red-500/30 bg-transparent text-red-300 hover:bg-red-500/10">
                            <ShieldOff className="w-3.5 h-3.5 mr-1.5" /> Revocar
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          {anonymousFailures > 0 && (
            <p className="text-xs text-slate-500 mt-4">
              {anonymousFailures} intento(s) sin llave válida en los últimos 30 días.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
