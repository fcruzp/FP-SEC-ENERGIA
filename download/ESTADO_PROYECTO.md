# Estado del Proyecto — Observatorio Energético & Foro Ciudadano
**Secretaría de Energía — Fuerza del Pueblo**  
**Última actualización:** 2 junio 2026

---

## ✅ COMPLETADO

### Paso 1 — Schema SQL (Base de Datos) ✅
- Archivo: `download/001_observatorio_foro_schema.sql`
- 12 tablas creadas en Supabase con RLS
- Nota: La tabla se llama `indicator_categories` (no `categories`)
- Tablas: indicator_categories, indicators, data_points, entities, indicator_entities, reports, report_indicators, forum_categories, forum_topics, forum_comments, forum_votes, forum_follows

### Paso 2 — Seed de Indicadores y Categorías ✅
- Archivo: `download/002_seed_indicators.sql`
- 10 categorías con `source_sheet` mapeado
- 487 indicadores con slugs, unidades, tipos de gráfico
- 24 entidades del sector eléctrico
- Todo ejecutado exitosamente en Supabase

### Paso 3 — Conexión Supabase ✅
- `src/lib/supabase.ts` — Cliente browser (anon key)
- `src/lib/supabase-admin.ts` — Cliente admin (service_role key)
- `src/lib/supabase-types.ts` — Tipos TypeScript para todas las tablas
- `.env.local` — URL, anon key, service_role key configurados
- OpenRouter API key pendiente (no urgente hasta Paso 9)

### Paso 4 — API Routes ✅
- `src/app/api/observatorio/categories/route.ts` — GET categorías con conteo
- `src/app/api/observatorio/indicators/route.ts` — GET indicadores con filtros
- `src/app/api/observatorio/entities/route.ts` — GET entidades
- `src/app/api/observatorio/data-points/route.ts` — GET series temporales
- `src/app/api/observatorio/reports/route.ts` — GET informes publicados
- `src/app/api/admin/parse-xls/route.ts` — GET status + POST parse XLS
- `src/app/api/admin/recent-data-points/route.ts` — GET últimos data points

### Paso 5 — Backoffice Admin UI ✅
- `src/app/admin/observatorio/page.tsx` — Panel completo con 4 tabs
- `src/app/admin/layout.tsx` — Layout admin
- Filtro de rango de fechas con 6 presets

### Parser XLS TypeScript ✅
- `src/lib/parse-xls.ts` — Parser automático con XLSX.js (6 hojas)
- Soporte para dateFrom/dateTo (filtrado temporal)
- UPSERT masivo por lotes de 500

### Carga Completa de Datos Históricos (6 hojas) ✅
- **Script:** `scripts/full-load.cjs` — v5 con normalización robusta
- **Normalización implementada:** 
  - `stripAccents()` — Elimina TODOS los acentos y diacríticos (NFD decomposition)
  - `slugify()` — Función única: lowercase + sin acentos + sin paréntesis + sin # 
  - `normalizeSlug()` — Simplifica conectores (de, del, y, por, en)
  - Multi-key lookup: 1,375 claves para 487 indicadores
- **Inserción por hoja** (evita timeouts)
- Batch de inserción: 500 registros por lote
- **0 errores** en toda la carga

**Resultado:**

| Categoría | Indicadores | Con Datos | Cobertura |
|-----------|-------------|-----------|-----------|
| Variables Relevantes | 34 | 33 | **97%** ✅ |
| Empresas Distribuidoras | 168 | 152 | **90%** ✅ |
| CDEEE | 63 | 56 | **89%** ✅ |
| EGEHID | 24 | 11 | **46%** ⚠️ |
| ETED | 12 | 9 | **75%** ⚠️ |
| EGPC / Punta Catalina | 31 | 16 | **52%** ⚠️ |
| Resultados Financieros | 77 | 0 | **0%** ❌ |
| Deuda con Generadoras | 8 | 0 | **0%** ❌ |
| Régimen Tarifario | 35 | 0 | **0%** ❌ |
| Régimen Tarifario Anterior | 35 | 0 | **0%** ❌ |
| **TOTAL** | **487** | **277** | **57%** |

