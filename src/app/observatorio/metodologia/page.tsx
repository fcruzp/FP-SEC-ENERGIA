import Link from 'next/link'
import type { Metadata } from 'next'
import { CheckCircle2, ExternalLink } from 'lucide-react'
import ObservatorioHeader from '@/components/observatorio/ObservatorioHeader'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { GLOSSARY } from '@/lib/mem/definitions'
import { formatDateOnly } from '@/lib/dates'
import knownAnomalies from '../../../../data/mem/anomalias-conocidas.json'

export const metadata: Metadata = {
  title: 'Metodología · Observatorio Energético',
  description: 'Fuentes, proceso de carga y verificación, glosario y notas metodológicas del Observatorio Energético.',
}
export const revalidate = 3600

interface CheckSummary { check: string; description: string; compared: number; mismatches: number; keys?: string[] }

const MEM_LISTING = 'https://mem.gob.do/category/sector-electrico/informe-de-desempeno/'
const monthYear = (d: string) => formatDateOnly(d, { month: 'long', year: 'numeric' })

const SHEETS: [string, string][] = [
  ['Variables Relevantes', 'Precios de combustibles, generación por fuente y su participación, costos marginales, peaje de transmisión y tasa de cambio.'],
  ['EDE\'s', 'Compra y venta de energía, facturación, cobros, gastos, inversiones, pérdidas, cobranza, CRI, clientes y empleados de Edenorte, Edesur y Edeeste.'],
  ['CDEEE', 'Compras, ventas y gastos de la CDEEE (serie hasta enero 2024).'],
  ['EGEHID, ETED, EGPC', 'Energía vendida, facturación, gastos, inversiones y empleados de las empresas estatales de generación y transmisión.'],
  ['Anexo de resultados financieros', 'Flujo de caja del año en curso por empresa: ingresos, gastos, balances, inversiones y su financiamiento (incluidos los aportes del Gobierno).'],
  ['Anexo de deuda', 'Deuda corriente de las EDEs con las generadoras (saldo al cierre de cada mes), pagos por compra de energía y balance pendiente.'],
  ['Regímenes tarifarios', 'Tarifas aplicadas y de referencia por categoría de cliente y EDE, de julio 2013 en adelante.'],
]

async function loadStatus() {
  if (!isSupabaseConfigured) return { editions: [], run: null }
  const [reps, run] = await Promise.all([
    supabase.from('reports').select('title, edition, source_url, pdf_url').eq('source_org', 'MEM').order('edition', { ascending: false }),
    supabase.from('ingestion_runs').select('finished_at, stats, checks').eq('status', 'success').order('finished_at', { ascending: false }).limit(1).maybeSingle(),
  ])
  return { editions: reps.data ?? [], run: run.data as { finished_at: string; stats: Record<string, number | string>; checks: CheckSummary[] } | null }
}

function H2({ children, id }: { children: React.ReactNode; id: string }) {
  return <h2 id={id} className="text-xl font-bold text-[#1c1c1e] dark:text-[#e6edf3] mt-10 mb-3 scroll-mt-16">{children}</h2>
}
const P = ({ children }: { children: React.ReactNode }) => <p className="text-sm text-[#374151] dark:text-[#c9d1d9] leading-relaxed mb-3">{children}</p>

