# Plan de Desarrollo: Observatorio Energético & Foro Ciudadano

**Proyecto:** Secretaría de Energía — Fuerza del Pueblo
**Plataforma:** energia-fp.netlify.app
**Stack actual:** Next.js 16 + React + Supabase (por implementar)
**Fecha:** Mayo 2026 (actualizado con análisis de datos reales)

---

## 0. Hallazgos del Análisis de Datos Reales

> **Fuente:** `Informe-de-Desempeno-marzo-2026.xlsx` (2.8MB, 11 hojas) y `Informe_Desempeno_EEE_marzo_2026.pdf` (4.2MB, 126 páginas)

### Estructura del XLS — 11 hojas con datos estructurados

| Hoja | Contenido | Tipo de datos |
|------|-----------|---------------|
| `Variables Relevantes` | Precios combustibles, generación por tipo, costos marginales, tasa de cambio | Series temporales mensuales (2009→2026) |
| `EDE's` | Compra/venta/cobro energía, pérdidas, cobranza, CRI, clientes, empleados por EDE | Desglose por Edenorte/Edesur/Edeeste |
| `CDEEE` | Energía comprada por generadora (GSF, CESPM, DPP, etc.) | Desglose por empresa generadora |
| `EGEHID` | Energía facturada, mercado contratos vs spot, ingresos, gastos, resultado financiero | Empresa hidroeléctrica estatal |
| `ETED` | Peaje transmisión, derecho uso/conexión, gastos operativos, resultado financiero | Empresa de transmisión |
| `EGPC` | Energía facturada, mercado contratos vs spot, ingresos, gastos, resultado | Punta Catalina |
| `Anexo Res Financieros` | Resultado financiero detallado (ingresos, gastos, compra energía, OPEX, CAPEX) | Desglose mensual con subcategorías |
| `Anexo Deuda` | Deuda con generadoras privadas por empresa | Desglose por ~40 generadoras |
| `Nuevo Regimen tarifario` | Cargos tarifarios por tipo (BTS1, BTS2, etc.) y EDE | Trimestral, indexado vs aplicado |
| `Regimen tarifario anterior` | Cargos tarifarios régimen previo | Igual estructura |
| `Hoja1` | Vacía | — |

### Estructura del PDF — 126 páginas con gráficos y tablas

El PDF es el informe oficial con:
- **Resumen ejecutivo** (páginas 8-14): narrativo con datos clave
- **Variables Relevantes** (páginas 15-21): gráficos de combustibles, generación, costos
- **EDE's consolidado** (páginas 22-40): ~20 indicadores con gráficos y tablas comparativas
- **Edenorte** (páginas 41-60): mismos indicadores desglosados
- **Edesur** (páginas 61-80): mismos indicadores desglosados
- **Edeeste** (páginas 81-100): mismos indicadores desglosados
- **ETED** (páginas 101-109): indicadores de transmisión
- **EGEPC/Punta Catalina** (páginas 110-116): indicadores de generación
- **Nota metodológica**

### Patrones clave detectados

1. **El XLS tiene una estructura consistente** — Cada hoja tiene las mismas filas de encabezado (filas 2-7) con: organismo, tipo de informe, período actual vs anterior, deltas absolutos y porcentuales, y serie histórica mensual desde 2009
2. **Jerarquía de datos** — Indicadores tienen categoría → nombre → desglose por empresa/región
3. **Columnas repetitivas** — Periodo actual, periodo anterior, comparación D y D%, acumulado anual, y luego 12 columnas mensuales
4. **Series históricas largas** — Datos desde 2009, lo que permite análisis de tendencias de 17 años
5. **El PDF es más bien una versión impresa** del XLS con gráficos añadidos — los datos numéricos son los mismos
6. **Hay ~60+ indicadores distintos** solo en este informe mensual
7. **Los PDFs que NO tienen XLS** requerirán extracción de tablas, que es significativamente más complejo

### Implicaciones para el Plan

