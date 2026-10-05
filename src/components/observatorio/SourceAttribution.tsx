import { ExternalLink } from 'lucide-react'
import { editionFromSourceFile, getSource } from '@/lib/sources'

interface SourceAttributionProps {
  /** Código de fuente (indicators.source), p. ej. 'MEM' */
  sourceCode?: string | null
  /** Archivo de origen (data_points.source_file), para mostrar la edición */
  sourceFile?: string | null
  className?: string
}

/** Cita de la fuente oficial de un dato o conjunto de datos. */
export default function SourceAttribution({ sourceCode = 'MEM', sourceFile, className = '' }: SourceAttributionProps) {
  const source = getSource(sourceCode)
  if (!source) return null
  const edition = editionFromSourceFile(sourceFile)

  return (
    <p className={`text-xs text-[#6b7280] dark:text-[#8b949e] leading-relaxed ${className}`}>
      <span className="font-semibold">Fuente:</span> {source.institution} ({source.short}),{' '}
      <em>{source.publication}</em>
      {edition && <>, edición {edition}</>}.{' '}
      <a
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 underline underline-offset-2 hover:text-[#16a34a] dark:hover:text-[#4ade80]"
      >
        {source.domain}
        <ExternalLink className="h-3 w-3" aria-hidden="true" />
      </a>
    </p>
  )
}
