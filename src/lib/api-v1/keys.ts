import { createHash, randomBytes } from 'crypto'

/**
 * Llaves de la API de integración (/api/v1).
 *
 * Formato: `fpe_live_` + 32 caracteres base62 (≈190 bits de azar). El prefijo
 * fijo permite reconocer una llave filtrada (p. ej. con GitHub Secret Scanning).
 * En la base solo se guarda el hash SHA-256 y los primeros caracteres.
 */

export const KEY_TAG = 'fpe_live_'
export const KEY_PATTERN = /^fpe_live_[0-9A-Za-z]{32}$/
/** Caracteres que se guardan y muestran para identificar la llave */
export const PREFIX_LENGTH = KEY_TAG.length + 7

const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

export const SCOPES = {
  'read:catalog': 'Categorías, entidades, indicadores y definiciones',
  'read:data': 'Valores y series de los indicadores',
  'read:revisions': 'Correcciones del MEM entre ediciones',
} as const
export type Scope = keyof typeof SCOPES
export const ALL_SCOPES = Object.keys(SCOPES) as Scope[]

export function hashApiKey(key: string): string {
  return createHash('sha256').update(key, 'utf8').digest('hex')
}

/** Genera una llave nueva. La llave completa solo existe en este valor de retorno. */
export function generateApiKey(): { key: string; prefix: string; hash: string } {
  let body = ''
  while (body.length < 32) {
    for (const byte of randomBytes(48)) {
      // Muestreo por rechazo para no sesgar el alfabeto (248 = 62 × 4)
      if (byte < 248 && body.length < 32) body += ALPHABET[byte % 62]
    }
  }
  const key = KEY_TAG + body
  return { key, prefix: key.slice(0, PREFIX_LENGTH), hash: hashApiKey(key) }
}

/** Extrae la llave de `Authorization: Bearer …`. No acepta la llave en la URL. */
export function readBearer(header: string | null): string | null {
  if (!header) return null
  const match = /^Bearer\s+(\S+)\s*$/i.exec(header)
  return match ? match[1] : null
}