- **60,317 data_points** cargados
- **277 de 487 indicadores** con datos (57%)
- Rango: **2009-01-01 → 2026-03-01** (17 años completos)
- 0 errores, 0 duplicados

---

## ⚠️ PROBLEMAS PENDIENTES

### CSS Rendering Issue (REPORTADO, NO RESUELTO)
- El usuario reportó que la página principal no renderiza bien
- Posible problema con Tailwind CSS o estilos del portal
- **Acción:** Verificar y corregir

---

## ❌ PENDIENTE — ORDEN DE PRIORIDAD

### PRIORIDAD 1: Completar cobertura de datos

**A — Mejorar matching en EGEHID, ETED, EGPC (34 indicadores sin datos)**
- EGEHID: faltan 13 de 24 (sub-desgloses por entidad que no tienen indicador propio)
- ETED: faltan 3 de 12 (Derecho de Uso, Derecho de Conexión, Intereses por Financiamientos)
- EGPC: faltan 15 de 31 (sub-desgloses por entidad y costos directos)
- Acción: Agregar indicadores faltantes a la BD o mapeos manuales al script

**B — Parsers para 4 hojas faltantes (155 indicadores, 0% datos)**

| Hoja | Indicadores | Estructura |
|------|-------------|------------|
| Anexo Res Financieros | 77 | Filas = empresas/periodos, cols = conceptos financieros |
| Anexo Deuda | 8 | Deuda por generadora, formato de matriz |
| Nuevo Régimen Tarifario | 35 | Datos trimestrales, 2 sub-filas por tarifa |
| Régimen Tarifario Anterior | 35 | Igual que arriba pero régimen previo |

Requieren:
1. Analizar la estructura de encabezados de cada hoja
2. Implementar parsers específicos
3. Mapear indicadores a slugs existentes (o crear nuevos si faltan)
4. Probar con dry-run primero

---

### PRIORIDAD 2: Paso 6 — Portal Público del Observatorio (UI)

**Rutas a construir:**

| Ruta | Contenido |
|------|-----------|
| `/observatorio` | Página principal con KPIs destacados y resumen del sector |
| `/observatorio/[category]` | Indicadores de una categoría |
| `/observatorio/[category]/[indicator]` | Detalle con gráfico temporal, tabla, análisis IA |

