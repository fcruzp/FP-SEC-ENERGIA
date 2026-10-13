# Plan — API de integración del Observatorio Energético

*Creado el 11 de octubre de 2026. Parte del [Plan de profesionalización](PLAN-PROFESIONALIZACION.md) (Fase 7).*

> **Estado (12-oct-2026): 7A, 7B y 7D implementadas; 7C lista salvo la prueba con Skay.** API en `/api/v1` (9 endpoints), Swagger UI en `/desarrolladores`, pestaña "Integraciones" en `/admin`, script `scripts/api-key.ts`, migración `download/007_api_integracion.sql` aplicada, 55 pruebas. Guía para desarrolladores e integración con Skay: [docs/api/README.md](docs/api/README.md). Pendiente: crear la llave de Skay, configurarla en Skay y hacer la prueba de punta a punta.

## 1. Objetivo

Publicar en Netlify una **API de solo lectura, versionada y protegida** para que otras aplicaciones consulten los datos del sector eléctrico del Observatorio. El primer consumidor es **Skay**: un agente que razona con IA a través de OpenRouter y que hoy busca información en internet y en redes sociales. Con esta API, Skay podrá responder preguntas como *"¿cómo van las pérdidas de Edesur este año?"* con **datos oficiales y citando la fuente**, en lugar de depender de lo que encuentre en la web.

Principios:

- **Solo lectura.** Ninguna llave de integración puede modificar datos. La carga de ediciones sigue siendo exclusiva de `/admin`.
- **Cada respuesta trae su fuente**: organismo (MEM, y en el futuro OC), informe, edición, fecha de publicación y enlaces al Excel y al PDF. Así el agente puede citar.
- **Pensada para agentes de IA**: respuestas compactas con unidades, fechas explícitas, descripciones claras y un contrato formal (OpenAPI) del que Skay genera sus herramientas.
- **Una llave por aplicación**, nunca una clave compartida. Cada llave se puede revocar sin afectar a las demás.
- **Mismos invariantes del Observatorio**: nada de emparejar por nombre aproximado; los cálculos propios se rotulan como "cálculo del Observatorio".

## 2. Arquitectura

```
Skay (agente)  ──HTTPS + Authorization: Bearer fpe_live_…──▶  Netlify
                                                              │
                                     /api/v1/*  (route handlers de Next.js = funciones de Netlify)
                                                              │
                                    1. verificar llave (hash) y permisos
                                    2. límite de uso
                                    3. validar parámetros (zod)
                                    4. consultar Supabase (service role, solo en el servidor)
                                    5. responder con datos + fuente; registrar uso
```

- Ruta nueva **`/api/v1/`**, separada de `/api/observatorio/*`, que es la API interna de la web y puede cambiar sin aviso. La v1 es un **contrato estable**: los cambios incompatibles irían en `/api/v2/`.
- Mismo despliegue que el sitio. No requiere un servicio aparte ni un costo adicional.
- Reutiliza `indicator_stats` (último valor, anterior, hace 12 meses, sparkline), así que las consultas son rápidas aunque Netlify no cachee respuestas autenticadas.

## 3. Seguridad

### 3.1 Llaves de API (tokens)

| Aspecto | Diseño |
|---|---|
| Formato | `fpe_live_` + 32 bytes aleatorios en base62 (p. ej. `fpe_live_7Hq…`). El prefijo permite reconocerla si se filtra (GitHub Secret Scanning admite patrones propios). |
| Almacenamiento | En la base solo se guarda el **hash SHA-256** y los primeros 12 caracteres (para identificarla en pantalla). La llave completa **se muestra una sola vez** al crearla. Ni siquiera nosotros podemos recuperarla después: si se pierde, se genera otra. |
| Envío | Cabecera `Authorization: Bearer <llave>`, nunca en la URL (las URL quedan en registros e historiales). Solo HTTPS. |
| Permisos (scopes) | `read:catalog` (categorías, indicadores, definiciones), `read:data` (series y valores), `read:revisions` (correcciones del MEM). En el futuro: `read:analysis` (IA). Skay recibe los tres primeros. |
| Vigencia | Fecha de expiración opcional (recomendado: 1 año) y aviso 30 días antes en `/admin`. |
| Revocación | Inmediata desde `/admin`. La siguiente petición con esa llave recibe 401. |
| Rotación | Se crea la llave nueva, se cambia en Skay y se revoca la vieja. Las dos conviven mientras tanto, sin cortes. |
| Restricción por IP | Opcional por llave. Útil si Skay corre en un servidor con IP fija. |

