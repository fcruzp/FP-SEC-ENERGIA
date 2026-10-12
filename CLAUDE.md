# CLAUDE.md — contexto del proyecto FP-ENERGIA

Portal de la Secretaría de Energía de Fuerza del Pueblo (República Dominicana) con un **Observatorio Energético** alimentado por el *Informe de Desempeño de las Empresas Eléctricas Estatales* del Ministerio de Energía y Minas (MEM). El dueño (Francisco) se comunica en español; toda la interfaz y la documentación están en español.

- Estado, fases y pendientes: **[PLAN-PROFESIONALIZACION.md](PLAN-PROFESIONALIZACION.md)** (sección 0 = estado actual).
- Enlaces operativos (GitHub Actions, secrets, Supabase, Netlify, carga de ediciones): **[GUIA-OPERACION.md](GUIA-OPERACION.md)**.
- Verificación de los datos cargados: [data/mem/verificacion-julio-2026.md](data/mem/verificacion-julio-2026.md).

## Stack y comandos

Next.js 16 (App Router, Turbopack) + React 19 + Tailwind 4 + shadcn/ui + Recharts · Supabase (Postgres) · Bun · despliegue en Netlify.

```bash
bun install
bunx next dev -p 3000          # servidor local (también en .claude/launch.json como "dev")
bun test tests                 # 55 pruebas (parser contra los Excel reales, CSV, API v1)
node node_modules/typescript/bin/tsc --noEmit -p .   # debe dar 0 errores (el build verifica tipos)
bun scripts/mem-load.ts --file data/mem/<xlsx> --source-url <url> --pdf-url <url> --published AAAA-MM-DD [--dry-run] [--accept-catalog]
node scripts/setup-db.cjs      # crea el esquema en una base vacía (migraciones 000,001,002,004,005,006,007)
bun scripts/api-key.ts create --name "<app>" | list | revoke --prefix <prefijo>   # llaves de /api/v1
```

