import { API_VERSION } from './version'
import { MAX_COMPARAR, MAX_SERIE } from './params'
import { SCOPES } from './keys'

/**
 * Contrato OpenAPI 3.1 de /api/v1. Lo sirve /api/v1/openapi.json y lo muestra
 * Swagger UI en /desarrolladores. Mantener sincronizado con las rutas.
 */

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` })
const nullable = (schema: object) => ({ oneOf: [schema, { type: 'null' }] })

const envelope = (data: object, meta: object = ref('Meta')) => ({
  type: 'object',
  required: ['data', 'meta'],
  properties: { data, meta },
})

const json = (schema: object, description = 'Correcto') => ({
  description,
  headers: {
    'X-Request-Id': { $ref: '#/components/headers/RequestId' },
    'RateLimit-Limit': { $ref: '#/components/headers/RateLimitLimit' },
    'RateLimit-Remaining': { $ref: '#/components/headers/RateLimitRemaining' },
  },
  content: { 'application/json': { schema } },
})

const errors = (...codes: number[]) =>
  Object.fromEntries(codes.map(code => [String(code), { $ref: `#/components/responses/E${code}` }]))

const query = (name: string, description: string, schema: object, example?: unknown) => ({
  name, in: 'query', required: false, description, schema, ...(example !== undefined ? { example } : {}),
})

const periodo = { type: 'string', pattern: '^\\d{4}-(0[1-9]|1[0-2])$', examples: ['2026-07'] }
const slugParam = {
  name: 'slug', in: 'path', required: true,
  description: 'Identificador exacto del indicador (búsquelo con GET /indicadores).',
  schema: { type: 'string', pattern: '^[a-z0-9-]{1,120}$' },
  example: 'edes-perdidas-ano-movil',
}

