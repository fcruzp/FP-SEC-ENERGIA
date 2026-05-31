# Plan de Desarrollo: Observatorio Energético & Foro Ciudadano

**Proyecto:** Secretaría de Energía — Fuerza del Pueblo
**Plataforma:** energia-fp.netlify.app
**Stack actual:** Next.js 16 + React + Supabase (por implementar)
**Fecha:** Mayo 2026 (actualizado con análisis de datos reales — Fase 1 definida)

---

## 0. Estrategia de Fases por Fuente de Datos

El Observatorio se construirá de forma incremental, fase por fase, donde **cada fase se nombra según la fuente de datos** que alimenta sus indicadores. Esto permite:

- Entregar valor usable desde la primera fase
- Validar la arquitectura con datos reales antes de escalar
- Priorizar las fuentes más estructuradas primero
- Agregar fuentes PDF-only en fases posteriores con parsers más sofisticados

### Fases definidas del Observatorio

| Fase | Nombre | Fuente de datos | Tipo de parsing | Estado |
|------|--------|----------------|-----------------|--------|
| **Fase 1** | **Informe Desempeño Empresas Eléctricas Estatales** | XLS mensual (`Informe-de-Desempeno-*.xlsx`) | Automático (openpyxl) | **En planificación** |
| Fase 2 | Por definir (según PDFs del cliente) | PDF + XLS si existe | Semi-automático (pdfplumber + revisión manual) | Pendiente |
| Fase 3 | Por definir | PDF-only | Asistido por IA (visión + OCR) | Pendiente |
| ... | Se agregan fases según el cliente aporte nuevas fuentes | | | |

> **Principio clave:** Cada XLS mensual contiene TODA la serie histórica desde 2009 hasta la fecha del informe. No es necesario descargar XLS de meses anteriores — el último siempre tiene la data completa. Esto simplifica enormemente la ingesta y actualización.

---

## 1. FASE 1: Informe Desempeño Empresas Eléctricas Estatales

### 1.1 Fuente de Datos — Análisis Detallado

**Archivo:** `Informe-de-Desempeno-marzo-2026.xlsx` (2.8MB, 11 hojas)
**Rango temporal:** Enero 2009 → Marzo 2026 (~17 años de data mensual, 207 columnas de meses)
**Cobertura:** Todo el sector eléctrico estatal dominicano

#### Estructura del XLS — 11 hojas con datos estructurados

| Hoja | Contenido | Indicadores | Columnas | Tipo de datos |
|------|-----------|-------------|----------|---------------|
| `Variables Relevantes` | Precios combustibles, generación por tipo, costos marginales MEM, tasa de cambio | ~37 | 247 | Mensual 2009→2026 |
| `EDE's` | Compra/venta energía por EDE, pérdidas, cobranza, CRI, clientes, empleados | ~30 | 243 | Mensual 2009→2026 |
| `CDEEE` | Energía comprada por generadora, facturación, gastos, inversiones, empleados | ~70 | 209 | Mensual 2009→2026 |
| `EGEHID` | Energía facturada, mercado contratos vs spot, ingresos, gastos, inversión | ~25 | 252 | Mensual 2009→2026 |
| `ETED` | Peaje transmisión, derecho uso/conexión, gastos operativos, resultado | ~12 | 254 | Mensual 2009→2026 |
| `EGPC` | Energía facturada por EDE, costos producción, gastos, depreciación | ~32 | 432 | Mensual 2009→2026 |
| `Anexo Res Financieros` | Resultado financiero detallado de todas las empresas | ~60+ | 29 | Mensual con subcategorías |
| `Anexo Deuda` | Deuda con generadoras privadas por empresa | ~40+ | 43 | Desglose por generadora |
| `Nuevo Regimen tarifario` | Cargos tarifarios por tipo (BTS1, BTS2, etc.) y EDE | ~15 | 143 | Trimestral |
| `Regimen tarifario anterior` | Cargos tarifarios régimen previo | ~15 | 159 | Trimestral |
| `Hoja1` | Vacía | — | 1 | — |

#### Patrones clave detectados en el XLS

1. **Estructura de encabezados consistente** — Todas las hojas principales comparten el mismo patrón de filas 2-7
2. **Cada XLS contiene la serie histórica completa** — Un solo archivo basta para obtener toda la data desde 2009
3. **Columnas fijas por periodo** — C=periodo actual, D=periodo anterior, E/F=delta, luego columnas mensuales desde col L (ene 2009) hasta col HJ (mar 2026), y al final columnas de acumulado anual
4. **Jerarquía de datos** — Categoría (ej: "Precios Combustibles") → Indicador (ej: "Fuel Oil #2") → Desglose por entidad
5. **Entidades identificables por hoja** — EDE's tiene sub-desglose por Edenorte/Edesur/Edeeste; CDEEE tiene desglose por generadora
6. **~200+ indicadores distintos** en total (sumando todas las hojas)
7. **Columnas de acumulado anual** al final (HL-IC) con resúmenes anuales desde 2009 hasta 2026

#### Estructura de encabezados (patrón repetido en todas las hojas)