export default async function MetodologiaPage() {
  const { editions, run } = await loadStatus()
  const anomalies = knownAnomalies as { check: string; key: string; explanation: string; edition?: string }[]

  return (
    <>
      <ObservatorioHeader breadcrumbs={[{ label: 'Observatorio', href: '/observatorio' }, { label: 'Metodología' }]} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#1a6b3c] dark:text-[#4ade80] mb-1">Metodología</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1c1c1e] dark:text-[#e6edf3]">Cómo se construye el Observatorio</h1>
        <P>
          El Observatorio publica los datos oficiales del sector eléctrico dominicano tal como los publica el Estado, sin
          estimaciones propias, e indica para cada valor de dónde proviene.
        </P>
        <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#1a6b3c] dark:text-[#4ade80] mb-2" aria-label="Contenido">
          {[['fuente', 'Fuente'], ['contenido', 'Qué contiene'], ['verificacion', 'Carga y verificación'], ['correcciones', 'Correcciones'],
            ['anomalias', 'Anomalías de la fuente'], ['notas', 'Notas'], ['glosario', 'Glosario'], ['citar', 'Cómo citar']].map(([id, label]) => (
            <a key={id} href={`#${id}`} className="underline underline-offset-2">{label}</a>
          ))}
        </nav>

        <H2 id="fuente">Fuente</H2>
        <P>
          <strong>Ministerio de Energía y Minas (MEM)</strong>, <em>Informe de Desempeño de las Empresas Eléctricas Estatales</em>,
          publicado mensualmente en{' '}
          <a href={MEM_LISTING} target="_blank" rel="noopener noreferrer" className="text-[#1a6b3c] dark:text-[#4ade80] underline inline-flex items-center gap-1">
            mem.gob.do <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>{' '}
          (un PDF y un Excel de anexos). El MEM elabora el informe con datos de las propias empresas (formularios y flujos de caja
          remitidos por el CUED, EGEHID, ETED y EGEPC), de su Dirección de Mercado Eléctrico, del Banco Central, del Ministerio de
          Hacienda y de las resoluciones de la Superintendencia de Electricidad.
        </P>
        <P>
          Cada edición se publica aproximadamente <strong>dos meses después</strong> del mes que cubre y contiene toda la serie
          histórica desde enero de 2009.
        </P>
        {editions.length > 0 && (
          <div className="rounded-lg border border-[#e5e7eb] dark:border-[#30363d] bg-white dark:bg-[#161b22] p-4 mb-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6b7280] mb-2">Ediciones cargadas</p>
            <ul className="text-sm space-y-1">
              {editions.map(e => (
                <li key={e.edition} className="flex flex-wrap gap-x-3">
                  <span className="font-medium text-[#1c1c1e] dark:text-[#e6edf3] w-32 capitalize">{monthYear(e.edition)}</span>
                  {e.source_url && <a href={e.source_url} target="_blank" rel="noopener noreferrer" className="text-[#1a6b3c] dark:text-[#4ade80] underline text-xs">Excel</a>}
                  {e.pdf_url && <a href={e.pdf_url} target="_blank" rel="noopener noreferrer" className="text-[#1a6b3c] dark:text-[#4ade80] underline text-xs">PDF</a>}
                </li>
              ))}
            </ul>
          </div>
        )}

        <H2 id="contenido">Qué contiene</H2>
        <P>Se cargan las once hojas del Excel de anexos:</P>
        <ul className="text-sm text-[#374151] dark:text-[#c9d1d9] space-y-2 mb-3">
          {SHEETS.map(([name, text]) => <li key={name}><strong>{name}:</strong> {text}</li>)}
        </ul>

        <H2 id="verificacion">Carga y verificación</H2>
        <P>
          La estructura de cada hoja (qué fila corresponde a qué indicador, su unidad y su empresa) está definida de forma explícita y
          versionada. Si una edición nueva cambia filas o etiquetas, la carga se detiene hasta revisarla: ningún dato se asigna por
          aproximación. Cada valor guarda la edición, la hoja y la celda del Excel de donde salió.
        </P>
        <P>Antes de publicar una edición se comprueba, con los propios totales del informe:</P>
        {run?.checks ? (
          <ul className="space-y-2 mb-3">
            {run.checks.map(c => (
              <li key={c.check} className="flex gap-2 text-sm text-[#374151] dark:text-[#c9d1d9]">
                <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-[#1a6b3c] dark:text-[#4ade80]" aria-hidden="true" />
                <span>{c.description} <span className="text-[#6b7280]">({c.compared.toLocaleString('es-DO')} comparaciones en la última carga; diferencias: {c.mismatches.toLocaleString('es-DO')}, todas documentadas como anomalías de la fuente)</span></span>
              </li>
            ))}
          </ul>
        ) : <P>Las verificaciones se muestran tras la primera carga.</P>}
        <P>
          Además, las cifras del resumen ejecutivo del PDF se cotejan con la base de datos: en la edición de julio 2026 coincidieron
          las 14 cifras revisadas (energía comprada y facturada, facturación, cobros, gastos, inversiones, pérdidas, cobranza, CRI,
          recuperación de energía y tasa de cambio).
        </P>
        {run && (
          <P>
            Última carga: {new Date(run.finished_at).toLocaleDateString('es-DO', { day: 'numeric', month: 'long', year: 'numeric' })} ·{' '}
            {Number(run.stats.indicators).toLocaleString('es-DO')} indicadores · {Number(run.stats.values).toLocaleString('es-DO')} valores.
          </P>
        )}

        <H2 id="correcciones">Correcciones del MEM</H2>
        <P>
          El MEM puede corregir datos ya publicados. Al cargar cada edición se compara cada valor con el de la edición anterior; el
          Observatorio muestra siempre el valor más reciente y registra el cambio. Ver el{' '}
          <Link href="/observatorio/correcciones" className="text-[#1a6b3c] dark:text-[#4ade80] underline">registro de correcciones</Link>.
        </P>

        <H2 id="anomalias">Anomalías detectadas en la fuente</H2>
        <P>Inconsistencias del propio Excel del MEM que las verificaciones detectaron y que se documentan en lugar de ocultarse:</P>
        <ul className="text-sm text-[#374151] dark:text-[#c9d1d9] space-y-2 mb-3 list-disc pl-5">
          {anomalies.map(a => <li key={`${a.check}-${a.key}-${a.edition ?? ''}`}>{a.explanation}</li>)}
          <li>En la edición de julio 2026, el período tarifario &quot;abr - may 26&quot; aparece duplicado como &quot;abr - jun 26&quot; con valores idénticos (verificado); se usa una sola vez.</li>
          <li>En la edición de abril 2026 la hoja de las distribuidoras se llamó &quot;EDE&quot; en lugar de &quot;EDE&apos;s&quot;, y en marzo y abril el anexo financiero de EGEPC usó otro formato; ambos casos se reconocen de forma explícita.</li>
        </ul>

        <H2 id="notas">Notas metodológicas</H2>
        <ul className="text-sm text-[#374151] dark:text-[#c9d1d9] space-y-2 mb-3 list-disc pl-5">
          <li>Los indicadores de gestión siguen un enfoque comercial (devengado); los anexos financieros siguen un enfoque de caja (lo efectivamente cobrado y pagado).</li>
          <li>Los porcentajes se expresan de 0 a 100. &quot;Año móvil&quot; significa los 12 meses que terminan en el mes indicado.</li>
          <li>La deuda con las generadoras es un saldo al cierre de cada mes; cada edición aporta el saldo de su mes.</li>
          <li>Las tarifas se presentan como la tarifa vigente en cada mes. Hasta octubre 2021 la tarifa aplicada fue única para las tres distribuidoras.</li>
          <li>El costo marginal de potencia figura en el informe como cUS$/kW-mes; sus valores son coherentes con US$/kW-mes. Se mantiene la unidad publicada con una nota hasta su confirmación.</li>
          <li>La hoja CDEEE solo tiene datos hasta enero 2024.</li>
        </ul>

        <H2 id="glosario">Glosario (según el informe del MEM)</H2>
        <dl className="space-y-3 mb-3">
          {GLOSSARY.map(g => (
            <div key={g.term}>
              <dt className="text-sm font-semibold text-[#1c1c1e] dark:text-[#e6edf3]">{g.term}</dt>
              <dd className="text-sm text-[#374151] dark:text-[#c9d1d9]">
                {g.text}
                {g.formula && <span className="block mt-1 font-mono text-xs bg-[#f4f6f4] dark:bg-[#0d1117] rounded px-2 py-1">{g.formula}</span>}
              </dd>
            </div>
          ))}
        </dl>

        <H2 id="citar">Cómo citar</H2>
        <P>Se recomienda citar la fuente original y el Observatorio, por ejemplo:</P>
        <p className="text-sm font-mono bg-[#f4f6f4] dark:bg-[#0d1117] rounded p-3 text-[#374151] dark:text-[#c9d1d9] mb-3">
          Ministerio de Energía y Minas (MEM), Informe de Desempeño de las Empresas Eléctricas Estatales,
          {editions[0] ? ` edición ${monthYear(editions[0].edition)}` : ''}. Procesado por el Observatorio Energético de la
          Secretaría de Energía de Fuerza del Pueblo.
        </p>
        <P>Cada indicador puede descargarse en CSV, con la celda de origen de cada valor.</P>
      </div>
    </>
  )
}
