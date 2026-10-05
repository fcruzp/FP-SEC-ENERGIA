/**
 * Fuentes oficiales de los datos del Observatorio.
 *
 * Regla: todo dato mostrado debe atribuirse a su fuente original.
 * El código de fuente coincide con `indicators.source` en la base de datos.
 */

export interface DataSource {
  code: string
  /** Nombre corto para etiquetas */
  short: string
  /** Institución */
  institution: string
  /** Publicación de la que se extraen los datos */
  publication: string
  /** Página oficial donde se publica */
  url: string
  domain: string
}

export const SOURCES: Record<string, DataSource> = {
  MEM: {
    code: 'MEM',
    short: 'MEM',
    institution: 'Ministerio de Energía y Minas',
    publication: 'Informe de Desempeño de las Empresas Eléctricas Estatales',
    url: 'https://mem.gob.do/category/sector-electrico/informe-de-desempeno/',
    domain: 'mem.gob.do',
  },
  OC: {
    code: 'OC',
    short: 'OC-SENI',
    institution: 'Organismo Coordinador del Sistema Eléctrico Nacional Interconectado',
    publication: 'Publicaciones del Organismo Coordinador',
    url: 'https://www.oc.org.do/',
    domain: 'oc.org.do',
  },
}

export function getSource(code: string | null | undefined): DataSource | null {
  if (!code) return null
  return SOURCES[code] ?? null
}

const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

/**
 * Extrae la edición ("marzo 2026") del nombre del archivo del MEM,
 * p. ej. 'Informe-de-Desempeno-marzo-2026.xlsx'.
 */
export function editionFromSourceFile(file: string | null | undefined): string | null {
  if (!file) return null
  const match = new RegExp(`(${MONTHS.join('|')})[^0-9]*(\\d{4})`, 'i').exec(file)
  if (!match) return null
  return `${match[1].toLowerCase()} ${match[2]}`
}