```
Fila 2:  Organismo ("Ministerio de Energía y Minas")
Fila 3:  Tipo de documento ("Variables Relevantes" / nombre de hoja)
Fila 4:  "Valores según indicación"
Fila 5:  Año de inicio de serie histórica (2009, 2010, 2011... hasta 2026)
Fila 6:  Períodos comparativos: "Ene26-Mar26" | "Ene25-Mar25" | Comparación | "Ene24-Mar24" | Comparación | "Acumulado Año"
Fila 7:  Sub-encabezados: "D" | "D%" | Mes1 (2009-01) | Mes2 (2009-02) | ... | Acum 2009 | Acum 2010 | ... | Acum 2026
Fila 8+: Datos — Columna A=Código, Columna B=Nombre indicador, Columna C+=Valores
```

#### Indicadores por categoría (Fase 1)

**Variables Relevantes (37 indicadores):**
- Precios Combustibles: Fuel Oil #2 (US$/BBL, US$/MMBTU), Fuel Oil #6 (US$/BBL, US$/MMBTU), Gas Natural (US$/MMBTU), Carbón Mineral (US$/Ton, US$/MMBTU)
- Generación por tipo: Total, Carbón Mineral, Gas Natural, Fuel Oil #2, Fuel Oil #6, Hidráulica, Eólica, Solar FV, Biomasa, Total Renovable No Convencional
- Composición porcentual de generación
- Precios MEM: Costo Marginal Energía (cUSD$/KWh), Costo Marginal Potencia (cUSD/kW-Mes), Peaje Transmisión (cUSD/KWh), Derecho Conexión (USD/kW-mes)
- Tasa de Cambio (DOP/USD)

**EDE's (~30 indicadores por EDE + consolidado):**
- Compra de Energía (GWh), Precio Medio Compra, Factura Compra
- Energía Facturada, Precio Medio Venta, Total Facturado
- Otros Ingresos, Gastos Operativos (Personal, Servicios, Materiales)
- Egresos Financieros, Inversiones, Cantidad Empleados

**CDEEE (~70 indicadores):**
- Energía Comprada por generadora (GSF, CESPM, DPP, EgeHaina, etc.)
- Precio Medio Compra, Factura por Compra
- Total Energía Facturada por EDE, Precio Medio Venta
- Total Facturado, Otros Ingresos, Gastos Operativos
- Egresos Financieros, Inversiones, Empleados

**EGEHID (~25 indicadores):**
- Energía Facturada (Contratos, CDEEE, EDEs, GenCos, Spot)
- Precio Medio Venta, Factura Venta
- Otros Ingresos, Gastos Operativos, Egresos Financieros, Inversiones, Empleados

**ETED (~12 indicadores):**
- Peaje Total (Derecho Uso, Derecho Conexión)
- Otros Ingresos, Gastos Operativos, Egresos Financieros, Inversiones, Empleados

**EGPC (~32 indicadores):**
- Energía Facturada (Contratos, EDEs, Spot)
- Precio Medio Venta, Total Facturado
- Costos Producción (Cargos MEM, Personal, Otros)
- Gastos Operativos, Depreciación, Gastos Financieros, Inversiones, Empleados

### 1.2 Modelo de Datos — Supabase (Fase 1)

