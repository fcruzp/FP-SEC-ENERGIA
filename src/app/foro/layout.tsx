import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Foro Ciudadano (vista previa) · Secretaría de Energía',
  description: 'Vista previa del Foro Ciudadano: un espacio para debatir los datos del sector eléctrico dominicano.',
  robots: { index: false, follow: false },
}

export default function ForoLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#f4f6f4] dark:bg-[#0d1117]">{children}</div>
}