- El XLS tiene estructura suficiente para **parsing automático confiable** (~90%+)
- El PDF se puede usar como referencia visual, pero la extracción de tablas PDF es solo ~50-70% confiable
- Se necesita un modelo de datos que soporte **jerarquía de indicadores** (categoría → indicador → desglose por entidad)
- Las series históricas largas son un **activo valioso** para análisis con IA
- Se debe priorizar la ingesta por XLS cuando exista, y PDF solo como complemento

---

## 1. Visión General

Se definen dos grandes módulos que transforman el portal informativo actual en una plataforma interactiva con datos en tiempo real y participación ciudadana:

1. **Observatorio Energético** — Dashboard de indicadores alimentado por datos oficiales (PDF/XLS), con capacidad de análisis por IA
2. **Foro Ciudadano** — Espacio de participación donde la Secretaría publica y la ciudadanía responde

---

## 2. Requisito 1: Observatorio Energético

### 2.1 Arquitectura General

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────┐
│  Backoffice  │────▶│  Supabase DB │◀────│  Portal Público   │
│  (Admin UI)  │     │              │     │  (Observatorio)   │
│              │     │ - indicators │     │                    │
│ Upload PDF/  │     │ - reports    │     │ Charts + Tablas   │
│ Upload XLS   │     │ - data_points│     │ Filtros dinámicos │
│ Parse & Load │     │ - categories │     │ IA Analysis       │
└──────────────┘     │ - ai_logs    │     └──────────────────┘
                     └──────┬───────┘
                            │
                     ┌──────▼───────┐
                     │  OpenRouter   │
                     │  (IA API)    │
                     │  Análisis    │
                     │  contextual  │
                     └──────────────┘
```

### 2.2 Modelo de Datos — Supabase (Refinado con datos reales)

```sql
-- Entidades del sector eléctrico (Edenorte, Edesur, Edeeste, CDEEE, EGEHID, ETED, EGPC, etc.)
CREATE TABLE entities (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,            -- "Edenorte", "EGEHID", "ETED"
  slug        TEXT UNIQUE NOT NULL,     -- "edenorte", "egehid"
  type        TEXT NOT NULL,            -- "distribuidora", "generadora", "transmisora", "comercializadora"
  parent_id   UUID REFERENCES entities(id), -- null = entidad raíz, o referencia a EDE padre
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Categorías de indicadores (basado en las secciones del informe real)
CREATE TABLE indicator_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  icon        TEXT,
  color       TEXT,
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);
-- Datos reales: "Variables Relevantes", "EDE's", "CDEEE", "EGEHID", "ETED", "EGPC",
--   "Resultados Financieros", "Deuda", "Tarifas"