```sql
-- ============================================
-- FASE 1: Informe Desempeño Empresas Eléctricas Estatales
-- ============================================

-- Entidades del sector eléctrico
CREATE TABLE entities (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,            -- "Edenorte", "EGEHID", "ETED", "CDEEE"
  slug        TEXT UNIQUE NOT NULL,     -- "edenorte", "egehid"
  type        TEXT NOT NULL,            -- "distribuidora", "generadora", "transmisora", "comercializadora"
  parent_id   UUID REFERENCES entities(id), -- null = entidad raíz, o referencia a EDE padre
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);
-- Seed: CDEEE, Edenorte, Edesur, Edeeste, EGEHID, ETED, EGPC/Punta Catalina
-- Generadoras: GSF, CESPM, DPP, EgeHaina, Electronic JRC, Montecristi Solar, C Power, PECASA, etc.

-- Categorías de indicadores (mapea a las hojas del XLS)
CREATE TABLE indicator_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  icon        TEXT,                     -- nombre de icono Lucide
  color       TEXT,                     -- color primario para charts (#hex)
  description TEXT,
  source_sheet TEXT,                    -- hoja del XLS origen ("Variables Relevantes", "EDE's", etc.)
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);
-- Seed:
--   "Variables Relevantes" → hoja "Variables Relevantes"
--   "Empresas Distribuidoras" → hoja "EDE's"
--   "CDEEE" → hoja "CDEEE"
--   "EGEHID" → hoja "EGEHID"
--   "ETED" → hoja "ETED"
--   "EGPC / Punta Catalina" → hoja "EGPC"
--   "Resultados Financieros" → hoja "Anexo Res Financieros"
--   "Deuda con Generadoras" → hoja "Anexo Deuda"
--   "Régimen Tarifario" → hoja "Nuevo Regimen tarifario"

-- Indicadores
CREATE TABLE indicators (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id     UUID REFERENCES indicator_categories(id) ON DELETE CASCADE,
  entity_id       UUID REFERENCES entities(id),            -- null = consolidado/agregado
  name            TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,
  unit            TEXT NOT NULL,           -- "%", "MW", "GWh", "USD MM", "cUSD/kWh", "DOP/kWh", "DOP/USD", "US$/BBL", "US$/MMBTU"
  description     TEXT,
  source          TEXT DEFAULT 'MEM',      -- "MEM", "CDEEE", "BCRD", "OC"
  frequency       TEXT DEFAULT 'monthly',  -- monthly/quarterly/yearly
  chart_type      TEXT DEFAULT 'line',     -- line/bar/pie/area — sugerencia de visualización
  is_breakdown    BOOLEAN DEFAULT false,   -- true si es sub-indicador desglosado
  parent_indicator_id UUID REFERENCES indicators(id),
  sort_order      INT DEFAULT 0,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now()
);
-- ~200+ indicadores seed basados en las hojas del XLS

-- Puntos de datos (las mediciones temporales — el corazón del observatorio)
CREATE TABLE data_points (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  indicator_id    UUID REFERENCES indicators(id) ON DELETE CASCADE,
  entity_id       UUID REFERENCES entities(id),  -- para desglose por entidad
  value           NUMERIC NOT NULL,
  date            DATE NOT NULL,                  -- primer día del mes (2026-03-01 para marzo 2026)
  period_type     TEXT DEFAULT 'monthly',         -- monthly/quarterly/yearly
  source_file     TEXT,                           -- "Informe-de-Desempeno-marzo-2026.xlsx"
  is_estimated    BOOLEAN DEFAULT false,          -- true si el dato es estimado/proyectado
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(indicator_id, date, COALESCE(entity_id, '00000000-0000-0000-0000-000000000000'))
);

-- Informes oficiales (metadata de archivos subidos)
CREATE TABLE reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,
  description     TEXT,
  file_url        TEXT NOT NULL,                  -- URL en Supabase Storage
  file_type       TEXT NOT NULL,                  -- pdf / xlsx / xls / csv
  file_size       BIGINT,
  publish_date    DATE,                           -- fecha oficial del informe
  source_org      TEXT DEFAULT 'MEM',             -- organismo emisor
  report_type     TEXT DEFAULT 'desempeno_mensual',
  phase           TEXT DEFAULT 'desempeno_eee',   -- FASE a la que pertenece
  is_published    BOOLEAN DEFAULT false,
  uploaded_by     UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Logs de análisis IA
CREATE TABLE ai_analysis_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  indicator_id    UUID REFERENCES indicators(id),
  category_id     UUID REFERENCES indicator_categories(id),
  user_query      TEXT NOT NULL,
  ai_response     TEXT NOT NULL,
  model_used      TEXT,
  tokens_used     INT,
  cost_usd        NUMERIC,
  created_at      TIMESTAMPTZ DEFAULT now()
);
```

**Índices para Fase 1:**
```sql
CREATE INDEX idx_data_points_indicator_date ON data_points(indicator_id, date DESC);
CREATE INDEX idx_data_points_date ON data_points(date DESC);
CREATE INDEX idx_data_points_entity ON data_points(entity_id, date DESC);
CREATE INDEX idx_indicators_category ON indicators(category_id);
CREATE INDEX idx_indicators_entity ON indicators(entity_id);
CREATE INDEX idx_reports_phase_type ON reports(phase, report_type, publish_date DESC);
CREATE INDEX idx_ai_logs_indicator ON ai_analysis_logs(indicator_id, created_at DESC);
```

### 1.3 Pipeline de Ingesta — Fase 1 (XLS Automático)

El pipeline de la Fase 1 es 100% automático basado en XLS. No hay parsing de PDF en esta fase.

```
┌──────────────────────────────────────────────────────────────┐
│  BACKOFFICE: Admin sube XLS mensual                          │
│  (ej: Informe-de-Desempeno-marzo-2026.xlsx)                  │
└─────────────────────┬────────────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────────────┐
│  1. Almacenar archivo en Supabase Storage                     │
│  2. Crear registro en `reports`                               │
└─────────────────────┬────────────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────────────┐
│  3. PARSER AUTOMÁTICO (API Route /api/admin/parse-xls)       │
│                                                               │
│  a. Leer archivo con openpyxl                                 │
│  b. Detectar hojas válidas (excluir "Hoja1")                  │
│  c. Por cada hoja:                                            │
│     - Leer encabezados (filas 2-7)                            │
│     - Extraer período actual de fila 6 ("Ene26-Mar26")        │
│     - Mapear columnas de fecha de fila 7                      │
│     - Leer indicadores desde fila 8+                          │
│     - Para cada indicador:                                    │
│       · Detectar categoría (por nombre de hoja)               │
│       · Detectar entidad (por nombre de indicador o contexto) │
│       · Extraer valores mensuales (cols L→HJ = 2009-01→2026-03) │
│       · Extraer acumulados anuales (cols HL→IC)               │
│  d. Generar array de data_points                              │
└─────────────────────┬────────────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────────────┐
│  4. PREVIEW — Mostrar datos extraídos en tabla editable       │
│     (Admin puede corregir antes de confirmar)                 │
└─────────────────────┬────────────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────────────┐
│  5. UPSERT a `data_points`                                    │
│     - Usar ON CONFLICT (indicator_id, date, entity_id)        │
│     - Actualizar valor si ya existe                           │
│     - Insertar si es nuevo                                    │
└──────────────────────────────────────────────────────────────┘
```

**Estrategia de Upsert Incremental:**

Cuando se sube un nuevo XLS mensual, el sistema:

1. Parsea TODO el archivo (incluyendo históricos)
2. Hace UPSERT de todos los data_points
3. Los datos existentes se actualizan (por si el MEM revisó valores previos)
4. Los datos nuevos se insertan
5. No se duplican registros gracias al UNIQUE constraint

**Ventaja:** Un solo XLS basta para la carga inicial y las actualizaciones. No hay que manejar múltiples archivos ni deltas.

**Mapping template para "Informe Desempeño EEE":**

```json
{
  "template_name": "Informe Desempeño EEE Mensual",
  "phase": "desempeno_eee",
  "file_pattern": "Informe*Desempeno*.xlsx",
  "sheets_to_parse": [
    "Variables Relevantes",
    "EDE's",
    "CDEEE",
    "EGEHID",
    "ETED",
    "EGPC",
    "Anexo Res Financieros",
    "Anexo Deuda",
    "Nuevo Regimen tarifario",
    "Regimen tarifario anterior"
  ],
  "header_rows": 7,
  "data_start_row": 8,
  "columns": {
    "code": "A",
    "name": "B",
    "current_period_value": "C",
    "previous_period_value": "D",
    "delta_absolute": "E",
    "delta_percentage": "F",
    "monthly_data_start_col": "L",
    "monthly_data_end_col": "HJ",
    "yearly_accum_start_col": "HL",
    "yearly_accum_end_col": "IC"
  },
  "date_row": 7,
  "year_row": 5,
  "entity_detection": {
    "method": "sheet_name",
    "mapping": {
      "EDE's": {
        "entities": ["Edenorte", "Edesur", "Edeeste"],
        "default_entity": "EDEs Consolidado"
      },
      "CDEEE": {
        "entities": ["CDEEE"],
        "sub_entities": ["GSF", "CESPM", "DPP", "EgeHaina", "Electronic JRC", "Montecristi Solar", "C Power", "PECASA", "MATAFONGO", "WCG ENERGY", "Emerald Solar", "POSEIDON", "Quisqueya II", "EGEHID", "FALCONDO", "RSJ", "Mercado Spot"]
      },
      "EGEHID": {
        "entities": ["EGEHID"],
        "sub_entities": ["Cdeee", "Ede's", "GenCo's", "Unr", "Mercado Spot"]
      },
      "ETED": { "entities": ["ETED"] },
      "EGPC": {
        "entities": ["EGPC"],
        "sub_entities": ["Edenorte", "Edesur", "Edeeste", "Mercado Spot"]
      }
    }
  },
  "category_mapping": {
    "Variables Relevantes": "variables-relevantes",
    "EDE's": "empresas-distribuidoras",
    "CDEEE": "cdeee",
    "EGEHID": "egehid",
    "ETED": "eted",
    "EGPC": "egpc",
    "Anexo Res Financieros": "resultados-financieros",
    "Anexo Deuda": "deuda-generadoras",
    "Nuevo Regimen tarifario": "regimen-tarifario-nuevo",
    "Regimen tarifario anterior": "regimen-tarifario-anterior"
  }
}
```

### 1.4 Backoffice — Fase 1

**Rutas del panel de administración:**

| Ruta | Función |
|------|---------|
| `/admin` | Dashboard: resumen de indicadores, últimos uploads, stats |
| `/admin/indicators` | CRUD de indicadores y categorías (con filtros por fase) |
| `/admin/upload` | Subir XLS, seleccionar template, revisar datos extraídos |
| `/admin/data` | Tabla editable de data_points (filtrar, editar, eliminar, corregir) |
| `/admin/reports` | Gestionar informes subidos (publicar/ocultar) |
| `/admin/ai-logs` | Ver historial de consultas IA y respuestas |

**Autenticación:** Supabase Auth con rol `admin`. Middleware de Next.js verifica claim `role = 'admin'` en JWT.

**Flujo de upload XLS (Fase 1):**
1. Admin sube archivo `.xlsx`
2. Sistema lo almacena en Supabase Storage
3. Parser automático detecta la estructura (mapping template "Informe Desempeño EEE")
4. Extrae ~200+ indicadores × 207 meses = ~41,000+ data_points
5. Preview en tabla editable (con filtros por hoja, indicador, fecha)
6. Admin confirma → UPSERT masivo a `data_points`
7. Se crea registro en `reports` con metadata del archivo

### 1.5 Portal Público — Observatorio (Fase 1)

**Rutas:**

| Ruta | Contenido |
|------|-----------|
| `/observatorio` | Página principal con KPIs destacados y resumen del sector |
| `/observatorio/[category]` | Indicadores de una categoría (ej: "Empresas Distribuidoras") |
| `/observatorio/[category]/[indicator]` | Detalle de indicador con gráfico temporal, tabla, análisis IA |
| `/observatorio/informes` | Listado de informes descargables |

**Componentes clave:**

