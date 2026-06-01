import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Observatorio Energético · Secretaría de Energía',
  description:
    'Monitoreo en tiempo real de los indicadores clave del sector eléctrico dominicano. Datos, gráficos y análisis del Observatorio Energético.',
}

export default function ObservatorioLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#f4f6f4]">
      {children}
    </div>
  )
}