-- Indicadores (basado en los ~60+ indicadores del informe)
CREATE TABLE indicators (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id     UUID REFERENCES indicator_categories(id) ON DELETE CASCADE,
  entity_id       UUID REFERENCES entities(id),            -- null = consolidado nacional
  name            TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,
  unit            TEXT NOT NULL,           -- "%", "MW", "GWh", "USD MM", "cUSD/kWh", "DOP/kWh", "DOP/USD"
  description     TEXT,
  source          TEXT,                    -- "OC", "CDEEE", "BCRD", etc.
  frequency       TEXT DEFAULT 'monthly',  -- daily/weekly/monthly/quarterly/yearly
  target_value    NUMERIC,
  is_breakdown    BOOLEAN DEFAULT false,   -- true si es sub-indicador (ej: Edenorte dentro de EDE's)
  parent_indicator_id UUID REFERENCES indicators(id), -- para jerarquía
  sort_order      INT DEFAULT 0,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now()
);
-- Datos reales: "Pérdidas (%)", "Compra de Energía (GWh)", "Precio Medio de Compra (cUSD/kWh)",
--   "Cobranza (%)", "CRI (%)", "Energía Facturada (GWh)", "Deuda Corriente (USD MM)", etc.

-- Puntos de datos (las mediciones del tiempo)
CREATE TABLE data_points (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  indicator_id    UUID REFERENCES indicators(id) ON DELETE CASCADE,
  value           NUMERIC NOT NULL,
  date            DATE NOT NULL,
  region          TEXT,                    -- null = nacional, o "Norte", "Sur", "Este"
  entity_id       UUID REFERENCES entities(id), -- desglose por entidad si aplica
  source_file     TEXT,                    -- nombre del archivo origen
  period_type     TEXT DEFAULT 'monthly',  -- monthly/quarterly/yearly
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
  file_url        TEXT NOT NULL,
  file_type       TEXT NOT NULL,            -- pdf / xls / xlsx / csv
  file_size       BIGINT,
  publish_date    DATE,
  source_org      TEXT,                     -- "MEM", "VME", "OC"
  report_type     TEXT,                     -- "desempeno_mensual", "desempeno_trimestral", "tarifario", etc.
  category_id     UUID REFERENCES indicator_categories(id),
  has_xls         BOOLEAN DEFAULT false,   -- true si existe versión XLS
  is_published    BOOLEAN DEFAULT false,
  uploaded_by     UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Logs de análisis IA
CREATE TABLE ai_analysis_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  indicator_id    UUID REFERENCES indicators(id),
  user_query      TEXT NOT NULL,
  ai_response     TEXT NOT NULL,
  model_used      TEXT,
  tokens_used     INT,
  created_at      TIMESTAMPTZ DEFAULT now()
);
```

**Índices recomendados:**
- `data_points(indicator_id, date)` — queries de series temporales
- `data_points(date)` — filtrar por rango
- `reports(category_id, publish_date)` — listado filtrado
- `indicators(category_id)` — agrupación por categoría

### 2.3 Pipeline de Ingesta de Datos (Refinado con datos reales)

El flujo para alimentar la BD desde archivos oficiales:

```
PDF/XLS ──▶ Upload en Backoffice ──▶ Almacenamiento en Supabase Storage
                                          │
                                          ▼
                                   Parser automático
                                   ┌─────────────────┐
                                   │ XLS/XLSX/CSV:   │
                                   │  - Leer con      │
                                   │    openpyxl      │
                                   │  - Detectar hoja │
                                   │  - Mapear filas  │
                                   │    a indicadores │
                                   │  - Extraer serie │
                                   │    histórica     │
                                   │  - Insertar a    │
                                   │    data_points   │
                                   └────────┬────────┘
                                   ┌────────▼────────┐
                                   │ PDF:             │
                                   │  - Extraer tablas│
                                   │    con pdfplumber │
                                   │  - Fallback: OCR │
                                   │  - Revisión manual│
                                   │  - Insertar filas │
                                   └─────────────────┘
```

**Estructura real del XLS detectada (patrón repetido en todas las hojas):**

```
Fila 2:  Organismo ("Ministerio de Energía y Minas")
Fila 3:  Tipo de documento ("Variables Relevantes" / "Indicadores Gestión Comercial...")
Fila 4:  "Valores según indicación"
Fila 5:  Año de inicio de serie histórica (2009)
Fila 6:  Períodos: "Ene26-Mar26" | "Ene25-Mar25" | Comparación | "Ene24-Mar24" | Comparación | "Acumulado Año"
Fila 7:  Sub-encabezados: "D" | "D%" | "D" | "D%" | Mes1 | Mes2 | ... | Mes12
Fila 8+: Datos — Columna A=Código, Columna B=Nombre indicador, Columna C+=Valores
```

**Estrategia de parsing por formato:**

| Formato | Librería | Precisión estimada | Notas basadas en datos reales |
|---------|----------|-------------------|-------------------------------|
| XLS/XLSX | `openpyxl` | ~90% | Estructura consistente entre hojas. Filas de encabezado fijas (2-7). Indicadores en col B, valores de col C en adelante |
| CSV | `pandas` | ~95% | Si se exporta del XLS, mismo formato |
| PDF tabular | `pdfplumber` | ~50-70% | Tablas del PDF son renderizadas como gráficos; pdfplumber detecta algunas pero con celdas vacías |
| PDF escaneado | OCR | ~30-50% | No aplica a este informe (es digital), pero otros PDFs del sector pueden ser escaneados |

**Mapping template específico para "Informe de Desempeño":**

```json
{
  "template_name": "Informe Desempeño EEE Mensual",
  "file_pattern": "Informe*Desempeno*.xlsx",
  "sheets_to_parse": ["Variables Relevantes", "EDE's", "CDEEE", "EGEHID", "ETED", "EGPC"],
  "header_rows": 7,
  "structure": {
    "row_start": 8,
    "col_code": "A",
    "col_name": "B",
    "col_current_period": "C",
    "col_previous_period": "D",
    "col_delta_abs": "E",
    "col_delta_pct": "F",
    "col_acum_year_start": "G",
    "monthly_columns_start": "G",
    "monthly_columns_count": 12
  },
  "entity_detection": {
    "method": "sheet_name",
    "mapping": {
      "EDE's": ["Edenorte", "Edesur", "Edeeste"],
      "CDEEE": "CDEEE",
      "EGEHID": "EGEHID",
      "ETED": "ETED",
      "EGPC": "EGPC"
    }
  },
  "breakdown_detection": {
    "method": "indent_level",
    "parent_rows_have_no_code": true,
    "child_rows_have_entity_name": ["Edenorte", "Edesur", "Edeeste"]
  }
}
```

**NUEVO: Estrategia para PDFs sin XLS correspondiente**

Dado que la mayoría de los datos del observatorio estarán solo en PDF:

1. **Primera pasada**: Intentar `pdfplumber` para extraer tablas automáticamente
2. **Segunda pasada**: Si la tabla está incompleta, usar un parser basado en posición (detectar bloques de datos por coordenadas X/Y)
3. **Tercera pasada**: Si falla, habilitar modo "entrada manual asistida" donde el admin ve el PDF y transcribe los valores clave
4. **Futuro**: Evaluar uso de IA (GPT-4o con visión) para extraer datos de gráficos y tablas en PDF

### 2.4 Backoffice (Panel de Administración)

**Rutas propuestas dentro del mismo Next.js:**

| Ruta | Función |
|------|---------|
| `/admin` | Dashboard con resumen de indicadores, últimos uploads, alertas |
| `/admin/indicators` | CRUD de indicadores y categorías |
| `/admin/upload` | Subir PDF/XLS, seleccionar template, revisar datos extraídos |
| `/admin/data` | Tabla editable de data_points (editar, eliminar, corregir) |
| `/admin/reports` | Gestionar informes oficiales (publicar/ocultar) |
| `/admin/mapping-templates` | Definir cómo se parsea cada tipo de archivo |
| `/admin/ai-logs` | Ver historial de consultas IA y respuestas |

**Autenticación:** Supabase Auth con rol `admin`. Solo usuarios con este rol acceden al backoffice. Se puede implementar con middleware de Next.js que verifique el claim `role = 'admin'` en el JWT.

**Flujo de upload:**
1. Admin sube archivo (PDF/XLS/CSV)
2. Sistema lo almacena en Supabase Storage
3. Si existe mapping template → parseo automático → preview de datos
4. Si no → admin define el mapeo manualmente (asocia columnas a indicadores)
5. Admin revisa los datos extraídos en tabla preview
6. Admin confirma → datos se insertan en `data_points`
7. Se crea registro en `reports` con metadata

### 2.5 Portal Público — Observatorio

**Rutas propuestas:**

| Ruta | Contenido |
|------|-----------|
| `/observatorio` | Página principal con KPIs destacados y resumen |
| `/observatorio/[category]` | Indicadores de una categoría (ej: Electricidad) |
| `/observatorio/[category]/[indicator]` | Detalle de indicador con gráfico temporal, tabla, análisis IA |
| `/observatorio/informes` | Listado de informes descargables |

**Componentes clave:**

- **KPI Cards** — Valor actual + tendencia + sparkline (ya existe versión estática, migrar a datos reales)
- **Gráficos interactivos** — Usar Recharts (ya incluido en shadcn/ui) o Chart.js
- **Filtros** — Por categoría, rango de fechas, región
- **Tablas de datos** — Con paginación, ordenamiento, exportación
- **Comparadores** — YOY (year-over-year), MOM (month-over-month)
- **Análisis IA** — Botón "Analizar con IA" que envía contexto del indicador a OpenRouter

### 2.6 Estrategia de IA con OpenRouter

**Modelo de integración:**

OpenRouter actúa como gateway a múltiples modelos de IA. La ventaja es poder elegir el modelo óptimo por caso de uso y controlar costos.

**Arquitectura:**

```
[Usuario clic "Analizar"]
        │
        ▼
[Next.js API Route /api/ai/analyze]
        │
        ├── 1. Construir prompt con contexto:
        │     - Indicador: nombre, unidad, descripción
        │     - Datos: últimos N data_points (JSON)
        │     - Metadata: fuente, frecuencia, región
        │     - Query del usuario (si proporcionó una)
        │
        ├── 2. Llamar OpenRouter API:
        │     POST https://openrouter.ai/api/v1/chat/completions
        │     Headers: Authorization: Bearer sk-xxx
        │     Model: openai/gpt-4o-mini (costo bajo)
        │            o anthropic/claude-3.5-sonnet (más capaz)
        │
        ├── 3. Guardar log en ai_analysis_logs
        │
        └── 4. Devolver respuesta al frontend
```

**Prompt engineering — System prompt base:**

```
Eres un analista energético experto en el sector eléctrico de la
República Dominicana. Analizas datos del Observatorio de Energía
de la Secretaría de Energía de Fuerza del Pueblo.

Reglas:
- Responde en español
- Cita los datos numéricos específicos en tu análisis
- Identifica tendencias, anomalías y comparaciones relevantes
- Si hay datos insuficientes, indícalo claramente
- Sugiere acciones o investigaciones adicionales cuando sea pertinente
- No inventes datos; trabaja solo con los proporcionados
- Usa formato markdown en tu respuesta
```

**Selección de modelo por caso de uso:**

| Caso de uso | Modelo recomendado | Costo aprox. | Razón |
|---|---|---|---|
| Análisis rápido de tendencia | `openai/gpt-4o-mini` | ~$0.15/1M tokens | Rápido y barato para análisis simple |
| Análisis profundo con contexto | `anthropic/claude-sonnet-4` | ~$3/1M tokens | Mejor razonamiento para datos complejos |
| Generación de informe resumen | `google/gemini-2.0-flash` | ~$0.10/1M tokens | Buen balance costo/calidad para texto largo |
| Comparación multi-indicador | `anthropic/claude-sonnet-4` | ~$3/1M tokens | Maneja mejor contexto múltiple |

**Tipos de análisis que se pueden ofrecer:**

1. **Tendencia** — "¿Cuál es la tendencia de este indicador en los últimos 12 meses?"
2. **Comparación** — "Compara las pérdidas eléctricas entre regiones"
3. **Anomalía** — "¿Hay valores atípicos en estos datos?"
4. **Proyección** — "Si la tendencia continúa, ¿cuál sería el valor en 6 meses?" (con disclaimer)
5. **Resumen** — "Genera un resumen ejecutivo de la categoría X"
6. **Libre** — El usuario escribe su pregunta en lenguaje natural

**Seguridad:**
- Rate limiting por IP (ej: 10 consultas/hora para usuarios anónimos)
- Rate limiting por usuario autenticado (ej: 50/hora)
- Sanitización de inputs del usuario antes de enviar a la API
- No exponer la API key de OpenRouter en el frontend — siempre vía API route de Next.js
- Logging de todas las consultas para auditoría

### 2.7 Fases de Implementación — Observatorio

| Fase | Entregable | Duración estimada |
|------|-----------|-------------------|
| **F1** | Schema Supabase + seed data + API routes básicas | 1 semana |
| **F2** | Backoffice: upload XLS/CSV + parsing automático | 1.5 semanas |
| **F3** | Backoffice: upload PDF + parsing con revisión manual | 1 semana |
| **F4** | Portal: páginas de indicadores con charts reales | 1.5 semanas |
| **F5** | Integración IA (OpenRouter) + UI de análisis | 1 semana |
| **F6** | Mapping templates + bulk upload + optimizaciones | 1 semana |

**Total estimado: ~7 semanas**

---

## 3. Requisito 2: Foro Ciudadano

### 3.1 Arquitectura General

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────┐
│  Admin/      │     │  Supabase DB │     │  Portal Público   │
│  Moderador   │────▶│              │◀────│  (Foro)           │
│              │     │ - posts      │     │                    │
│ Crear posts  │     │ - comments   │     │ Ver posts          │
│ Moderar      │     │ - users      │     │ Comentar           │
│ Banear       │     │ - reports    │     │ Reportar abuso     │
└──────────────┘     │ - reactions  │     └──────────────────┘
                     └──────────────┘
```

### 3.2 Modelo de Datos — Supabase

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
  comment_count   INT DEFAULT 0,
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
  parent_id       UUID REFERENCES comments(id) ON DELETE CASCADE, -- para respuestas anidadas
  content         TEXT NOT NULL,
  is_hidden       BOOLEAN DEFAULT false,   -- moderación
  hidden_by       UUID REFERENCES auth.users(id),
  hidden_reason   TEXT,
  reaction_count  INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Reacciones (likes, apoyo, etc.)
CREATE TABLE reactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id),
  target_id       UUID NOT NULL,           -- ID del post o comentario
  target_type     TEXT NOT NULL CHECK (target_type IN ('post', 'comment')),
  reaction_type   TEXT NOT NULL DEFAULT 'like' CHECK (reaction_type IN ('like', 'agree', 'disagree', 'flag')),
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, target_id, target_type)  -- un usuario, una reacción por target
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
```

**Row Level Security (RLS) — CRÍTICO:**

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

-- Comentarios: cualquiera puede leer los no ocultos, usuarios autenticados crean
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Non-hidden comments are viewable by everyone"
  ON comments FOR SELECT USING (is_hidden = false);
CREATE POLICY "Authenticated non-banned users can comment"
  ON comments FOR INSERT WITH CHECK (
    auth.uid() = author_id
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_banned = false)
  );

-- Reacciones: cualquiera lee, usuarios autenticados crean/borran las propias
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reactions are viewable by everyone"
  ON reactions FOR SELECT USING (true);
CREATE POLICY "Users can create own reactions"
  ON reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own reactions"
  ON reactions FOR DELETE USING (auth.uid() = user_id);
```

