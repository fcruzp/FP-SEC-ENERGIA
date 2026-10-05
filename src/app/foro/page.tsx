'use client'

/**
 * MOCKUP del Foro Ciudadano — solo interfaz, con contenido de ejemplo.
 * No hay backend: nada se guarda. Sirve para validar la idea con el cliente
 * antes de construir autenticación, moderación y persistencia.
 */

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowBigUp, BarChart3, BadgeCheck, Eye, Flag, MessageSquare, Pin, Search, ShieldCheck, Sparkles,
} from 'lucide-react'
import ObservatorioHeader from '@/components/observatorio/ObservatorioHeader'

type CategoryKey = 'todos' | 'tarifas' | 'perdidas' | 'renovables' | 'apagones' | 'propuestas'

const CATEGORIES: { key: CategoryKey; label: string; color: string }[] = [
  { key: 'todos', label: 'Todos los temas', color: '#1a6b3c' },
  { key: 'perdidas', label: 'Pérdidas y cobranza', color: '#dc2626' },
  { key: 'tarifas', label: 'Tarifas eléctricas', color: '#a855f7' },
  { key: 'renovables', label: 'Energías renovables', color: '#16a34a' },
  { key: 'apagones', label: 'Apagones y servicio', color: '#f59e0b' },
  { key: 'propuestas', label: 'Propuestas de la Secretaría', color: '#0e7490' },
]

interface Comment {
  author: string
  official?: boolean
  time: string
  text: string
  votes: number
}

interface Topic {
  id: number
  category: Exclude<CategoryKey, 'todos'>
  title: string
  excerpt: string
  author: string
  official?: boolean
  pinned?: boolean
  time: string
  votes: number
  views: number
  indicator?: { label: string; value: string; href: string }
  comments: Comment[]
}

const TOPICS: Topic[] = [
  {
    id: 1,
    category: 'propuestas',
    pinned: true,
    official: true,
    title: '¿Cómo reducir las pérdidas de las distribuidoras? Abrimos la consulta',
    excerpt:
      'Las EDEs cerraron julio 2026 con 39,2 % de pérdidas (año móvil). Queremos escuchar propuestas concretas de la ciudadanía antes de presentar nuestro plan.',
    author: 'Secretaría de Energía',
    time: 'hace 2 días',
    votes: 128,
    views: 2340,
    indicator: { label: 'Pérdidas EDEs (año móvil)', value: '39,2 %', href: '/observatorio/empresas-distribuidoras/edes-perdidas-ano-movil' },
    comments: [
      {
        author: 'María R.',
        time: 'hace 1 día',
        votes: 34,
        text: 'En mi sector de Santiago hay conexiones irregulares a la vista de todos. Sin medición inteligente es imposible bajar las pérdidas.',
      },
      {
        author: 'Secretaría de Energía',
        official: true,
        time: 'hace 1 día',
        votes: 51,
        text: 'Gracias, María. La medición inteligente es uno de los ejes de la propuesta. En el Observatorio puedes comparar las pérdidas de Edenorte, Edesur y Edeeste.',
      },
      {
        author: 'Ing. Pedro M.',
        time: 'hace 20 horas',
        votes: 12,
        text: 'También hay que mirar las pérdidas técnicas: redes viejas y transformadores sobrecargados. No todo es fraude.',
      },
    ],
  },
  {
    id: 2,
    category: 'renovables',
    title: 'La generación renovable fue 23,3 % en julio. ¿Vamos al ritmo correcto?',
    excerpt:
      'Solar y eólica crecen, pero el gas natural y el carbón siguen siendo más de la mitad de la generación. ¿Qué meta es realista para 2030?',
    author: 'Luis A.',
    time: 'hace 5 horas',
    votes: 64,
    views: 980,
    indicator: { label: 'Generación renovable (jul 2026)', value: '23,3 %', href: '/observatorio/variables-relevantes/generacion-total' },
    comments: [
      {
        author: 'Carolina F.',
        time: 'hace 3 horas',
        votes: 9,
        text: 'Sin almacenamiento en baterías vamos a tener que recortar solar al mediodía. Eso debería ser prioridad.',
      },
    ],
  },
  {
    id: 3,
    category: 'tarifas',
    title: 'Tarifa indexada vs. tarifa aplicada: ¿quién paga la diferencia?',
    excerpt:
      'La diferencia entre lo que cuesta la energía y lo que se cobra la cubre el Estado. Abro el tema para entender cuánto representa ese subsidio.',
    author: 'Ana V.',
    time: 'ayer',
    votes: 41,
    views: 720,
    comments: [],
  },
  {
    id: 4,
    category: 'apagones',
    title: 'Reporte de apagones en el Este esta semana',
    excerpt:
      'Varios sectores de La Romana y San Pedro con interrupciones de 4–6 horas. ¿Alguien más? Propongo registrar los casos aquí.',
    author: 'José D.',
    time: 'hace 3 días',
    votes: 27,
    views: 1150,
    comments: [
      { author: 'Rafael T.', time: 'hace 2 días', votes: 6, text: 'En Higüey igual, sobre todo de noche.' },
    ],
  },
  {
    id: 5,
    category: 'perdidas',
    title: 'Cobranza al 95,4 %: ¿por qué el CRI sigue por debajo de 60 %?',
    excerpt:
      'Si se cobra casi todo lo facturado, el problema está en la energía que nunca se factura. El CRI combina ambas cosas.',
    author: 'Economista_RD',
    time: 'hace 4 días',
    votes: 53,
    views: 860,
    indicator: { label: 'CRI EDEs (año móvil)', value: '58,0 %', href: '/observatorio/empresas-distribuidoras/edes-cri-ano-movil' },
    comments: [],
  },
]