### 3.2 Protecciones adicionales

- **Límite de uso por llave**: 60 peticiones por minuto y 10,000 por día, configurable. Al excederlo responde `429` con `Retry-After`. Protege la base y la cuota de Netlify si una llave se filtra o si el agente entra en un bucle.
- **Registro de auditoría** (`api_request_log`): llave, ruta, código de respuesta, duración y hash de la IP. **Nunca** se guarda la llave ni el cuerpo de la respuesta. Se conserva 90 días. En `/admin` se ve el uso por llave.
- **Validación estricta de parámetros** con zod: rangos de fechas, tamaño máximo de la serie y listas de slugs limitadas. Un parámetro inválido devuelve `422` con un mensaje claro.
- **Sin CORS**: la API es de servidor a servidor. Un navegador no puede llamarla desde otra página, lo que evita exponer llaves en código del lado del cliente.
- **Errores uniformes** (formato RFC 9457 `application/problem+json`) con un `request_id` para rastrear incidencias. Nunca se exponen trazas ni SQL.
- **Comparación por hash**: la llave recibida se convierte en hash y se busca en la base, así no hay comparación de texto que pueda filtrar información por tiempos de respuesta.
- La `SUPABASE_SERVICE_ROLE_KEY` solo vive en el servidor (Netlify). La llave de Skay nunca da acceso directo a Supabase.

### 3.3 Mejoras futuras (si hay más consumidores externos)

- OAuth 2.0 *client credentials* (tokens de corta duración) si llegan terceros que no controlamos.
- Firma HMAC de peticiones si se exige no repudio.
- Nivel público sin llave para datos abiertos (Fase 3, opcional), con un límite más estricto.

## 4. Endpoints (v1)

Todos son `GET` y devuelven JSON con la misma envoltura:

```json
{
  "data": { … },
  "meta": {
    "fuente": {
      "organismo": "Ministerio de Energía y Minas (MEM)",
      "informe": "Informe de Desempeño de las Empresas Eléctricas Estatales",
      "edicion": "2026-07",
      "publicado": "2026-09-…",
      "excel_url": "https://mem.gob.do/…",
      "pdf_url": "https://mem.gob.do/…"
    },
    "generado": "2026-10-11T…Z",
    "api_version": "1.0",
    "request_id": "…"
  }
}
```

| Endpoint | Para qué le sirve al agente |
|---|---|
| `GET /api/v1/meta` | Qué fuentes hay, ediciones cargadas, última actualización y próxima edición esperada. |
| `GET /api/v1/resumen` | Panorama del sector en una llamada: indicadores clave con último valor, variación mensual e interanual. Ideal para "¿cómo está el sector eléctrico?". |
| `GET /api/v1/categorias` | Lista de categorías (generación, EDEs, finanzas, deuda, tarifas…). |
| `GET /api/v1/indicadores?categoria=&entidad=&q=` | Buscar indicadores por categoría, empresa o texto. Devuelve slug, nombre, unidad y último valor. La búsqueda de texto es **solo para descubrir**: los datos siempre se piden por slug exacto. |
| `GET /api/v1/indicadores/{slug}` | Ficha: definición, fórmula, unidad, fuente primaria, último valor, anterior, hace 12 meses y si es cálculo propio. |
| `GET /api/v1/indicadores/{slug}/serie?desde=&hasta=&desglose=` | Serie mensual con fecha, valor y edición de origen de cada dato. Máximo 240 puntos por llamada. |
| `GET /api/v1/comparar?slugs=a,b,c&desde=&hasta=` | Hasta 6 series alineadas por mes, por ejemplo pérdidas de Edenorte, Edesur y Edeeste. |
| `GET /api/v1/correcciones?slug=&desde=` | Valores que el MEM corrigió entre ediciones (antes, después, edición). |
| `GET /api/v1/openapi.json` | Contrato formal (OpenAPI 3.1). Público: describe la API pero no da datos. |
| `/desarrolladores` | Documentación interactiva con Swagger UI (lee el `openapi.json`; para probar se pega una llave en "Authorize"). |