### 3.3 Modelo de Acceso Ciudadano — Estrategia

Este es el punto más crítico: ¿cómo permitir que ciudadanos comenten libremente pero de forma segura?

**Opción A: Supabase Auth con Email/Password (RECOMENDADA)**

| Ventaja | Desventaja |
|---------|------------|
| Robusta, soportada nativamente | Fricción: el ciudadano debe registrarse |
| RLS funciona de forma nativa | Necesitan verificar email |
| Permite banear usuarios por ID | Password management |
| Identidad persistente | — |

**Opción B: Magic Link (sin password)**

| Ventaja | Desventaja |
|---------|------------|
| Sin contraseña — el usuario recibe un link por email | Depende de deliverability de email |
| Fricción mínima | No todos los dominicanos tienen email |
| Supabase lo soporta nativamente | Requiere email verificado |

**Opción C: Login Social (Google, Facebook)**

| Ventaja | Desventaja |
|---------|------------|
| Muy bajo friction | Dependencia de terceros |
| El usuario ya tiene la cuenta | Privacidad: comparte datos con Google/FB |
| Identidad verificada | Algunos ciudadanos no tienen cuentas |

**Opción D: Híbrida (RECOMENDACIÓN FINAL)**

Implementar **todas las opciones anteriores** y dejar que el usuario elija:

