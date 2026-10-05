-- ============================================================
-- 005: Procedencia, ediciones del informe y control de carga
--
-- - reports: una fila por edición del Informe de Desempeño (MEM)
-- - data_points: cada valor sabe de qué edición, hoja y celda salió
-- - data_point_revisions: historial cuando una edición nueva cambia un valor
-- - ingestion_runs: registro de cada carga con sus verificaciones
-- - indicators: hoja y etiqueta de origen (trazabilidad del catálogo)
-- Idempotente.
-- ============================================================

-- Ediciones del informe
ALTER TABLE reports ADD COLUMN IF NOT EXISTS edition DATE;          -- mes que cubre el informe (2026-07-01)
ALTER TABLE reports ADD COLUMN IF NOT EXISTS source_url TEXT;        -- URL oficial del archivo
ALTER TABLE reports ADD COLUMN IF NOT EXISTS sha256 TEXT;            -- huella del archivo cargado
ALTER TABLE reports ADD COLUMN IF NOT EXISTS pdf_url TEXT;           -- PDF del informe de la misma edición
CREATE UNIQUE INDEX IF NOT EXISTS uq_reports_source_edition ON reports (source_org, report_type, edition);
COMMENT ON COLUMN reports.edition IS 'Mes que cubre la edición del informe (primer día del mes)';

-- Procedencia de cada dato
ALTER TABLE data_points ADD COLUMN IF NOT EXISTS report_id UUID REFERENCES reports(id) ON DELETE SET NULL;
ALTER TABLE data_points ADD COLUMN IF NOT EXISTS source_cell TEXT;   -- p. ej. EDE's!HN53
ALTER TABLE data_points ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
CREATE INDEX IF NOT EXISTS idx_data_points_report ON data_points (report_id);

-- Datos heredados sin procedencia (carga previa con asignaciones erróneas): se eliminan
-- y se recargan con scripts/mem-load.ts, que registra edición, hoja y celda de cada valor.
DELETE FROM data_points WHERE report_id IS NULL;
DROP INDEX IF EXISTS uq_data_points_indicator_date_entity;

-- Cada indicador pertenece a una sola entidad: la clave natural es (indicador, periodo, fecha)
CREATE UNIQUE INDEX IF NOT EXISTS uq_data_points_indicator_period_date ON data_points (indicator_id, period_type, date);

-- Trazabilidad del catálogo
ALTER TABLE indicators ADD COLUMN IF NOT EXISTS source_sheet TEXT;
ALTER TABLE indicators ADD COLUMN IF NOT EXISTS source_label TEXT;
ALTER TABLE indicators ADD COLUMN IF NOT EXISTS notes TEXT;

-- Historial de revisiones
CREATE TABLE IF NOT EXISTS data_point_revisions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  indicator_id    UUID NOT NULL REFERENCES indicators(id) ON DELETE CASCADE,
  period_type     TEXT NOT NULL,
  date            DATE NOT NULL,
  old_value       NUMERIC NOT NULL,
  new_value       NUMERIC NOT NULL,
  old_report_id   UUID REFERENCES reports(id) ON DELETE SET NULL,
  new_report_id   UUID REFERENCES reports(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_revisions_indicator ON data_point_revisions (indicator_id, date);
ALTER TABLE data_point_revisions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public read revisions" ON data_point_revisions;
CREATE POLICY "public read revisions" ON data_point_revisions FOR SELECT USING (true);
COMMENT ON TABLE data_point_revisions IS 'Cambios de valor entre ediciones del informe (registro público de revisiones)';

-- Registro de cargas
CREATE TABLE IF NOT EXISTS ingestion_runs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id     UUID REFERENCES reports(id) ON DELETE SET NULL,
  started_at    TIMESTAMPTZ DEFAULT now(),
  finished_at   TIMESTAMPTZ,
  status        TEXT NOT NULL CHECK (status IN ('running','success','failed')),
  stats         JSONB,
  checks        JSONB,
  error         TEXT
);
ALTER TABLE ingestion_runs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public read ingestion runs" ON ingestion_runs;
CREATE POLICY "public read ingestion runs" ON ingestion_runs FOR SELECT USING (true);

-- Tipos de entidad adicionales (mercado spot, usuarios no regulados, agrupaciones)
ALTER TABLE entities DROP CONSTRAINT IF EXISTS entities_type_check;
ALTER TABLE entities ADD CONSTRAINT entities_type_check CHECK (type IN (
  'distribuidora', 'generadora', 'transmisora', 'comercializadora',
  'generadora_privada', 'regulador', 'mercado', 'consumidor', 'agrupacion'
));
UPDATE entities SET type = 'mercado' WHERE slug = 'mercado-spot';
INSERT INTO entities (name, slug, type, sort_order) VALUES
  ('Usuarios No Regulados (UNR)', 'unr', 'consumidor', 30),
  ('Generadoras (GenCo''s)', 'gencos', 'agrupacion', 31)
ON CONFLICT (slug) DO NOTHING;

-- Defensa en profundidad: la clave pública nunca escribe
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
