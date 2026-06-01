# Estado del Proyecto — Observatorio Energético & Foro Ciudadano
**Secretaría de Energía — Fuerza del Pueblo**  
**Última actualización:** 31 mayo 2026

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
- `lib/supabase.ts` — Cliente browser (anon key)
- `lib/supabase-admin.ts` — Cliente admin (service_role key)
- `lib/supabase-types.ts` — Tipos TypeScript para todas las tablas
- `.env.local` — URL, anon key, service_role key configurados
- OpenRouter API key pendiente (no urgente hasta Paso 9)

### Paso 4 — API Routes ✅
- `app/api/observatorio/categories/route.ts` — GET categorías con conteo
- `app/api/observatorio/indicators/route.ts` — GET indicadores con filtros
- `app/api/observatorio/entities/route.ts` — GET entidades
- `app/api/observatorio/data-points/route.ts` — GET series temporales
- `app/api/observatorio/reports/route.ts` — GET informes publicados
- `app/api/admin/parse-xls/route.ts` — GET status + POST parse XLS
- `app/api/admin/recent-data-points/route.ts` — GET últimos data points

### Paso 5 — Backoffice Admin UI ✅
- `app/admin/observatorio/page.tsx` — Panel completo con 4 tabs:
  - Dashboard (stats, datos recientes)
  - Cargar Datos (upload XLS + date range filtering)
  - Indicadores (browser por categoría)
  - Datos (tabla de data_points)
- `app/admin/layout.tsx` — Layout admin
- **Filtro de rango de fechas** implementado con 6 presets:
  - Mes en curso (~1K datos), Últimos 3 meses (~4.5K), Últimos 12 meses (~15K)
  - Año en curso (~2.3K), Personalizado, Carga completa (~200K+)

### Parser XLS TypeScript ✅
- `lib/parse-xls.ts` — Parser automático con XLSX.js
- 6 hojas con parser: Variables Relevantes, EDE's, CDEEE, EGEHID, ETED, EGPC
- Soporte para dateFrom/dateTo (filtrado temporal)
- UPSERT masivo por lotes de 500
- Netlify-compatible (no requiere Python)

---

## ⚠️ PROBLEMAS PENDIENTES

### CSS Rendering Issue (REPORTADO, NO RESUELTO)
- El usuario reportó que la página principal no renderiza bien
- Posible problema con Tailwind CSS o estilos del portal
- **Acción:** Verificar y corregir al inicio de la próxima sesión

---

## ❌ PENDIENTE — ORDEN DE PRIORIDAD

### PRIORIDAD 1: Carga Completa de Datos Históricos (CRÍTICO)

**Progreso:** 48,268 data_points cargados con datos de 2009→2026.  
48 de 487 indicadores tienen datos (10%). Las 6 hojas principales tienen datos parciales.

**Estado actual de datos (actualizado 2 junio 2026):**
| Categoría | Indicadores | Con Datos | Data Points | Cobertura |
|-----------|-------------|-----------|-------------|-----------|
| Variables Relevantes | 34 | 6 | 3,782 | 18% |
| Empresas Distribuidoras | 168 | 20 | 34,067 | 12% |
| CDEEE | 63 | 21 | 3,693 | 33% |
| EGEHID | 24 | 6 | 1,476 | 25% |
| ETED | 12 | 4 | 3,072 | 33% |
| EGPC / Punta Catalina | 31 | 10 | 2,178 | 32% |
| Resultados Financieros | 77 | 0 | 0 | 0% |
| Deuda con Generadoras | 8 | 0 | 0 | 0% |
| Régimen Tarifario | 35 | 0 | 0 | 0% |
| Régimen Tarifario Anterior | 35 | 0 | 0 | 0% |

**Acción A — Mejorar matching de indicadores (PENDIENTE):**
- Solo 48/487 indicadores hicieron match (10%)
- Los ~440 sin datos son mayormente "child/breakdown" indicators
- El parser matchea "parent indicators" pero falla con los sub-indicadores por entidad
- Necesita: (1) mejorar el matching de slugs, (2) crear mapeo manual para los que no matchean
- Data extract guardado en: `download/dp_deduped.json` (48,268 registros listos para re-insertar)

**Acción B — Parsers para 4 hojas faltantes (155 indicadores):**
Estas hojas tienen estructura DIFERENTE a las 6 ya implementadas:

| Hoja | Indicadores | Filas | Columnas | Estructura |
|------|-------------|-------|----------|------------|
| Anexo Res Financieros | 77 | 465 | 29 | Filas = empresas/periodos, cols = conceptos financieros |
| Anexo Deuda | 8 | 348 | 43 | Deuda por generadora, formato de matriz |
| Nuevo Regimen tarifario | 35 | 49 | 143 | Datos trimestrales, 2 sub-filas por tarifa |
| Régimen tarifario anterior | 35 | 48 | 159 | Igual que arriba pero régimen previo |

Requieren:
1. Analizar la estructura de encabezados de cada hoja
2. Implementar parsers específicos en `lib/parse-xls.ts`
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

