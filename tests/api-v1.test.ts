import { describe, expect, test } from 'bun:test'
import { KEY_PATTERN, PREFIX_LENGTH, generateApiKey, hashApiKey, readBearer } from '../src/lib/api-v1/keys'
import { evaluateAccess, type AuthResult } from '../src/lib/api-v1/access'
import { compararQuery, indicadoresQuery, serieQuery } from '../src/lib/api-v1/params'
import { buildOpenApi } from '../src/lib/api-v1/openapi'

describe('llaves', () => {
  test('formato, prefijo y hash', () => {
    const { key, prefix, hash } = generateApiKey()
    expect(key).toMatch(KEY_PATTERN)
    expect(prefix).toBe(key.slice(0, PREFIX_LENGTH))
    expect(hash).toBe(hashApiKey(key))
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
    expect(hash).not.toContain(key.slice(9))
  })

  test('no se repiten', () => {
    const keys = new Set(Array.from({ length: 500 }, () => generateApiKey().key))
    expect(keys.size).toBe(500)
  })

  test('solo se acepta en la cabecera Bearer', () => {
    expect(readBearer('Bearer fpe_live_x')).toBe('fpe_live_x')
    expect(readBearer('bearer   fpe_live_x ')).toBe('fpe_live_x')
    expect(readBearer('Basic abc')).toBeNull()
    expect(readBearer('fpe_live_x')).toBeNull()
    expect(readBearer(null)).toBeNull()
  })
})

describe('evaluateAccess', () => {
  const ok: AuthResult = {
    status: 'ok', client_id: 'c1', client_name: 'Sky', scopes: ['read:catalog', 'read:data'],
    allowed_ips: null, limit_minute: 60, limit_day: 10000, used_minute: 1, used_day: 1, reset_minute: null,
  }

  test('permite una llave vigente con el permiso', () => {
    expect(evaluateAccess(ok, 'read:data', '1.2.3.4')).toBeNull()
  })

  test.each([
    [null, 401, 'llave_invalida'],
    [{ ...ok, status: 'invalid' as const }, 401, 'llave_invalida'],
    [{ ...ok, status: 'revoked' as const }, 401, 'llave_revocada'],
    [{ ...ok, status: 'expired' as const }, 401, 'llave_vencida'],
    [{ ...ok, status: 'rate_limited_minute' as const }, 429, 'limite_por_minuto'],
    [{ ...ok, status: 'rate_limited_day' as const }, 429, 'limite_diario'],
  ])('rechaza %#', (auth, status, code) => {
    const denied = evaluateAccess(auth, 'read:data', null)
    expect(denied?.status).toBe(status)
    expect(denied?.code).toBe(code)
  })

  test('rechaza sin el permiso requerido', () => {
    expect(evaluateAccess(ok, 'read:revisions', null)?.code).toBe('permiso_insuficiente')
  })

  test('una llave revocada no pasa aunque tenga permisos', () => {
    expect(evaluateAccess({ ...ok, status: 'revoked' }, 'read:catalog', null)?.status).toBe(401)
  })

  test('restricción por IP', () => {
    const restricted = { ...ok, allowed_ips: ['10.0.0.1'] }
    expect(evaluateAccess(restricted, 'read:data', '10.0.0.1')).toBeNull()
    expect(evaluateAccess(restricted, 'read:data', '10.0.0.2')?.code).toBe('ip_no_permitida')
    expect(evaluateAccess(restricted, 'read:data', null)?.code).toBe('ip_no_permitida')
  })
})

describe('parámetros', () => {
  test('periodos AAAA-MM y rango', () => {
    expect(serieQuery.parse({ desde: '2025-01', hasta: '2026-07' })).toMatchObject({ desde: '2025-01', hasta: '2026-07', limite: 300 })
    expect(() => serieQuery.parse({ desde: '2026-13' })).toThrow()
    expect(() => serieQuery.parse({ desde: '2026-7' })).toThrow()
    expect(() => serieQuery.parse({ desde: '2026-05', hasta: '2026-01' })).toThrow()
    expect(() => serieQuery.parse({ limite: '301' })).toThrow()
  })

  test('comparar: lista sin duplicados y máximo 6', () => {
    expect(compararQuery.parse({ slugs: 'a,b, a ,c' }).slugs).toEqual(['a', 'b', 'c'])
    expect(() => compararQuery.parse({ slugs: 'a,b,c,d,e,f,g' })).toThrow()
    expect(() => compararQuery.parse({ slugs: 'A;DROP' })).toThrow()
    expect(() => compararQuery.parse({})).toThrow()
  })

  test('indicadores: valores por defecto', () => {
    expect(indicadoresQuery.parse({})).toEqual({ incluir_desgloses: false, limite: 100, pagina: 1 })
    expect(indicadoresQuery.parse({ incluir_desgloses: 'true', q: ' perdidas ' })).toMatchObject({ incluir_desgloses: true, q: 'perdidas' })
    expect(() => indicadoresQuery.parse({ q: 'x' })).toThrow()
  })
})

describe('OpenAPI', () => {
  const spec = buildOpenApi('https://ejemplo.org') as any

  test('todas las referencias existen', () => {
    const refs = [...JSON.stringify(spec).matchAll(/"\$ref":"#\/components\/(\w+)\/(\w+)"/g)]
    expect(refs.length).toBeGreaterThan(20)
    for (const [, section, name] of refs) expect(spec.components[section]?.[name]).toBeDefined()
  })

  test('documenta cada ruta de /api/v1 con datos', async () => {
    const glob = new Bun.Glob('src/app/api/v1/**/route.ts')
    const routes: string[] = []
    for await (const file of glob.scan('.')) {
      const path = file.replace(/\\/g, '/').replace('src/app/api/v1', '').replace('/route.ts', '').replace(/\[(\w+)\]/g, '{$1}')
      if (path && path !== '/openapi.json') routes.push(path)
    }
    expect(routes.sort()).toEqual(Object.keys(spec.paths).sort())
  })

  test('las herramientas de Sky coinciden con el contrato', async () => {
    const tools = (await Bun.file('docs/api/sky-tools.json').json()).tools
    expect(tools.length).toBe(7)
    for (const tool of tools) {
      const op = spec.paths[tool['x-http'].path]?.get
      expect(op).toBeDefined()
      const documented = new Set((op.parameters ?? []).map((p: any) => p.name))
      for (const name of Object.keys(tool.function.parameters.properties)) expect(documented.has(name)).toBe(true)
    }
  })

  test('todo endpoint exige la llave', () => {
    expect(spec.security).toEqual([{ llave: [] }])
    for (const item of Object.values<any>(spec.paths)) {
      expect(item.get.security).toBeUndefined()
      expect(item.get.responses['401']).toBeDefined()
    }
  })
})