**Componentes clave:**
- KPI Cards — Valor actual + tendencia + sparkline
- Gráficos interactivos — Recharts (ya compatible con shadcn/ui)
- Filtros — Por categoría, entidad, rango de fechas
- Comparadores — YOY, MOM, períodos trimestrales
- Tablas de datos — Paginadas, ordenables, con exportación CSV
- Selector de entidad — Para categorías con desglose (EDE's)

**Dependencia:** Necesita datos cargados (Prioridad 1) para tener sentido visual.

---

### PRIORIDAD 3: Paso 7 — Integración IA (OpenRouter)

**Ruta API:** `src/app/api/ai/analyze/route.ts`

**Arquitectura:**
- Botón "Analizar con IA" en página de indicador
- API route envía contexto del indicador + data_points a OpenRouter
- System prompt especializado en sector eléctrico dominicano
- Guardar log en tabla `ai_analysis_logs` (ya existe en schema)
- Rate limiting: 10/hora (anónimos), 50/hora (autenticados)

**Pendiente:** `OPENROUTER_API_KEY` en `.env.local` está vacío — solicitar al usuario

---

### PRIORIDAD 4: Paso 8 — Foro Ciudadano

**Sub-pasos:**
1. F1 — Auth Supabase + perfiles + RLS
2. F2 — Portal: listado de posts + detalle + comentarios
3. F3 — Reacciones + reportes + perfiles de usuario
4. F4 — Backoffice: gestión de posts + moderación
5. F5 — Anti-spam + CAPTCHA (Cloudflare Turnstile)

---

### PRIORIDAD 5: Paso 9-10 — Informes y Exportación

- `/observatorio/informes` — Listado de informes descargables
- Tabla `reports` ya existe (0 registros)
- Exportar datos como CSV/PNG desde página de indicador

---

### PRIORIDAD 6: Paso 11-13 — Optimización, Testing, Deploy

- Corregir CSS rendering issue (reportado por el usuario)
- Testing E2E de flujos principales
- Optimizar queries (índices ya creados en schema)
- Deploy a Netlify (energia-fp.netlify.app)

---

## 📁 ESTRUCTURA DE ARCHIVOS CLAVE

```
src/
├── app/
│   ├── page.tsx                          # Portal principal (CSS issues ⚠️)
│   ├── layout.tsx                        # Root layout
│   ├── admin/
│   │   ├── layout.tsx                    # Admin layout
│   │   └── observatorio/page.tsx         # Panel admin observatorio ✅
│   └── api/
│       ├── observatorio/                 # API routes públicas ✅
│       └── admin/                        # API routes admin ✅
├── lib/
│   ├── supabase.ts                       # Cliente browser ✅
│   ├── supabase-admin.ts                 # Cliente admin ✅
│   ├── supabase-types.ts                 # Tipos TS ✅
│   ├── parse-xls.ts                      # Parser XLS ✅ (6 hojas)
│   └── utils.ts                          # Utilidades generales
├── components/
│   ├── portal/                           # Componentes portal (CSS issues ⚠️)
│   └── ui/                               # shadcn/ui components ✅
└── hooks/                                # Custom hooks

scripts/
├── full-load.cjs                         # Script de carga v5 ✅ (normalización robusta)
├── match-report.cjs                      # Reporte de matching
├── dry-run.cjs                           # Dry run del parser
└── full-data-load.mjs                    # Versión anterior (obsoleta)

download/
├── plan-observatorio-foro.md             # Plan general completo
├── 001_observatorio_foro_schema.sql      # Schema SQL
├── 002_seed_indicators.sql               # Seed de indicadores
└── ESTADO_PROYECTO.md                    # ← ESTE ARCHIVO

upload/
└── Informe-de-Desempeno-marzo-2026.xlsx  # XLS fuente (2.7MB)
```

---

## 🔑 VARIABLES DE ENTORNO

```env
# ✅ Configuradas
NEXT_PUBLIC_SUPABASE_URL=https://vdkifczcjezcfqmdzkow.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...9B9Y
SUPABASE_SERVICE_ROLE_KEY=eyJ...0JZD4

# ❌ Pendiente
OPENROUTER_API_KEY=    # Necesaria para análisis IA (Paso 7)
```

---

## 📊 MÉTRICAS ACTUALES

| Métrica | Valor | Esperado | Cobertura |
|---------|-------|----------|-----------|
| Categorías | 10 | 10 | 100% ✅ |
| Entidades | 24 | 24 | 100% ✅ |
| Indicadores (metadata) | 487 | 487 | 100% ✅ |
| Data Points (valores) | 60,317 | ~200,000+ | ~30% ⚠️ |
| Indicadores con datos | 277/487 | 487 | 57% ⚠️ |
| Hojas con parser | 6/10 | 10 | 60% ⚠️ |
| Rango de datos | 2009-2026 | 2009-2026 | 100% ✅ |

---

## 🌅 PRÓXIMOS PASOS (Recomendado)

1. **Implementar parsers para 4 hojas faltantes** (155 indicadores)
   - Anexo Res Financieros, Anexo Deuda, Nuevo/Anterior Régimen Tarifario

2. **Mejorar matching en hojas existentes** (34 indicadores más)
   - Agregar indicadores faltantes a la BD para EGEHID/ETED/EGPC

3. **Corregir CSS rendering issue** del portal principal

4. **Construir portal público `/observatorio`** con gráficos

5. **Continuar con IA y Foro** según disponibilidad