1. **Email + Password** — Para quienes prefieren cuenta propia
2. **Magic Link** — Para quienes no quieren recordar contraseña
3. **Google OAuth** — Un clic, la mayoría lo tiene
4. **Facebook OAuth** — Alta penetración en RD

El usuario solo necesita **UN método** para crear su cuenta. Una vez autenticado, el `profiles` table se pobla automáticamente via trigger.

**Flujo de registro:**

```
1. Ciudadano visita /foro
2. Ve los posts (lectura libre, sin login)
3. Quiere comentar → clic en "Participar"
4. Elige método de autenticación
5. Verifica identidad (email/magic link/OAuth)
6. Completa perfil mínimo: nombre visible
7. Ya puede comentar y reaccionar
```

**Validación anti-spam:**

| Mecanismo | Implementación |
|-----------|---------------|
| Rate limiting de comentarios | Max 5 comentarios por hora por usuario |
| Verificación de email obligatoria | No se puede comentar sin email verificado |
| Filtro de palabras prohibidas | Lista configurable en Supabase |
| Moderación pre-publicación (opcional) | Primer comentario de un usuario nuevo requiere aprobación |
| CAPTCHA en registro | hCaptcha o Cloudflare Turnstile (gratuitos) |
| Reporte ciudadano | Cualquier usuario puede reportar un comentario |
| Shadow ban | Usuario baneado puede comentar pero nadie lo ve |