`.env.local` (no versionado): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL` (Postgres, session pooler), `ADMIN_USER`, `ADMIN_PASSWORD`. Proyecto de Supabase actual: `ehkbefrcfbnwuusnuhpz` (el anterior, `vdkifczcjezcfqmdzkow`, se perdió).

## Canal de datos (lo más importante)

Código en `src/lib/mem/`, compartido por el script y el panel `/admin`:

| Archivo | Función |
|---|---|
| `workbook.ts` | Lee hojas: meses por **fecha serial del encabezado**, filas por **etiqueta** (columna B). Nunca por posición fija. |
| `catalog.ts` | Catálogo de las 6 hojas principales por bloques (fila con unidad = indicador; filas siguientes = desglose). Alias de hoja (`EDE` en abril 2026). |
| `annex-financial.ts` | "Anexo Res Financieros": **plantillas explícitas** por empresa (EDEs ×4, EGEHID, ETED, EGPC) con relaciones suma/fórmula; variante de formato EGPC mar–abr 2026. Solo meses ejecutados del año en curso. |
| `annex-debt.ts` | "Anexo Deuda": deuda corriente (foto del mes; lista explícita de 48 generadoras; "Grupo AES" es subtotal), pagos por concepto, balance pendiente. |
| `tariffs.ts` | Régimen anterior (2013–2019, mensual) + nuevo (desde 2020, períodos irregulares) → 168 series mensuales continuas; solapes deben ser idénticos. |
| `reconcile.ts` | Verificaciones: cobertura, meses = total anual, EDEs = total, partidas cuadran, acumulado = meses. |
| `pipeline.ts` | `extractWorkbook`, `compareCatalog`, `runChecks` (anomalías conocidas, opcionalmente por edición), `toPoints`. |
| `load-db.ts` | `writeEdition`: transacción; indicadores en bloque; diff por resumen por indicador (solo escribe valores nuevos/cambiados); registra revisiones; refresca `indicator_stats`. |
| `definitions.ts` | Definiciones, fórmulas del glosario del MEM y fuente primaria por patrón de slug. |

Invariantes que **no** se deben romper:
- **Nada de emparejar por nombre aproximado.** Toda estructura es explícita; si el Excel cambia, la carga se detiene (`data/mem/catalogo.json` versionado; `--accept-catalog` para aceptar cambios revisados).
- Las inconsistencias del Excel del MEM se documentan en `data/mem/anomalias-conocidas.json` (con `edition` si aplica solo a una), nunca se ocultan.
- El cargador rechaza ediciones **más antiguas** que la última cargada. Para rehacer el historial: borrar `data_point_revisions`, `data_points`, `ingestion_runs` y `reports` (MEM) y cargar en orden cronológico.
- Porcentajes se guardan en escala 0–100 (`scale: 100` en el catálogo). Un indicador = una entidad (`data_points.entity_id` = la del indicador). Clave única: `(indicator_id, period_type, date)`; todo es `monthly`.
- Un valor que no cambia entre ediciones conserva el `report_id` de la edición donde se publicó por primera vez.
- Cada dato mostrado cita su fuente (MEM; en el futuro OC). Los cálculos propios (p. ej. renovable = hidráulica + RNC) se rotulan como "cálculo del Observatorio".

Ediciones cargadas: marzo→julio 2026 (Excel y PDF en `data/mem/`). Nuevas ediciones: https://mem.gob.do/wp-json/wp/v2/media?search=Desempeno (el MEM publica ~2 meses después del cierre del mes).

## Base de datos

Migraciones en `download/` (000 `users` previo, 001 esquema, 002 catálogo antiguo, 004 porcentajes, 005 procedencia/revisiones/`ingestion_runs`, 006 vista materializada `indicator_stats`). Las APIs leen último valor/anterior/hace 12 meses/sparkline de `indicator_stats` (evita el tope de 1000 filas de PostgREST); usar `.range(0, 4999)` en consultas grandes. La anon key solo lee (RLS + `REVOKE`).

## Web

- Público: `/`, `/observatorio`, `/observatorio/[category]/[indicator]` (ficha técnica, CSV, selector de desglose), `/observatorio/metodologia`, `/observatorio/correcciones`, `/foro` (mockup), `/multimedia`.
- Privado: **solo `/admin`** (el dueño no quiere subrutas; nuevas herramientas = pestañas). Basic Auth en `src/proxy.ts` (Next 16 usa `proxy.ts`, no `middleware.ts`); también protege `/api/admin/*`. Carga de ediciones: `/api/admin/mem-edition` (validar → cargar).
- Fechas de solo-día: usar `src/lib/dates.ts` (`parseDateOnly`, `formatDateOnly`); `new Date('2026-03-01')` muestra febrero en UTC-4.
- `globals.css` tiene una regla global que agrega mucho padding a `<section>`: en páginas nuevas usar `<div>`.
- El contenido del portal (equipo, noticias, eventos, documentos) es **mockup a propósito** hasta el gestor de contenido; no ocultarlo.

## API de integración (/api/v1)

API pública de solo lectura para otras aplicaciones (primer consumidor: el agente **Sky** de Francisco, vía OpenRouter). Guía: [docs/api/README.md](docs/api/README.md); diseño: [PLAN-API-INTEGRACION.md](PLAN-API-INTEGRACION.md).
- Código en `src/lib/api-v1/`: `keys.ts` (formato `fpe_live_…`, hash SHA-256), `access.ts` (decisión pura de acceso, probada), `http.ts` (`apiRoute(scope, handler)`: llave → `api_authenticate` RPC → permisos/límite → handler → envoltura `{data, meta}`, errores RFC 9457, auditoría con `after()`), `catalog.ts` (catálogo + `indicator_stats` en memoria 5 min, `memSource` con `cita`), `params.ts` (zod), `openapi.ts` (contrato; **mantener sincronizado**: una prueba compara rutas y contrato), `version.ts`.
- Rutas en `src/app/api/v1/` (nombres en español). `/api/v1/openapi.json` y `/api/v1` son públicos; el resto exige `Authorization: Bearer`. `proxy.ts` NO protege `/api/v1` (la autenticación está en `apiRoute`).
- Llaves: tabla `api_clients` (solo hash), `api_rate_counters`, `api_request_log` (90 días), función `api_authenticate` — migración `download/007_api_integracion.sql`. Gestión: `/admin` → Integraciones (`/api/admin/api-keys`) o `bun scripts/api-key.ts create|list|revoke`. La llave completa se muestra una sola vez; nunca escribirla en docs ni en el chat.
- Documentación interactiva: `/desarrolladores` (Swagger UI 5.17.14 desde jsDelivr). Herramientas para agentes: `docs/api/sky-tools.json` (probadas contra el contrato).

## Decisiones del dueño

Foro parqueado (mockup) · hosting Netlify · IA con OpenRouter `openai/gpt-6-luna` (elegir siempre el modelo más barato) · fuentes: MEM y explorar Organismo Coordinador, siempre citando la fuente · `main` es el código oficial (commit y push a `main` cuando lo pide).

## Trampas del entorno (Windows)

- Muchos archivos usan CRLF. El Edit tool funciona; los reemplazos con scripts deben normalizar saltos de línea.
- PowerShell 5.1: `Get-Content`/`Set-Content` sin `-Encoding` corrompen UTF-8 (acentos). Usar Write/Edit para archivos con texto.
- El clasificador de comandos de Bash a veces falla: PowerShell funciona como alternativa.
- Mensajes de commit con texto como "/admin" pueden disparar filtros: usar `git commit -F archivo`.
- Las capturas del navegador integrado fallan si la ventana está detrás; verificar con `get_page_text`/JavaScript.
