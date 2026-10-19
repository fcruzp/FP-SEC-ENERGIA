-- ============================================================
-- 009: Latido (heartbeat) del keep-alive
--
-- Supabase pausa los proyectos gratuitos con poca "actividad de base de datos" en 7 días y no
-- define con precisión qué cuenta. Una lectura REST con resultado vacío podría no bastar; una
-- ESCRITURA real en una transacción sí cuenta. La tarea diaria de GitHub Actions actualiza esta
-- fila con la conexión del Session pooler (secret SUPABASE_DB_URL).
-- La clave pública no puede leerla ni escribirla. Idempotente.
-- ============================================================
CREATE TABLE IF NOT EXISTS keepalive_heartbeat (
  id         INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  last_beat  TIMESTAMPTZ NOT NULL DEFAULT now(),
  beats      BIGINT NOT NULL DEFAULT 0,
  source     TEXT
);
ALTER TABLE keepalive_heartbeat ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON keepalive_heartbeat FROM anon, authenticated;
COMMENT ON TABLE keepalive_heartbeat IS 'Latido diario del keep-alive (.github/workflows/supabase-keepalive.yml): una escritura real para que Supabase no pause el proyecto.';