### 3.4 Portal Público — Foro

**Rutas propuestas:**

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
- **Reacciones** — Like, Acuerdo, Desacuerdo (emoji-style, sin texto libre)
- **Ordenamiento** — Por fecha, por popularidad, por # comentarios
- **Búsqueda** — Full-text search sobre títulos y contenido

### 3.5 Backoffice — Moderación

**Rutas:**

| Ruta | Función |
|------|---------|
| `/admin/foro/posts` | Crear/editar/eliminar posts |
| `/admin/foro/comentarios` | Ver, ocultar, eliminar comentarios |
| `/admin/foro/reportes` | Cola de reportes de abuso |
| `/admin/foro/usuarios` | Ver usuarios, banear, ver historial |

### 3.6 Fases de Implementación — Foro

| Fase | Entregable | Duración estimada |
|------|-----------|-------------------|
| **F1** | Schema Supabase + RLS + Auth (email+social) | 1 semana |
| **F2** | Portal: listado de posts + detalle + comentarios | 1.5 semanas |
| **F3** | Portal: reacciones + reportes + perfiles | 1 semana |
| **F4** | Backoffice: gestión de posts + moderación | 1 semana |
| **F5** | Anti-spam + CAPTCHA + shadow ban + optimizaciones | 0.5 semanas |

