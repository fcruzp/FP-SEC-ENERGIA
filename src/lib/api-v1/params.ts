import { z } from 'zod'

/** Validación de parámetros de /api/v1 (los errores se responden como 422). */

export const periodo = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'use el formato AAAA-MM (p. ej. 2026-07)')
export const slug = z.string().regex(/^[a-z0-9-]{1,120}$/, 'slug inválido (minúsculas, números y guiones)')

const bool = z.enum(['true', 'false']).transform(v => v === 'true')

function rango<T extends { desde?: string; hasta?: string }>(schema: z.ZodType<T>) {
  return schema.refine(v => !v.desde || !v.hasta || v.desde <= v.hasta, { message: '"desde" debe ser anterior o igual a "hasta"', path: ['desde'] })
}

export const indicadoresQuery = z.object({
  categoria: slug.optional(),
  entidad: slug.optional(),
  q: z.string().trim().min(2, 'mínimo 2 caracteres').max(80).optional(),
  incluir_desgloses: bool.default(false),
  limite: z.coerce.number().int().min(1).max(500).default(100),
  pagina: z.coerce.number().int().min(1).default(1),
})

export const MAX_SERIE = 300
export const serieQuery = rango(z.object({
  desde: periodo.optional(),
  hasta: periodo.optional(),
  limite: z.coerce.number().int().min(1).max(MAX_SERIE).default(MAX_SERIE),
}))

export const MAX_COMPARAR = 6
export const compararQuery = rango(z.object({
  slugs: z.string()
    .transform(s => [...new Set(s.split(',').map(x => x.trim()).filter(Boolean))])
    .pipe(z.array(slug).min(1, 'indique al menos un slug').max(MAX_COMPARAR, `máximo ${MAX_COMPARAR} indicadores`)),
  desde: periodo.optional(),
  hasta: periodo.optional(),
}))

export const correccionesQuery = z.object({
  slug: slug.optional(),
  edicion: periodo.optional(),
  limite: z.coerce.number().int().min(1).max(1000).default(200),
})

/** Convierte los parámetros de la URL en objeto (solo la primera aparición de cada uno). */
export function queryObject(url: URL): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of url.searchParams) if (!(k in out)) out[k] = v
  return out
}
