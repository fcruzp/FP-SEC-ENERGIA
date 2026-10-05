import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Observatorio Energético · Secretaría de Energía',
  description:
    'Indicadores del sector eléctrico dominicano a partir de datos oficiales del Ministerio de Energía y Minas: series históricas, gráficos y análisis.',
}

export default function ObservatorioLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#f4f6f4] dark:bg-[#0d1117]">
      {children}
    </div>
  )
}