**Total estimado: ~5 semanas**

---

## 4. Roadmaster General

### Cronograma propuesto (12 semanas)

```
Semana  1  2  3  4  5  6  7  8  9  10  11  12
        ├──┼──┼──┼──┼──┼──┼──┼──┼──┼───┼───┤
OBS.F1  ████                                                    ← Schema + seed + API
OBS.F2      ████████                                            ← Upload XLS/CSV
OBS.F3              ████████                                    ← Upload PDF
FORO.F1  ████                                                    ← Auth + Schema
FORO.F2      ████████                                           ← Posts + comentarios
FORO.F3              ████                                       ← Reacciones + perfiles
OBS.F4                  ████████                                ← Charts + portal observatorio
OBS.F5                          ████                            ← IA OpenRouter
FORO.F4                          ████                           ← Backoffice foro
OBS.F6                              ████                        ← Templates + optimización
FORO.F5                                  ████                   ← Anti-spam + CAPTCHA
TESTING                                      ████████           ← QA + bugs
DEPLOY                                                   ████   ← Deploy + monitoreo
```

**Paralelización:** Observatorio y Foro avanzan en paralelo en las primeras fases (ambos necesitan Supabase, así que el schema se define una sola vez).

### Dependencias entre fases

```
Supabase project setup (día 1)
    │
    ├──▶ OBS.F1 (schema + seed) ──▶ OBS.F2 (upload XLS) ──▶ OBS.F3 (upload PDF)
    │                                                          │
    │                                    OBS.F4 (portal) ◀─────┘
    │                                          │
    │                                    OBS.F5 (IA) ──▶ OBS.F6 (templates)
    │
    └──▶ FORO.F1 (auth) ──▶ FORO.F2 (posts) ──▶ FORO.F3 (reacciones)
                                                        │
                                                  FORO.F4 (backoffice)
                                                        │
                                                  FORO.F5 (anti-spam)
```

