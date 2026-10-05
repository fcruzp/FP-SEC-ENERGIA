/**
 * Fechas de solo-día ('YYYY-MM-DD') sin desfase de zona horaria.
 *
 * `new Date('2026-03-01')` se interpreta como medianoche UTC, que en
 * República Dominicana (UTC-4) es el 28 de febrero. Estas utilidades
 * construyen la fecha en hora local para que el mes mostrado sea el real.
 */

/** Convierte 'YYYY-MM-DD' (o 'YYYY-MM-DDTHH…') en un Date local a medianoche. */
export function parseDateOnly(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  if (!match) return new Date(value)
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
}

/** Formatea un Date local como 'YYYY-MM-DD'. */
export function toDateOnly(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Formatea una fecha de solo-día en español dominicano. */
export function formatDateOnly(
  value: string,
  options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long' },
): string {
  const date = parseDateOnly(value)
  if (isNaN(date.getTime())) return value
  return date.toLocaleDateString('es-DO', options)
}