Nombres en español, coherentes con el resto del sitio y con lo que verá Skay.

## 5. Integración con Skay

1. **Configuración en Skay**: `FP_ENERGIA_API_URL=https://<sitio>.netlify.app/api/v1` y `FP_ENERGIA_API_KEY=fpe_live_…` en sus variables de entorno, nunca en el código.
2. **Herramientas para el modelo**: se entrega un archivo `docs/api/skay-tools.json` con las definiciones de herramientas en el formato de *function calling* de OpenRouter, por ejemplo `energia_resumen`, `energia_buscar_indicadores`, `energia_serie` y `energia_comparar`. Skay las registra y el modelo decide cuándo llamarlas.
3. **Instrucción de sistema sugerida** para Skay: *"Para datos del sector eléctrico dominicano usa primero las herramientas `energia_*`. Cita siempre la fuente y la edición que vienen en `meta.fuente`. No mezcles estas cifras con números de redes sociales sin aclarar el origen de cada una."*
4. **Prueba de punta a punta**: una pregunta real desde Skay ("¿cuánto debe el Estado a las generadoras?") debe responder con la cifra exacta de la edición de julio de 2026 y su cita.
5. **Más adelante**: un servidor **MCP** que exponga las mismas herramientas para cualquier agente compatible (Claude, etc.), sin cambiar la API.

## 6. Fases de implementación

| Fase | Contenido | Esfuerzo |
|---|---|---|
| **7A · Base segura** ✅ | Migración `007_api_integracion.sql` (`api_clients`, `api_request_log`, contador de uso). Ayudante `requireApiKey(scope)`. Script `bun scripts/api-key.ts create/list/revoke`. Endpoints `meta`, `resumen`, `indicadores`, `indicadores/{slug}` y `serie`. Errores RFC 9457. Pruebas de autenticación (sin llave, llave inválida, revocada, expirada, sin permiso). | 2–3 días |
| **7B · Completa** ✅ | `comparar`, `correcciones`, límite de uso, auditoría, `openapi.json`, validación zod en todo. Pruebas de contrato contra el OpenAPI. | 2 días |
| **7C · Skay** 🟡 | `skay-tools.json`, guía para desarrolladores (`docs/api/README.md` con ejemplos `curl`), llave de Skay creada y entregada, prueba de punta a punta. | 1 día |
| **7D · Gestión** ✅ | Pestaña **"Integraciones"** en `/admin`: crear llave (mostrada una vez), revocar, rotar, ver uso por día y errores. | 1–2 días |
| **7E · Opcional** | Servidor MCP, nivel público de datos abiertos y endpoints del Organismo Coordinador cuando exista la Fase 4. | — |

**Requisito previo:** el sitio debe estar desplegado en Netlify con las variables de la base nueva (pendiente en el §0 del plan principal). Se puede construir y probar en local antes.

## 7. Criterios de "terminado"

- Sin llave, o con una inválida, revocada o expirada, cada endpoint de datos responde 401 o 403 (prueba automática por endpoint).
- Todos los valores de la API coinciden con los de la web y con el PDF del MEM (se reutiliza la verificación de las 14 cifras).
- Cada respuesta con datos incluye `meta.fuente` completa.
- El OpenAPI valida y las respuestas reales cumplen el contrato.
- Skay responde una pregunta real con la cifra y la cita correctas.
- En Netlify, el tiempo de respuesta es menor de 1 s en `resumen`, `indicadores/{slug}` y `serie`.
- Ninguna llave aparece en el repositorio, en los registros ni en el chat.

## 8. Decisiones de Francisco (12-oct-2026)

1. Skay **solo lee datos**; hace su propio análisis. No hay `read:analysis` por ahora.
2. Puede haber **otros consumidores**, así que el **gestor de llaves** (7D, pestaña "Integraciones" en `/admin`) es parte del alcance.
3. **Sin restricción por IP** por ahora: Skay no tiene IP fija. El campo queda en la tabla para usarlo después.
4. Vigencia: 1 año por defecto, configurable al crear cada llave.
5. Documentación: contrato **OpenAPI 3.1** publicado con **Swagger UI** (página interactiva para probar los endpoints con una llave).
6. El sitio **ya está desplegado en Netlify**, así que el requisito previo está cumplido.