**Ruta API:** `app/api/ai/analyze/route.ts`

**Arquitectura:**
- Botón "Analizar con IA" en página de indicador
- API route envía contexto del indicador + data_points a OpenRouter
- System prompt especializado en sector eléctrico dominicano
- Guardar log en tabla `ai_analysis_logs` (ya existe en schema)
- Rate limiting: 10/hora (anónimos), 50/hora (autenticados)

**Modelos recomendados:**
- Rápido: `openai/gpt-4o-mini` (~$0.15/1M tokens)
- Profundo: `anthropic/claude-sonnet-4` (~$3/1M tokens)

**Pendiente:** `OPENROUTER_API_KEY` en `.env.local` está vacío — solicitar al usuario

---

### PRIORIDAD 4: Paso 8 — Foro Ciudadano

**Modelo de datos:** Ya parcialmente definido en el plan (sección 2 del plan-observatorio-foro.md)

**Sub-pasos:**
1. **F1** — Auth Supabase + perfiles + RLS (email, Google, Facebook OAuth)
2. **F2** — Portal: listado de posts + detalle + comentarios
3. **F3** — Reacciones + reportes + perfiles de usuario
4. **F4** — Backoffice: gestión de posts + moderación
5. **F5** — Anti-spam + CAPTCHA (Cloudflare Turnstile) + shadow ban

**Nota:** El schema del foro usa `auth.users` (Supabase Auth) para los ciudadanos, 
mientras que el admin usa `public.users` (custom, id serial INTEGER). 
Esto necesita diseño cuidadoso de la autenticación híbrida.

---

### PRIORIDAD 5: Paso 9-10 — Informes y Exportación

- `/observatorio/informes` — Listado de informes descargables
- Tabla `reports` ya existe (0 registros)
- Exportar datos como CSV/PNG desde página de indicador
- Gestión de informes en backoffice (`/admin/reports`)

---

### PRIORIDAD 6: Paso 11-13 — Optimización, Testing, Deploy

- Corregir CSS rendering issue (reportado por el usuario)
- Testing E2E de flujos principales
- Optimizar queries (índices ya creados en schema)
- Deploy a Netlify (energia-fp.netlify.app)
- Configurar dominio personalizado si aplica

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
│       ├── route.ts                      # Health check
│       ├── observatorio/
│       │   ├── categories/route.ts       # GET categorías ✅
│       │   ├── indicators/route.ts       # GET indicadores ✅
│       │   ├── entities/route.ts         # GET entidades ✅
│       │   ├── data-points/route.ts      # GET series temporales ✅
│       │   └── reports/route.ts          # GET informes ✅
│       └── admin/
│           ├── parse-xls/route.ts        # GET status + POST parser ✅
│           └── recent-data-points/route.ts # GET recientes ✅
├── lib/
│   ├── supabase.ts                       # Cliente browser ✅
│   ├── supabase-admin.ts                 # Cliente admin ✅
│   ├── supabase-types.ts                 # Tipos TS ✅
│   ├── parse-xls.ts                      # Parser XLS ✅ (6 hojas)
│   ├── db.ts                             # DB utilities
│   └── utils.ts                          # Utilidades generales
├── components/
│   ├── portal/                           # Componentes portal (CSS issues ⚠️)
│   └── ui/                               # shadcn/ui components ✅
└── hooks/                                # Custom hooks

download/
├── plan-observatorio-foro.md             # Plan general completo
├── 001_observatorio_foro_schema.sql      # Schema SQL v3
├── 002_seed_indicators.sql               # Seed de indicadores
└── ESTADO_PROYECTO.md                    # ← ESTE ARCHIVO

upload/
└── Informe-de-Desempeno-marzo-2026.xlsx  # XLS fuente (2.8MB)
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
| Indicadores (metadata) | 487 | ~487 | 100% ✅ |
| Data Points (valores) | 48,268 | ~200,000+ | ~24% ⚠️ |
| Indicadores con datos | 48/487 | 487 | 10% ⚠️ |
| Hojas con parser | 6/10 | 10 | 60% ⚠️ |
| Rango de datos | 2009-2026 (completo) | 2009-2026 (completo) | 100% ✅ |

---

## 🌅 PRÓXIMOS PASOS (Recomendado)

1. **Mejorar matching de indicadores** — De 48→487 (saltar de 10% a ~60%+)
   - Los 440 indicadores sin datos son "breakdown/child" indicators
   - Necesitan mapeo manual de nombres del XLS a slugs de la BD
   - Muchos son: `precio-medio-compra-energia-edenorte` vs XLS row "Precio Medio de Compra de Energía" bajo Edenorte
   
2. **Implementar parsers para 4 hojas faltantes** (155 indicadores)
   - Anexo Res Financieros, Anexo Deuda, Nuevo/Anterior Régimen Tarifario
   
3. **Corregir CSS rendering issue** del portal principal

4. **Construir portal público `/observatorio`** con gráficos

5. **Continuar con IA y Foro** según disponibilidad