- **KPI Cards** — Valor actual + tendencia + sparkline para los indicadores principales
- **Gráficos interactivos** — Recharts (ya compatible con shadcn/ui) para series temporales
- **Filtros** — Por categoría, entidad, rango de fechas
- **Comparadores** — YOY (year-over-year), MOM (month-over-month), períodos trimestrales
- **Tablas de datos** — Paginadas, ordenables, con exportación CSV
- **Análisis IA** — Botón "Analizar con IA" que envía contexto del indicador a OpenRouter
- **Selector de entidad** — Para categorías con desglose (EDE's → Edenorte/Edesur/Edeeste)

**Categorías visibles en Fase 1:**

1. **Variables Relevantes** — Precios combustibles, generación, costos MEM, tasa de cambio
2. **Empresas Distribuidoras (EDE's)** — Compra, venta, facturación por Edenorte/Edesur/Edeeste
3. **CDEEE** — Compra por generadora, facturación consolidada
4. **EGEHID** — Generación hidroeléctrica, ventas
5. **ETED** — Transmisión, peajes
6. **EGPC / Punta Catalina** — Generación termoeléctrica
7. **Resultados Financieros** — Ingresos, gastos, resultados por empresa
8. **Deuda con Generadoras** — Deuda por empresa generadora
9. **Régimen Tarifario** — Cargos tarifarios actuales vs anteriores

### 1.6 Estrategia de IA con OpenRouter — Fase 1

**Arquitectura:**

```
[Usuario clic "Analizar con IA"]
        │
        ▼
[Next.js API Route /api/ai/analyze]
        │
        ├── 1. Construir prompt con contexto:
        │     - Indicador: nombre, unidad, categoría, entidad
        │     - Datos: últimos N data_points como JSON (o resumen estadístico)
        │     - Metadata: fuente (MEM), frecuencia (mensual), rango temporal
        │     - Comparaciones: YOY, MOM calculadas
        │     - Query del usuario (si proporcionó una)
        │
        ├── 2. Llamar OpenRouter API:
        │     POST https://openrouter.ai/api/v1/chat/completions
        │     Model: configurable (default: openai/gpt-4o-mini)
        │
        ├── 3. Guardar log en ai_analysis_logs
        │
        └── 4. Devolver respuesta al frontend (streaming si es posible)
```

**System prompt para Fase 1 (especializado en sector eléctrico dominicano):**

```
Eres un analista energético experto en el sector eléctrico de la
República Dominicana. Trabajas con datos del Informe de Desempeño
de las Empresas Eléctricas Estatales, publicado mensualmente por
el Ministerio de Energía y Minas.

Contexto de las entidades:
- CDEEE: Corporación Dominicana de Empresas Eléctricas Estatales (comercializadora)
- Edenorte, Edesur, Edeeste: Empresas distribuidoras de electricidad
- EGEHID: Empresa de Generación Hidroeléctrica Dominicana
- ETED: Empresa de Transmisión Eléctrica Dominicana
- EGPC: Empresa de Generación Punta Catalina (termoeléctrica)

Reglas:
- Responde en español
- Cita los datos numéricos específicos en tu análisis
- Identifica tendencias, anomalías y comparaciones relevantes
- Considera el contexto dominicano (estacionalidad, ciclones, crisis energética)
- Si hay datos insuficientes, indícalo claramente
- Sugiere acciones o investigaciones adicionales cuando sea pertinente
- No inventes datos; trabaja solo con los proporcionados
- Usa formato markdown en tu respuesta
```

**Selección de modelo por caso de uso:**

| Caso de uso | Modelo recomendado | Costo aprox. | Razón |
|---|---|---|---|
| Análisis rápido de tendencia | `openai/gpt-4o-mini` | ~$0.15/1M tokens | Rápido y barato |
| Análisis profundo con contexto | `anthropic/claude-sonnet-4` | ~$3/1M tokens | Mejor razonamiento |
| Resumen ejecutivo de categoría | `google/gemini-2.0-flash` | ~$0.10/1M tokens | Buen balance para texto largo |
| Comparación multi-indicador | `anthropic/claude-sonnet-4` | ~$3/1M tokens | Contexto múltiple |

**Tipos de análisis disponibles en Fase 1:**

1. **Tendencia** — "¿Cuál es la tendencia de las pérdidas eléctricas en los últimos 12 meses?"
2. **Comparación** — "Compara la facturación entre Edenorte, Edesur y Edeeste"
3. **Anomalía** — "¿Hay valores atípicos en el precio del Fuel Oil?"
4. **Proyección** — "Si la tendencia continúa, ¿cuál sería el valor en 6 meses?" (con disclaimer)
5. **Resumen** — "Genera un resumen ejecutivo del sector eléctrico este trimestre"
6. **Libre** — El usuario escribe su pregunta en lenguaje natural

**Seguridad:**
- Rate limiting: 10 consultas/hora (anónimos), 50/hora (autenticados)
- API key de OpenRouter NUNCA en frontend — siempre vía API route
- Sanitización de inputs antes de enviar a la API
- Logging completo para auditoría

### 1.7 Fases de Implementación — Observatorio Fase 1

| Sub-fase | Entregable | Duración estimada |
|----------|-----------|-------------------|
| **O1.1** | Proyecto Supabase + schema completo + seed entities/categories | 3 días |
| **O1.2** | API Routes: CRUD indicators, data_points, reports | 3 días |
| **O1.3** | Backoffice: upload XLS + parser automático + preview + confirm | 5 días |
| **O1.4** | Portal: páginas de indicadores con charts (Recharts) + filtros | 5 días |
| **O1.5** | Integración IA (OpenRouter) + UI de análisis | 3 días |
| **O1.6** | Seed data: parsear XLS de marzo 2026 como carga inicial | 2 días |
| **O1.7** | Testing, ajustes de UI, deploy | 3 días |

**Total estimado Fase 1: ~3.5 semanas**

---

## 2. Requisito 2: Foro Ciudadano

### 2.1 Arquitectura General

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────┐
│  Admin/      │     │  Supabase DB │     │  Portal Público   │
│  Moderador   │────▶│              │◀────│  (Foro)           │
│              │     │ - posts      │     │                    │
│ Crear posts  │     │ - comments   │     │ Ver posts          │
│ Moderar      │     │ - profiles   │     │ Comentar           │
│ Banear       │     │ - reactions  │     │ Reportar abuso     │
│              │     │ - reports    │     │ Reaccionar         │
└──────────────┘     └──────────────┘     └──────────────────┘
```

### 2.2 Modelo de Datos — Supabase

```sql
-- Perfiles de usuario (extiende auth.users)
CREATE TABLE profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name    TEXT NOT NULL,
  avatar_url      TEXT,
  role            TEXT DEFAULT 'citizen' CHECK (role IN ('citizen', 'moderator', 'admin')),
  is_banned       BOOLEAN DEFAULT false,
  ban_reason      TEXT,
  banned_at       TIMESTAMPTZ,
  banned_by       UUID REFERENCES auth.users(id),
  is_shadow_banned BOOLEAN DEFAULT false,  -- puede comentar pero nadie lo ve
  comment_count   INT DEFAULT 0,
  first_comment_approved BOOLEAN DEFAULT false, -- para moderación de primer comentario
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Posts de la Secretaría
CREATE TABLE posts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id       UUID NOT NULL REFERENCES auth.users(id),
  title           TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,
  content         TEXT NOT NULL,           -- Markdown o rich text
  excerpt         TEXT,                    -- resumen para cards
  cover_image_url TEXT,
  category        TEXT,                    -- "Propuesta", "Informe", "Consulta", "Evento"
  is_pinned       BOOLEAN DEFAULT false,
  is_locked       BOOLEAN DEFAULT false,   -- no más comentarios
  is_published    BOOLEAN DEFAULT true,
  comment_count   INT DEFAULT 0,
  reaction_count  INT DEFAULT 0,
  published_at    TIMESTAMPTZ DEFAULT now(),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Comentarios ciudadanos
CREATE TABLE comments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id         UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id       UUID NOT NULL REFERENCES auth.users(id),
  parent_id       UUID REFERENCES comments(id) ON DELETE CASCADE, -- para respuestas anidadas (máx 2 niveles)
  content         TEXT NOT NULL,
  is_hidden       BOOLEAN DEFAULT false,   -- moderación
  hidden_by       UUID REFERENCES auth.users(id),
  hidden_reason   TEXT,
  is_auto_hidden  BOOLEAN DEFAULT false,   -- ocultado automáticamente por filtro
  reaction_count  INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Reacciones (likes, apoyo, etc.)
CREATE TABLE reactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id),
  target_id       UUID NOT NULL,
  target_type     TEXT NOT NULL CHECK (target_type IN ('post', 'comment')),
  reaction_type   TEXT NOT NULL DEFAULT 'like' CHECK (reaction_type IN ('like', 'agree', 'disagree', 'flag')),
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, target_id, target_type)
);

