import type { Metadata } from 'next'
import { KeyRound, ShieldCheck, Quote, Gauge } from 'lucide-react'
import ObservatorioHeader from '@/components/observatorio/ObservatorioHeader'
import SwaggerDocs from '@/components/observatorio/SwaggerDocs'

export const metadata: Metadata = {
  title: 'API para desarrolladores · Observatorio Energético',
  description: 'API de solo lectura con los datos oficiales del sector eléctrico dominicano (MEM), con su fuente. Documentación interactiva OpenAPI.',
}

const P = ({ children }: { children: React.ReactNode }) => (
  <p className="text-sm text-[#374151] dark:text-[#c9d1d9] leading-relaxed mb-3">{children}</p>
)
const Code = ({ children }: { children: React.ReactNode }) => (
  <code className="rounded bg-[#f3f4f6] dark:bg-[#161b22] px-1.5 py-0.5 text-[13px] text-[#1c1c1e] dark:text-[#e6edf3]">{children}</code>
)

const FEATURES = [
  { icon: KeyRound, title: 'Llave por aplicación', text: 'Cada aplicación recibe su propia llave, que se puede revocar sin afectar a las demás.' },
  { icon: Quote, title: 'Fuente en cada respuesta', text: 'meta.fuente trae la edición del informe del MEM, la fecha de publicación, los enlaces y una cita lista.' },
  { icon: ShieldCheck, title: 'Solo lectura', text: 'Ninguna llave puede modificar datos. Errores en formato estándar RFC 9457.' },
  { icon: Gauge, title: 'Límites de uso', text: '60 peticiones por minuto y 10,000 por día por llave, informados en las cabeceras RateLimit-*.' },
]

export default function DesarrolladoresPage() {
  return (
    <>
      <ObservatorioHeader breadcrumbs={[{ label: 'Observatorio', href: '/observatorio' }, { label: 'API para desarrolladores' }]} />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#1a6b3c] dark:text-[#4ade80] mb-1">API v1</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1c1c1e] dark:text-[#e6edf3] mb-3">API del Observatorio Energético</h1>
        <div className="max-w-3xl">
          <P>
            Datos oficiales del sector eléctrico dominicano para otras aplicaciones, incluidos agentes de inteligencia artificial.
            La fuente actual es el <em>Informe de Desempeño de las Empresas Eléctricas Estatales</em> del Ministerio de Energía y
            Minas (MEM). Todos los datos son mensuales (<Code>AAAA-MM</Code>) y los porcentajes están en escala 0–100.
          </P>
          <P>
            El acceso requiere una llave emitida por la Secretaría de Energía. Se envía en la cabecera{' '}
            <Code>Authorization: Bearer &lt;llave&gt;</Code>, nunca en la URL. Para probar los endpoints abajo, pulse{' '}
            <strong>Authorize</strong> y pegue su llave; no se guarda en el navegador.
          </P>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 my-6">
          {FEATURES.map(f => (
            <div key={f.title} className="rounded-lg border border-[#e5e7eb] dark:border-[#30363d] bg-white dark:bg-[#0d1117] p-4">
              <f.icon className="h-5 w-5 text-[#1a6b3c] dark:text-[#4ade80] mb-2" aria-hidden="true" />
              <div className="text-sm font-semibold text-[#1c1c1e] dark:text-[#e6edf3]">{f.title}</div>
              <div className="text-xs text-[#6b7280] dark:text-[#8b949e] mt-1 leading-relaxed">{f.text}</div>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-[#e5e7eb] dark:border-[#30363d] bg-[#f9fafb] dark:bg-[#0d1117] p-4 mb-6 overflow-x-auto">
          <div className="text-xs font-semibold text-[#6b7280] dark:text-[#8b949e] mb-2">Ejemplo</div>
          <pre className="text-[13px] text-[#1c1c1e] dark:text-[#e6edf3] whitespace-pre">{`curl -H "Authorization: Bearer $FP_ENERGIA_API_KEY" \\
  https://energia-fp.netlify.app/api/v1/indicadores/edes-perdidas-ano-movil/serie?desde=2025-01`}</pre>
        </div>

        <div className="rounded-lg border border-[#e5e7eb] dark:border-[#30363d] bg-white p-2 sm:p-4">
          <SwaggerDocs />
        </div>
        <p className="text-xs text-[#6b7280] dark:text-[#8b949e] mt-3">
          Contrato OpenAPI 3.1: <a href="/api/v1/openapi.json" className="underline">/api/v1/openapi.json</a>
        </p>
      </div>
    </>
  )
}