export default function ForoMockupPage() {
  const [category, setCategory] = useState<CategoryKey>('todos')
  const [sort, setSort] = useState<'recientes' | 'populares'>('populares')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState(TOPICS[0].id)

  const topics = useMemo(() => {
    const q = query.trim().toLowerCase()
    return TOPICS
      .filter(t => category === 'todos' || t.category === category)
      .filter(t => !q || t.title.toLowerCase().includes(q) || t.excerpt.toLowerCase().includes(q))
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
        return sort === 'populares' ? b.votes - a.votes : a.id - b.id
      })
  }, [category, sort, query])

  const selected = TOPICS.find(t => t.id === selectedId) ?? TOPICS[0]
  const categoryOf = (key: string) => CATEGORIES.find(c => c.key === key)!

  return (
    <>
      <ObservatorioHeader breadcrumbs={[{ label: 'Foro Ciudadano' }]} />

      {/* Aviso de mockup */}
      <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
          <span><strong>Vista previa de diseño.</strong> El contenido es de ejemplo y no se guarda ninguna interacción.</span>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-gradient-to-br from-[#0a2e19] via-[#0f3d22] to-[#1a6b3c] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#4ade80] mb-2">Participación ciudadana</p>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Foro Ciudadano</h1>
          <p className="text-sm text-white/75 max-w-2xl">
            Debate con datos. Cada conversación puede enlazar a un indicador del Observatorio para
            que la discusión parta de cifras oficiales.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" className="rounded-lg bg-[#4ade80] text-[#0a2e19] font-semibold text-sm px-4 py-2 cursor-pointer hover:bg-[#86efac]">
              + Nuevo tema
            </button>
            <span className="inline-flex items-center gap-1.5 text-xs text-white/70">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Moderado según las normas de convivencia
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid gap-6 lg:grid-cols-[220px_1fr_380px]">
        {/* Categorías */}
        <aside className="lg:sticky lg:top-16 self-start">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-[#6b7280] dark:text-[#8b949e] mb-2">Categorías</h2>
          <nav className="flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0">
            {CATEGORIES.map(c => (
              <button
                key={c.key}
                type="button"
                onClick={() => setCategory(c.key)}
                className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm text-left cursor-pointer transition-colors ${
                  category === c.key
                    ? 'bg-white dark:bg-[#161b22] shadow-sm font-semibold text-[#1c1c1e] dark:text-[#e6edf3]'
                    : 'text-[#4b5563] dark:text-[#8b949e] hover:bg-white/60 dark:hover:bg-[#161b22]/60'
                }`}
              >
                <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: c.color }} />
                {c.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Lista de temas */}
        <main>
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <label className="relative flex-1">
              <span className="sr-only">Buscar temas</span>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9ca3af]" aria-hidden="true" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Buscar temas…"
                className="w-full rounded-lg border border-[#e5e7eb] dark:border-[#30363d] bg-white dark:bg-[#161b22] pl-9 pr-3 py-2 text-sm text-[#1c1c1e] dark:text-[#e6edf3] outline-none focus:ring-2 focus:ring-[#4ade80]"
              />
            </label>
            <div className="flex rounded-lg border border-[#e5e7eb] dark:border-[#30363d] bg-white dark:bg-[#161b22] p-0.5 text-sm">
              {(['populares', 'recientes'] as const).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSort(s)}
                  className={`px-3 py-1.5 rounded-md capitalize cursor-pointer ${
                    sort === s ? 'bg-[#1a6b3c] text-white' : 'text-[#4b5563] dark:text-[#8b949e]'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <ul className="space-y-3">
            {topics.map(t => {
              const cat = categoryOf(t.category)
              const active = t.id === selected.id
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(t.id)}
                    className={`w-full text-left rounded-xl border bg-white dark:bg-[#161b22] p-4 flex gap-4 cursor-pointer transition-shadow hover:shadow-md ${
                      active ? 'border-[#1a6b3c] ring-1 ring-[#1a6b3c]' : 'border-[#e5e7eb] dark:border-[#30363d]'
                    }`}
                  >
                    <div className="flex flex-col items-center text-[#6b7280] dark:text-[#8b949e] min-w-[36px]">
                      <ArrowBigUp className="h-5 w-5" aria-hidden="true" />
                      <span className="text-sm font-semibold text-[#1c1c1e] dark:text-[#e6edf3]">{t.votes}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        {t.pinned && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase text-[#1a6b3c] dark:text-[#4ade80]">
                            <Pin className="h-3 w-3" aria-hidden="true" /> Fijado
                          </span>
                        )}
                        <span className="text-[10px] font-semibold uppercase tracking-wide rounded px-1.5 py-0.5" style={{ color: cat.color, background: `${cat.color}18` }}>
                          {cat.label}
                        </span>
                      </div>
                      <h3 className="font-semibold text-[#1c1c1e] dark:text-[#e6edf3] leading-snug">{t.title}</h3>
                      <p className="text-sm text-[#6b7280] dark:text-[#8b949e] mt-1 line-clamp-2">{t.excerpt}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#9ca3af] dark:text-[#8b949e]">
                        <span className="inline-flex items-center gap-1">
                          {t.author}
                          {t.official && <BadgeCheck className="h-3.5 w-3.5 text-[#1a6b3c] dark:text-[#4ade80]" aria-label="Cuenta oficial" />}
                        </span>
                        <span>{t.time}</span>
                        <span className="inline-flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />{t.comments.length}</span>
                        <span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" aria-hidden="true" />{t.views.toLocaleString('es-DO')}</span>
                        {t.indicator && (
                          <span className="inline-flex items-center gap-1 text-[#1a6b3c] dark:text-[#4ade80]">
                            <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" />{t.indicator.label}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              )
            })}
            {topics.length === 0 && (
              <li className="rounded-xl border border-dashed border-[#d1d5db] dark:border-[#30363d] p-8 text-center text-sm text-[#6b7280]">
                No hay temas que coincidan.
              </li>
            )}
          </ul>
        </main>

        {/* Hilo seleccionado */}
        <aside className="lg:sticky lg:top-16 self-start rounded-xl border border-[#e5e7eb] dark:border-[#30363d] bg-white dark:bg-[#161b22] overflow-hidden">
          <div className="p-4 border-b border-[#e5e7eb] dark:border-[#30363d]">
            <h2 className="font-semibold text-[#1c1c1e] dark:text-[#e6edf3] leading-snug">{selected.title}</h2>
            <p className="text-sm text-[#4b5563] dark:text-[#8b949e] mt-2">{selected.excerpt}</p>
            {selected.indicator && (
              <Link
                href={selected.indicator.href}
                className="mt-3 flex items-center justify-between rounded-lg bg-[#f0fdf4] dark:bg-[#0f2a1a] border border-[#bbf7d0] dark:border-[#1a6b3c] px-3 py-2 cursor-pointer"
              >
                <span className="text-xs text-[#166534] dark:text-[#86efac]">
                  <BarChart3 className="inline h-3.5 w-3.5 mr-1" aria-hidden="true" />
                  {selected.indicator.label}
                  <span className="block text-[10px] opacity-75">Fuente: MEM · Ver en el Observatorio</span>
                </span>
                <span className="text-lg font-bold text-[#166534] dark:text-[#4ade80]">{selected.indicator.value}</span>
              </Link>
            )}
          </div>

          <div className="max-h-[420px] overflow-y-auto divide-y divide-[#f3f4f6] dark:divide-[#21262d]">
            {selected.comments.length === 0 && (
              <p className="p-4 text-sm text-[#9ca3af]">Aún no hay respuestas. ¡Sé el primero en opinar!</p>
            )}
            {selected.comments.map((c, i) => (
              <div key={i} className={`p-4 ${c.official ? 'bg-[#f0fdf4]/60 dark:bg-[#0f2a1a]/50' : ''}`}>
                <div className="flex items-center gap-2 text-xs">
                  <span className="h-6 w-6 rounded-full bg-[#1a6b3c] text-white grid place-items-center text-[10px] font-bold" aria-hidden="true">
                    {c.author.slice(0, 1)}
                  </span>
                  <span className="font-semibold text-[#1c1c1e] dark:text-[#e6edf3]">{c.author}</span>
                  {c.official && <BadgeCheck className="h-3.5 w-3.5 text-[#1a6b3c] dark:text-[#4ade80]" aria-label="Cuenta oficial" />}
                  <span className="text-[#9ca3af]">· {c.time}</span>
                </div>
                <p className="text-sm text-[#374151] dark:text-[#c9d1d9] mt-2">{c.text}</p>
                <div className="mt-2 flex items-center gap-4 text-xs text-[#9ca3af]">
                  <span className="inline-flex items-center gap-1"><ArrowBigUp className="h-4 w-4" aria-hidden="true" />{c.votes}</span>
                  <span className="cursor-pointer hover:text-[#1a6b3c]">Responder</span>
                  <span className="inline-flex items-center gap-1 cursor-pointer hover:text-red-600"><Flag className="h-3.5 w-3.5" aria-hidden="true" />Reportar</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-[#e5e7eb] dark:border-[#30363d]">
            <label className="sr-only" htmlFor="reply">Escribe una respuesta</label>
            <textarea
              id="reply"
              rows={2}
              placeholder="Inicia sesión para responder…"
              disabled
              className="w-full resize-none rounded-lg border border-[#e5e7eb] dark:border-[#30363d] bg-[#f9fafb] dark:bg-[#0d1117] p-2 text-sm"
            />
          </div>
        </aside>
      </div>
    </>
  )
}