-- Reportes de abuso
CREATE TABLE content_reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id     UUID NOT NULL REFERENCES auth.users(id),
  target_id       UUID NOT NULL,
  target_type     TEXT NOT NULL CHECK (target_type IN ('post', 'comment', 'user')),
  reason          TEXT NOT NULL CHECK (reason IN ('spam', 'offensive', 'misinformation', 'irrelevant', 'other')),
  description     TEXT,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  reviewed_by     UUID REFERENCES auth.users(id),
  reviewed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Filtro de palabras prohibidas (configurable por admin)
CREATE TABLE banned_words (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word            TEXT UNIQUE NOT NULL,
  is_auto_hide    BOOLEAN DEFAULT true,    -- true = ocultar comentario automáticamente
  created_at      TIMESTAMPTZ DEFAULT now()
);
```

**Row Level Security (RLS):**

```sql
-- Perfiles: cualquiera puede leer, solo el dueño puede editar
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Posts: cualquiera puede leer publicados, solo admins crean/editan
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published posts are viewable by everyone"
  ON posts FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can insert posts"
  ON posts FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
  );
CREATE POLICY "Admins can update posts"
  ON posts FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
  );

-- Comentarios: no ocultos son visibles; usuarios autenticados no baneados pueden crear
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Non-hidden comments are viewable by everyone"
  ON comments FOR SELECT USING (is_hidden = false);
CREATE POLICY "Authenticated non-banned users can comment"
  ON comments FOR INSERT WITH CHECK (
    auth.uid() = author_id
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_banned = false)
  );
CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE USING (auth.uid() = author_id);

-- Reacciones: cualquiera lee, usuarios autenticados crean/borran las propias
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reactions are viewable by everyone"
  ON reactions FOR SELECT USING (true);
CREATE POLICY "Users can create own reactions"
  ON reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own reactions"
  ON reactions FOR DELETE USING (auth.uid() = user_id);