---

## 5. Decisiones Técnicas Pendientes

Estos puntos requieren validación del cliente antes de implementar:

| # | Decisión | Opciones | Recomendación | Impacto |
|---|----------|----------|---------------|---------|
| D1 | ¿Qué proveedor de Supabase? | Supabase Cloud (gratis hasta 500MB) vs Self-hosted | **Cloud** para MVP | Costo $0 en fase inicial |
| D2 | ¿Modelo IA por defecto? | GPT-4o-mini vs Claude vs Gemini | **GPT-4o-mini** para inicio | ~$5-20/mes estimado |
| D3 | ¿Nivel de anidación de comentarios? | 1 nivel (solo respuestas) vs 2 niveles vs ilimitado | **2 niveles** | Complejidad UI y moderación |
| D4 | ¿Moderación pre o post-publicación? | Pre (aprobar antes) vs Post (reportar después) | **Post con auto-ocultar** por palabras clave | Balance entre velocidad y seguridad |
| D5 | ¿Registro obligatorio para leer? | Sí vs No | **No** — lectura libre | Más participación |
| D6 | ¿Identidad anónima permitida? | Sí (seudónimos) vs No (nombre real) | **Seudónimos permitidos** | Privacidad vs transparencia |
| D7 | ¿Notificaciones por email? | Sí vs No | **Sí** para respuestas a comentarios | Requiere Supabase Edge Functions |
| D8 | ¿Exportar datos del observatorio? | CSV/PNG descargable vs No | **Sí, CSV + PNG** | Valor para investigadores |

---

## 6. Estimación de Costos

### Infraestructura

| Servicio | Plan | Costo mensual |
|----------|------|---------------|
| Supabase | Free tier (500MB DB, 1GB Storage) | $0 |
| Supabase | Pro (8GB DB, 100GB Storage) — si se necesita | $25 |
| OpenRouter | Pay-per-token | $5-30 (depende uso) |
| Netlify | Free tier (100GB bandwidth) | $0 |
| hCaptcha / Turnstile | Free (hasta 1M verificaciones) | $0 |
| **Total estimado MVP** | | **$0-30/mes** |

### Horas de desarrollo

| Módulo | Horas estimadas |
|--------|----------------|
| Observatorio (6 fases) | ~280 horas |
| Foro (5 fases) | ~200 horas |
| Testing + deploy | ~80 horas |
| **Total** | **~560 horas** |

---

## 7. Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| PDFs con formato irregular no se parsean bien | Alta | Medio | Fallback a revisión manual; mapping templates flexibles |
| Usuarios crean cuentas para spam/trolling | Media | Alto | Rate limiting, shadow ban, email verificado, CAPTCHA |
| Costo de IA se dispara | Baja | Medio | Rate limiting por usuario; modelo barato por defecto |
| Supabase free tier se queda corto | Media | Bajo | Migración a Pro plan ($25/mes) es simple |
| Datos oficiales incompletos o inconsistentes | Media | Alto | Validación en ingesta; indicadores de calidad de datos |
| Carga de XLS con estructura cambiante | Media | Medio | Mapping templates versionados; alertas cuando falla el parseo |

---

## 8. Próximos Pasos Inmediatos

1. **Crear proyecto en Supabase** y obtener URL + anon key + service key
2. **Confirmar decisiones técnicas** de la sección 5
3. **Recopilar archivos de datos** (PDF/XLS) de ejemplo para calibrar los parsers
4. **Obtener API key de OpenRouter** y configurar modelo por defecto
5. **Definir indicadores iniciales** — lista de los 10-20 indicadores más importantes con sus categorías
6. **Arrancar F1** de ambos módulos en paralelo (schema + auth)