export function buildOpenApi(serverUrl: string) {
  return {
    openapi: '3.1.0',
    info: {
      title: 'API del Observatorio Energético',
      version: API_VERSION,
      summary: 'Datos oficiales del sector eléctrico dominicano, con su fuente.',
      description: [
        'API de **solo lectura** del Observatorio Energético de la Secretaría de Energía de Fuerza del Pueblo.',
        '',
        'Fuente actual: *Informe de Desempeño de las Empresas Eléctricas Estatales* del **Ministerio de Energía y Minas (MEM)**, edición mensual (Excel y PDF).',
        'Cada respuesta con datos incluye `meta.fuente` con la edición, la fecha de publicación, los enlaces oficiales y una `cita` lista para usar.',
        '',
        '**Autenticación**: cabecera `Authorization: Bearer <llave>`. Las llaves se emiten por aplicación y se pueden revocar.',
        '**Límites**: 60 peticiones por minuto y 10,000 por día por llave (salvo acuerdo). Al excederlos se responde 429 con `Retry-After`.',
        '**Periodos**: todos los datos son mensuales, en formato `AAAA-MM`. Los porcentajes están en escala 0–100.',
        '**Errores**: formato RFC 9457 (`application/problem+json`) con `code` y `request_id`.',
        '',
        'Recomendado para agentes de IA: empezar por `/resumen`, buscar slugs con `/indicadores?q=` y pedir datos por slug exacto. Citar siempre `meta.fuente.cita`.',
      ].join('\n'),
      contact: { name: 'Secretaría de Energía — Fuerza del Pueblo' },
    },
    servers: [{ url: `${serverUrl}/api/v1`, description: 'Servidor actual' }],
    security: [{ llave: [] }],
    tags: [
      { name: 'General', description: 'Fuentes, ediciones y panorama del sector' },
      { name: 'Catálogo', description: 'Categorías, entidades e indicadores' },
      { name: 'Datos', description: 'Series y comparaciones' },
      { name: 'Correcciones', description: 'Cambios del MEM entre ediciones' },
    ],
    paths: {
      '/meta': {
        get: {
          tags: ['General'], operationId: 'meta', summary: 'Fuentes y ediciones',
          description: `Fuentes de datos, ediciones del informe cargadas, edición vigente, calendario y totales. Permiso: \`read:catalog\`.`,
          responses: { 200: json(envelope({ type: 'object' })), ...errors(401, 403, 429, 500) },
        },
      },
      '/resumen': {
        get: {
          tags: ['General'], operationId: 'resumen', summary: 'Panorama del sector eléctrico',
          description: 'Indicadores clave (generación, costo marginal, pérdidas, cobranza, CRI, precios, déficit, deuda con generadoras, combustibles, tasa de cambio) con último valor, anterior, hace 12 meses, variaciones y desglose por empresa. Permiso: `read:data`.',
          responses: {
            200: json(envelope({
              type: 'object',
              properties: {
                periodo_vigente: nullable(periodo),
                indicadores: { type: 'array', items: ref('IndicadorResumenSector') },
              },
            })),
            ...errors(401, 403, 429, 500),
          },
        },
      },
      '/categorias': {
        get: {
          tags: ['Catálogo'], operationId: 'categorias', summary: 'Categorías',
          description: 'Categorías de indicadores (variables relevantes, distribuidoras, EGEHID, ETED, Punta Catalina, resultados financieros, deuda, tarifas…). Permiso: `read:catalog`.',
          responses: { 200: json(envelope({ type: 'array', items: ref('Categoria') })), ...errors(401, 403, 429, 500) },
        },
      },
      '/entidades': {
        get: {
          tags: ['Catálogo'], operationId: 'entidades', summary: 'Entidades',
          description: 'Empresas y agrupaciones (Edenorte, Edesur, Edeeste, EGEHID, ETED, generadoras privadas…). Permiso: `read:catalog`.',
          responses: { 200: json(envelope({ type: 'array', items: ref('Entidad') })), ...errors(401, 403, 429, 500) },
        },
      },
      '/indicadores': {
        get: {
          tags: ['Catálogo'], operationId: 'buscarIndicadores', summary: 'Buscar indicadores',
          description: 'Lista o busca indicadores. La búsqueda de texto (`q`) sirve para **descubrir** slugs; los datos se piden siempre por slug exacto. Con permiso `read:data` incluye el último valor. Permiso: `read:catalog`.',
          parameters: [
            query('categoria', 'Slug de categoría', { type: 'string' }, 'empresas-distribuidoras'),
            query('entidad', 'Slug de entidad (incluye sus desgloses)', { type: 'string' }, 'edesur'),
            query('q', 'Texto a buscar en nombre y slug (sin importar acentos)', { type: 'string', minLength: 2, maxLength: 80 }, 'perdidas'),
            query('incluir_desgloses', 'Incluir desgloses (por empresa, por concepto)', { type: 'boolean', default: false }),
            query('limite', 'Resultados por página', { type: 'integer', minimum: 1, maximum: 500, default: 100 }),
            query('pagina', 'Página', { type: 'integer', minimum: 1, default: 1 }),
          ],
          responses: { 200: json(envelope({ type: 'array', items: ref('IndicadorResumen') }, ref('MetaPaginada'))), ...errors(401, 403, 404, 422, 429, 500) },
        },
      },
      '/indicadores/{slug}': {
        get: {
          tags: ['Catálogo'], operationId: 'fichaIndicador', summary: 'Ficha de un indicador',
          description: 'Definición, fórmula, fuente primaria, desgloses, cobertura y (con `read:data`) último valor, anterior, hace 12 meses y variaciones. Permiso: `read:catalog`.',
          parameters: [slugParam],
          responses: { 200: json(envelope(ref('IndicadorFicha'))), ...errors(401, 403, 404, 422, 429, 500) },
        },
      },
      '/indicadores/{slug}/serie': {
        get: {
          tags: ['Datos'], operationId: 'serieIndicador', summary: 'Serie mensual',
          description: `Serie mensual ascendente. Cada punto indica la edición de la que proviene su valor y la celda del Excel del MEM. Máximo ${MAX_SERIE} puntos; si hay más, se devuelven los más recientes (\`meta.truncado\`). Permiso: \`read:data\`.`,
          parameters: [
            slugParam,
            query('desde', 'Primer mes (AAAA-MM)', periodo, '2025-01'),
            query('hasta', 'Último mes (AAAA-MM)', periodo, '2026-07'),
            query('limite', 'Máximo de puntos', { type: 'integer', minimum: 1, maximum: MAX_SERIE, default: MAX_SERIE }),
          ],
          responses: {
            200: json(envelope({
              type: 'object',
              properties: { indicador: ref('IndicadorResumen'), puntos: { type: 'array', items: ref('Punto') } },
            })),
            ...errors(401, 403, 404, 422, 429, 500),
          },
        },
      },
      '/comparar': {
        get: {
          tags: ['Datos'], operationId: 'compararIndicadores', summary: 'Comparar series',
          description: `Hasta ${MAX_COMPARAR} series alineadas por mes (p. ej. pérdidas de Edenorte, Edesur y Edeeste). Un mes sin dato es \`null\`: nunca se interpola. Permiso: \`read:data\`.`,
          parameters: [
            { name: 'slugs', in: 'query', required: true, description: `Slugs separados por coma (máx. ${MAX_COMPARAR})`, schema: { type: 'string' }, example: 'edes-perdidas-ano-movil-edenorte,edes-perdidas-ano-movil-edesur,edes-perdidas-ano-movil-edeeste' },
            query('desde', 'Primer mes (AAAA-MM)', periodo, '2025-01'),
            query('hasta', 'Último mes (AAAA-MM)', periodo),
          ],
          responses: {
            200: json(envelope({
              type: 'object',
              properties: {
                indicadores: { type: 'array', items: ref('IndicadorResumen') },
                filas: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: { periodo, valores: { type: 'object', additionalProperties: nullable({ type: 'number' }) } },
                  },
                },
              },
            })),
            ...errors(401, 403, 404, 422, 429, 500),
          },
        },
      },
      '/correcciones': {
        get: {
          tags: ['Correcciones'], operationId: 'correcciones', summary: 'Correcciones del MEM',
          description: 'Valores que el MEM cambió al publicar una edición nueva. Permiso: `read:revisions`.',
          parameters: [
            query('slug', 'Solo de este indicador', { type: 'string' }),
            query('edicion', 'Solo las hechas por esta edición (AAAA-MM)', periodo),
            query('limite', 'Máximo de resultados', { type: 'integer', minimum: 1, maximum: 1000, default: 200 }),
          ],
          responses: { 200: json(envelope({ type: 'array', items: ref('Correccion') })), ...errors(401, 403, 404, 422, 429, 500) },
        },
      },
    },
    components: {
      securitySchemes: {
        llave: {
          type: 'http', scheme: 'bearer', bearerFormat: 'fpe_live_…',
          description: `Llave de API emitida por el Observatorio. Permisos posibles: ${Object.entries(SCOPES).map(([k, v]) => `\`${k}\` (${v})`).join(', ')}.`,
        },
      },
      headers: {
        RequestId: { description: 'Identificador de la petición (indíquelo al reportar un problema)', schema: { type: 'string' } },
        RateLimitLimit: { description: 'Peticiones permitidas por minuto', schema: { type: 'integer' } },
        RateLimitRemaining: { description: 'Peticiones restantes en el minuto actual', schema: { type: 'integer' } },
      },
      responses: {
        E401: problemResponse('Llave ausente, inválida, revocada o vencida'),
        E403: problemResponse('La llave no tiene el permiso requerido'),
        E404: problemResponse('Indicador, categoría, entidad o edición no encontrados'),
        E422: problemResponse('Parámetros inválidos'),
        E429: { ...problemResponse('Límite de uso alcanzado'), headers: { 'Retry-After': { description: 'Segundos a esperar', schema: { type: 'integer' } } } },
        E500: problemResponse('Error interno'),
      },
      schemas: {
        Problema: {
          type: 'object',
          description: 'Error RFC 9457',
          required: ['title', 'status', 'code', 'request_id'],
          properties: {
            type: { type: 'string' }, title: { type: 'string' }, status: { type: 'integer' },
            detail: { type: 'string' }, code: { type: 'string', examples: ['llave_invalida', 'indicador_no_encontrado', 'parametros_invalidos'] },
            request_id: { type: 'string' },
          },
        },
        Fuente: {
          type: 'object',
          description: 'Procedencia de los datos, lista para citar',
          properties: {
            organismo: { type: 'string', examples: ['Ministerio de Energía y Minas (MEM)'] },
            publicacion: { type: 'string' },
            edicion: periodo,
            titulo: { type: 'string' },
            publicado: nullable({ type: 'string', format: 'date' }),
            excel_url: nullable({ type: 'string', format: 'uri' }),
            pdf_url: nullable({ type: 'string', format: 'uri' }),
            pagina: { type: 'string', format: 'uri' },
            cita: { type: 'string', description: 'Texto de cita recomendado' },
          },
        },
        Meta: {
          type: 'object',
          properties: {
            fuente: ref('Fuente'),
            nota_fuente: { type: 'string' },
            api_version: { type: 'string' },
            request_id: { type: 'string' },
            generado: { type: 'string', format: 'date-time' },
          },
        },
        MetaPaginada: {
          allOf: [ref('Meta'), {
            type: 'object',
            properties: { total: { type: 'integer' }, pagina: { type: 'integer' }, limite: { type: 'integer' }, paginas: { type: 'integer' } },
          }],
        },
        Valor: { type: 'object', properties: { periodo, valor: { type: 'number' } } },
        Variacion: {
          type: 'object',
          properties: {
            absoluta: { type: 'number', description: 'En la unidad del indicador (puntos porcentuales si la unidad es %)' },
            relativa_pct: nullable({ type: 'number' }),
          },
        },
        Categoria: {
          type: 'object',
          properties: { slug: { type: 'string' }, nombre: { type: 'string' }, descripcion: nullable({ type: 'string' }), indicadores: { type: 'integer' }, desgloses: { type: 'integer' } },
        },
        Entidad: {
          type: 'object',
          properties: { slug: { type: 'string' }, nombre: { type: 'string' }, tipo: { type: 'string' }, tipo_nombre: { type: 'string' }, indicadores: { type: 'integer' } },
        },
        IndicadorResumen: {
          type: 'object',
          properties: {
            slug: { type: 'string' }, nombre: { type: 'string' }, unidad: { type: 'string', examples: ['%', 'GWh', 'US$ MM', 'cUS$/kWh'] },
            categoria: nullable({ type: 'string' }), entidad: nullable({ type: 'string' }),
            es_desglose: { type: 'boolean' }, indicador_padre: nullable({ type: 'string' }),
            fuente: { type: 'string', examples: ['MEM'] },
            ultimo: nullable(ref('Valor')),
          },
        },
        IndicadorFicha: {
          allOf: [ref('IndicadorResumen'), {
            type: 'object',
            properties: {
              categoria_nombre: nullable({ type: 'string' }), entidad_nombre: nullable({ type: 'string' }),
              definicion: nullable({ type: 'string' }), formula: nullable({ type: 'string' }),
              fuente_primaria: nullable({ type: 'string' }), notas: nullable({ type: 'string' }),
              origen: { type: 'object', properties: { hoja: nullable({ type: 'string' }), etiqueta: nullable({ type: 'string' }) } },
              desgloses: { type: 'array', items: { type: 'object', properties: { slug: { type: 'string' }, nombre: { type: 'string' }, entidad: nullable({ type: 'string' }) } } },
              cobertura: nullable({ type: 'object', properties: { desde: periodo, hasta: periodo, puntos: { type: 'integer' } } }),
              valores: nullable({
                type: 'object',
                properties: {
                  ultimo: ref('Valor'), anterior: nullable(ref('Valor')), hace_12_meses: nullable(ref('Valor')),
                  variacion_mensual: nullable(ref('Variacion')), variacion_interanual: nullable(ref('Variacion')),
                },
              }),
            },
          }],
        },
        IndicadorResumenSector: {
          type: 'object',
          properties: {
            slug: { type: 'string' }, nombre: { type: 'string' }, unidad: { type: 'string' },
            categoria: nullable({ type: 'string' }), entidad: nullable({ type: 'string' }), definicion: nullable({ type: 'string' }),
            ultimo: ref('Valor'), anterior: nullable(ref('Valor')), hace_12_meses: nullable(ref('Valor')),
            variacion_mensual: nullable(ref('Variacion')), variacion_interanual: nullable(ref('Variacion')),
            desgloses: {
              oneOf: [
                { type: 'array', items: { type: 'object', properties: { slug: { type: 'string' }, nombre: { type: 'string' }, entidad: nullable({ type: 'string' }), ultimo: nullable(ref('Valor')) } } },
                { type: 'object', properties: { cantidad: { type: 'integer' }, detalle: { type: 'string' } } },
              ],
            },
          },
        },
        Punto: {
          type: 'object',
          properties: {
            periodo, valor: { type: 'number' },
            edicion: nullable({ ...periodo, description: 'Edición más antigua cargada en el Observatorio que ya publicaba este mismo valor (ver meta.nota_fuente)' }),
            celda: nullable({ type: 'string', description: 'Hoja y celda del Excel del MEM', examples: ["EDE's!HN53"] }),
          },
        },
        Correccion: {
          type: 'object',
          properties: {
            indicador: { type: 'string' }, nombre: { type: 'string' }, unidad: { type: 'string' }, periodo,
            valor_anterior: { type: 'number' }, valor_nuevo: { type: 'number' },
            edicion_anterior: nullable(periodo), edicion_que_corrige: nullable(periodo),
          },
        },
      },
    },
  }
}

function problemResponse(description: string) {
  return { description, content: { 'application/problem+json': { schema: ref('Problema') } } }
}