-- Shadow ban: los usuarios baneados en sombra pueden insertar comentarios,
-- pero la policy SELECT filtra is_hidden=false, y el trigger los marca como ocultos
-- Esto crea la ilusión de que su comentario fue publicado, pero nadie lo ve
```

### 2.3 Modelo de Acceso Ciudadano — Estrategia Híbrida

Implementar múltiples métodos de autenticación y dejar que el usuario elija:

| Método | Ventaja | Fricción |
|--------|---------|----------|
| **Email + Password** | Robusto, identidad persistente | Media — requiere registro |
| **Magic Link** | Sin contraseña | Baja — solo email |
| **Google OAuth** | Un clic | Muy baja |
| **Facebook OAuth** | Alta penetración en RD | Muy baja |

**Flujo de registro:**

```
1. Ciudadano visita /foro → ve posts (lectura libre, sin login)
2. Quiere comentar → clic en "Participar"
3. Elige método de autenticación
4. Verifica identidad (email/magic link/OAuth)
5. Completa perfil mínimo: nombre visible
6. Ya puede comentar y reaccionar
```

**Validación anti-spam multicapa:**

| Capa | Mecanismo | Implementación |
|------|-----------|---------------|
| 1 | CAPTCHA en registro | Cloudflare Turnstile (gratuito, sin fricción visual) |
| 2 | Email verificado obligatorio | No se puede comentar sin verificar |
| 3 | Moderación de primer comentario | Primer comentario de usuario nuevo requiere aprobación manual |
| 4 | Rate limiting | Max 5 comentarios/hora por usuario |
| 5 | Filtro de palabras prohibidas | Auto-hide si contiene palabra baneada |
| 6 | Shadow ban | Usuario baneado comenta pero nadie lo ve |
| 7 | Reporte ciudadano | Cualquier usuario puede reportar |
| 8 | Cola de moderación | Admin revisa reportes y comentarios pendientes |

### 2.4 Portal Público — Foro

**Rutas:**

| Ruta | Contenido |
|------|-----------|
| `/foro` | Listado de posts con filtros y búsqueda |
| `/foro/[slug]` | Detalle del post + comentarios + reacciones |
| `/foro/categoria/[cat]` | Posts por categoría |
| `/perfil` | Mi perfil y mis comentarios |

**Componentes clave:**

- **Post Cards** — Título, excerpt, categoría, # comentarios, reacciones, fecha
- **Post Detail** — Contenido completo + sección de comentarios
- **Comentarios anidados** — Máximo 2 niveles (comentario → respuesta)
- **Reacciones** — Like, Acuerdo, Desacuerdo
- **Ordenamiento** — Por fecha, por popularidad, por # comentarios
- **Búsqueda** — Full-text search sobre títulos y contenido

### 2.5 Backoffice — Moderación

| Ruta | Función |
|------|---------|
| `/admin/foro/posts` | Crear/editar/eliminar posts |
| `/admin/foro/comentarios` | Ver, ocultar, eliminar comentarios (con filtros) |
| `/admin/foro/reportes` | Cola de reportes de abuso (workflow: pendiente → revisado → resuelto) |
| `/admin/foro/usuarios` | Ver usuarios, banear, shadow ban, ver historial |
| `/admin/foro/filtro` | Gestionar lista de palabras prohibidas |

### 2.6 Fases de Implementación — Foro

| Sub-fase | Entregable | Duración estimada |
|----------|-----------|-------------------|
| **F1** | Schema Supabase + RLS + Auth (email+social) + perfil | 1 semana |
| **F2** | Portal: listado de posts + detalle + comentarios | 1.5 semanas |
| **F3** | Portal: reacciones + reportes + perfiles | 1 semana |
| **F4** | Backoffice: gestión de posts + moderación | 1 semana |
| **F5** | Anti-spam + CAPTCHA + shadow ban + optimizaciones | 0.5 semanas |

**Total estimado Foro: ~5 semanas**

---

## 3. Roadmap General

### Cronograma propuesto (8.5 semanas — Fase 1 Observatorio + Foro completo)

```
Semana  1  2  3  4  5  6  7  8  9
        ├──┼──┼──┼──┼──┼──┼──┼──┤
OBS.O1.1 ████                              ← Schema + seed Supabase
OBS.O1.2     ████                          ← API Routes
OBS.O1.3         ██████                    ← Backoffice upload XLS + parser
OBS.O1.4             ██████                ← Portal observatorio + charts
OBS.O1.5                 ████              ← IA OpenRouter
FORO.F1  ████                              ← Auth + Schema foro
FORO.F2      ██████                        ← Posts + comentarios
FORO.F3              ████                  ← Reacciones + perfiles
FORO.F4                  ████              ← Backoffice foro
OBS.O1.6                 ████              ← Seed data (parse XLS inicial)
FORO.F5                      ██            ← Anti-spam + CAPTCHA
OBS.O1.7                          ████     ← Testing + deploy
TESTING                               ████ ← QA + bugs + deploy final
```

**Paralelización:** Observatorio y Foro avanzan en paralelo. Ambos comparten el mismo proyecto Supabase, así que el schema se define una sola vez al inicio.

### Dependencias entre fases

```
Supabase project setup (día 1)
    │
    ├──▶ OBS.O1.1 (schema + seed) ──▶ OBS.O1.2 (API routes) ──▶ OBS.O1.3 (upload XLS)
    │                                                                │
    │                                        OBS.O1.4 (portal) ◀─────┘
    │                                              │
    │                                        OBS.O1.5 (IA) ──▶ OBS.O1.6 (seed) ──▶ OBS.O1.7 (deploy)
    │
    └──▶ FORO.F1 (auth) ──▶ FORO.F2 (posts) ──▶ FORO.F3 (reacciones)
                                                    │
                                              FORO.F4 (backoffice)
                                                    │
                                              FORO.F5 (anti-spam)
