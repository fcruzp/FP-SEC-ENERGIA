# API del Observatorio Energético (v1): guía para desarrolladores

API de **solo lectura** con los datos oficiales del sector eléctrico dominicano. La fuente actual es el *Informe de Desempeño de las Empresas Eléctricas Estatales* del Ministerio de Energía y Minas (MEM).

- **Documentación interactiva (Swagger UI):** https://energia-fp.netlify.app/desarrolladores
- **Contrato OpenAPI 3.1:** https://energia-fp.netlify.app/api/v1/openapi.json
- **URL base:** `https://energia-fp.netlify.app/api/v1`
- Diseño y decisiones: [PLAN-API-INTEGRACION.md](../../PLAN-API-INTEGRACION.md)

## 1. Obtener una llave

Las llaves las emite el administrador del Observatorio, una por aplicación:

- **Desde el panel:** `/admin` → pestaña **Integraciones** → "Nueva llave". La llave se muestra **una sola vez**.
- **Desde la terminal:** `bun scripts/api-key.ts create --name "Sky" --contact "..."`. También existen `list` y `revoke --prefix fpe_live_XXXXXXX`.

Formato: `fpe_live_` + 32 caracteres. En la base solo queda su huella SHA-256, así que si se pierde se emite otra.

**Dónde guardarla:** en las variables de entorno de la aplicación (`FP_ENERGIA_API_KEY`). Nunca en el código, en un repositorio ni en un chat.

**Rotación sin cortes:**
1. Pulsar "Rotar" en Integraciones (crea una llave nueva y la anterior sigue activa).
2. Cambiar la variable de entorno en la aplicación.
3. Revocar la llave anterior.

## 2. Uso

```bash
curl -H "Authorization: Bearer $FP_ENERGIA_API_KEY" https://energia-fp.netlify.app/api/v1/resumen
```

| Endpoint | Permiso | Para qué |
|---|---|---|
| `GET /meta` | `read:catalog` | Fuentes, ediciones cargadas, edición vigente, calendario |
| `GET /resumen` | `read:data` | Panorama del sector en una llamada |
| `GET /categorias` | `read:catalog` | Categorías de indicadores |
| `GET /entidades` | `read:catalog` | Empresas (Edenorte, Edesur, Edeeste, EGEHID, ETED, generadoras…) |
| `GET /indicadores?q=&categoria=&entidad=` | `read:catalog` | Buscar slugs (incluye el último valor si la llave tiene `read:data`) |
| `GET /indicadores/{slug}` | `read:catalog` | Ficha: definición, fórmula, desgloses, cobertura, valores |
| `GET /indicadores/{slug}/serie?desde=&hasta=` | `read:data` | Serie mensual (máx. 300 puntos) |
| `GET /comparar?slugs=a,b,c` | `read:data` | Hasta 6 series alineadas por mes |
| `GET /correcciones?slug=&edicion=` | `read:revisions` | Cambios del MEM entre ediciones |

### Convenciones

- **Periodos** `AAAA-MM`; todos los datos son mensuales.
- **Porcentajes** en escala 0–100. La variación absoluta de un % está en puntos porcentuales.
- **Unidades** en el campo `unidad` (`GWh`, `US$ MM`, `cUS$/kWh`, `RD$/kWh`, `%`…).
- Cada respuesta con datos trae **`meta.fuente`**: edición, fecha de publicación, enlaces al Excel y al PDF del MEM, y `cita`, un texto listo para citar.
- En las series, `edicion` es la edición más antigua cargada en el Observatorio (desde marzo 2026) que ya publicaba ese mismo valor, y `celda` es la hoja y celda del Excel del MEM.
- Un mes sin dato es `null` o no aparece. **Nunca se interpola.**

### Errores

Formato RFC 9457 (`application/problem+json`):

```json
{ "title": "Llave revocada", "status": 401, "code": "llave_revocada", "detail": "...", "request_id": "..." }
```

| Código HTTP | `code` |
|---|---|
| 401 | `llave_requerida`, `llave_invalida`, `llave_revocada`, `llave_vencida` |
| 403 | `permiso_insuficiente`, `ip_no_permitida` |
| 404 | `indicador_no_encontrado`, `categoria_no_encontrada`, `entidad_no_encontrada`, `edicion_no_encontrada` |
| 422 | `parametros_invalidos` |
| 429 | `limite_por_minuto`, `limite_diario` (respetar `Retry-After`) |
| 500 | `error_interno` (indique el `request_id`) |

### Límites

Por defecto: 60 peticiones por minuto y 10,000 por día por llave. Se pueden ajustar por llave.

Cabeceras de cada respuesta: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset` y `X-Request-Id`.

## 3. Integración con Sky (agente con OpenRouter)

1. **Variables de entorno de Sky:**
   ```
   FP_ENERGIA_API_URL=https://energia-fp.netlify.app/api/v1
   FP_ENERGIA_API_KEY=fpe_live_…
   ```
2. **Herramientas:** [`sky-tools.json`](sky-tools.json) trae 7 herramientas en formato de *function calling* de OpenAI/OpenRouter (`energia_resumen`, `energia_buscar_indicadores`, `energia_ficha_indicador`, `energia_serie`, `energia_comparar`, `energia_correcciones`, `energia_fuentes`). Cada una indica en `x-http` el endpoint que debe llamar. Se pasan en `tools` de la petición a OpenRouter.
3. **Ejecutor de herramientas** (TypeScript, ejemplo):
   ```ts
   import spec from './sky-tools.json'

   export async function runEnergiaTool(name: string, args: Record<string, unknown>) {
     const tool = spec.tools.find(t => t.function.name === name)
     if (!tool) throw new Error(`Herramienta desconocida: ${name}`)
     let path = tool['x-http'].path
     const query = new URLSearchParams()
     for (const [k, v] of Object.entries(args)) {
       if (v === undefined || v === null || v === '') continue
       if (path.includes(`{${k}}`)) path = path.replace(`{${k}}`, encodeURIComponent(String(v)))
       else query.set(k, String(v))
     }
     const url = `${process.env.FP_ENERGIA_API_URL}${path}${query.size ? `?${query}` : ''}`
     const res = await fetch(url, { headers: { Authorization: `Bearer ${process.env.FP_ENERGIA_API_KEY}` } })
     return await res.json() // en errores también es JSON (problem+json): el modelo puede leer "detail"
   }
   ```
4. **Instrucción de sistema:** usar el campo `instruccion_de_sistema_sugerida` de `sky-tools.json`. En resumen: usar primero `energia_*`, buscar el slug exacto, citar `meta.fuente.cita` con el mes del dato y no mezclar con cifras de redes sin aclarar el origen.
5. **Prueba:** preguntar a Sky *"¿Cuáles son las pérdidas de Edeeste en el último año móvil y cómo se comparan con Edenorte?"*. Debe responder con las cifras de `/resumen` (julio 2026: Edeeste 56.5 %, Edenorte 26.0 %) y citar la edición de julio 2026 del MEM.

## 4. Operación

- **Uso por llave** (hoy, 7 días, 30 días, errores): `/admin` → Integraciones.
- **Auditoría** en la tabla `api_request_log`: ruta, código, duración y huella de la IP; nunca la llave. Se conserva 90 días.
- **Revocar** una llave filtrada: Integraciones → "Revocar". Tiene efecto inmediato.
- **Base de datos:** migración `download/007_api_integracion.sql` (`api_clients`, `api_rate_counters`, `api_request_log`, función `api_authenticate`). Ninguna de estas tablas es legible con la clave pública.