```

---

## 4. Fases Futuras del Observatorio (Post-Fase 1)

Una vez validada la arquitectura con la Fase 1, se agregarán nuevas fases según el cliente aporte fuentes de datos:

| Fase | Nombre tentativo | Fuente | Parsing | Esfuerzo estimado |
|------|-----------------|--------|---------|-------------------|
| Fase 2 | Por definir según PDFs del cliente | PDF + XLS si existe | pdfplumber + revisión manual | 2-3 semanas |
| Fase 3 | Por definir | PDF-only | IA con visión (GPT-4o) + OCR | 3-4 semanas |
| ... | Se agregan según necesidad | | | |

**Estrategia para PDFs sin XLS (fases futuras):**

1. **Primera pasada**: Intentar `pdfplumber` para extraer tablas automáticamente
2. **Segunda pasada**: Si la tabla está incompleta, parser basado en posición (coordenadas X/Y)
3. **Tercera pasada**: Modo "entrada manual asistida" — admin ve el PDF y transcribe valores clave
4. **Futuro**: IA con visión (GPT-4o / Claude con visión) para extraer datos de gráficos y tablas

---

## 5. Decisiones Técnicas Pendientes

| # | Decisión | Opciones | Recomendación | Impacto |
|---|----------|----------|---------------|---------|
| D1 | ¿Proveedor Supabase? | Cloud (gratis hasta 500MB) vs Self-hosted | **Cloud** para MVP | $0 en fase inicial |
| D2 | ¿Modelo IA por defecto? | GPT-4o-mini vs Claude vs Gemini | **GPT-4o-mini** para inicio | ~$5-20/mes |
| D3 | ¿Nivel de anidación de comentarios? | 1 nivel vs 2 niveles vs ilimitado | **2 niveles** | Complejidad UI y moderación |
| D4 | ¿Moderación pre o post-publicación? | Pre (aprobar antes) vs Post (reportar después) | **Post con auto-ocultar** por palabras clave | Balance velocidad/seguridad |
| D5 | ¿Registro obligatorio para leer foro? | Sí vs No | **No** — lectura libre | Más participación |
| D6 | ¿Identidad anónima permitida? | Seudónimos vs Nombre real | **Seudónimos permitidos** | Privacidad vs transparencia |
| D7 | ¿Notificaciones por email? | Sí vs No | **Sí** para respuestas a comentarios | Requiere Edge Functions |
| D8 | ¿Exportar datos del observatorio? | CSV/PNG descargable vs No | **Sí, CSV + PNG** | Valor para investigadores |
| D9 | ¿OAuth providers para foro? | Google / Facebook / ambos | **Ambos** | Mayor penetración en RD |

---

## 6. Estimación de Costos

### Infraestructura

| Servicio | Plan | Costo mensual |
|----------|------|---------------|
| Supabase | Free tier (500MB DB, 1GB Storage) | $0 |
| Supabase | Pro (8GB DB, 100GB Storage) — si se necesita | $25 |
| OpenRouter | Pay-per-token | $5-30 |
| Netlify | Free tier (100GB bandwidth) | $0 |
| Cloudflare Turnstile | Free (hasta 1M verificaciones) | $0 |
| **Total estimado MVP** | | **$0-30/mes** |

### Horas de desarrollo — Fase 1

| Módulo | Horas estimadas |
|--------|----------------|
| Observatorio Fase 1 (7 sub-fases) | ~210 horas |
| Foro completo (5 fases) | ~200 horas |
| Testing + deploy | ~60 horas |
| **Total Fase 1 + Foro** | **~470 horas** |

---

## 7. Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| XLS con estructura cambiante entre meses | Media | Medio | Mapping templates versionados; alertas cuando el parser falla; preview editable antes de confirmar |
| Datos oficiales incompletos o inconsistentes | Baja | Alto | Validación en ingesta; flags de calidad en data_points |
| Usuarios crean cuentas para spam/trolling | Media | Alto | Rate limiting + shadow ban + email verificado + CAPTCHA + moderación de primer comentario |
| Costo de IA se dispara | Baja | Medio | Rate limiting por usuario; modelo barato por defecto; presupuesto mensual con alertas |
| Supabase free tier se queda corto | Media | Bajo | Migración a Pro plan ($25/mes) es simple |
| PDFs de fases futuras no se parsean bien | Alta | Medio | (Futuro) Fallback a revisión manual; IA con visión como alternativa |

---

## 8. Próximos Pasos Inmediatos

1. **Crear proyecto en Supabase** y obtener URL + anon key + service key
2. **Confirmar decisiones técnicas** de la sección 5
3. **Obtener API key de OpenRouter** y configurar modelo por defecto
4. **Definir indicadores prioritarios** — de los ~200+ detectados, cuáles son los 15-20 más importantes para mostrar en la página principal del observatorio
5. **Configurar OAuth providers** (Google + Facebook) en Supabase para el foro
6. **Arrancar OBS.O1.1 + FORO.F1** en paralelo (schema + auth)
