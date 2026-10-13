-- ============================================================
-- 007: API de integración (/api/v1) — llaves por aplicación
--
-- - api_clients: una fila por llave. Solo se guarda el hash SHA-256 de la llave
--   y un prefijo para reconocerla; la llave completa se muestra una sola vez.
-- - api_rate_counters: contadores por minuto y por día (límite de uso).
-- - api_request_log: auditoría de peticiones (sin la llave ni el contenido).
-- - api_authenticate(): busca la llave, verifica vigencia y consume el cupo
--   en una sola llamada.
-- Ninguna de estas tablas es legible con la clave pública (anon).
-- Idempotente.
-- ============================================================

CREATE TABLE IF NOT EXISTS api_clients (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  TEXT NOT NULL,                 -- aplicación consumidora, p. ej. "Skay"
  description           TEXT,
  contact               TEXT,                          -- responsable de la aplicación
  key_prefix            TEXT NOT NULL UNIQUE,          -- p. ej. fpe_live_7Hq2xK9 (para identificarla en pantalla)
  key_hash              TEXT NOT NULL UNIQUE,          -- SHA-256 (hex) de la llave completa
  scopes                TEXT[] NOT NULL DEFAULT ARRAY['read:catalog','read:data','read:revisions'],
  rate_limit_per_minute INTEGER NOT NULL DEFAULT 60 CHECK (rate_limit_per_minute > 0),
  rate_limit_per_day    INTEGER NOT NULL DEFAULT 10000 CHECK (rate_limit_per_day > 0),
  allowed_ips           TEXT[],                        -- NULL = cualquier IP
  expires_at            TIMESTAMPTZ,                   -- NULL = no vence
  revoked_at            TIMESTAMPTZ,
  last_used_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by            TEXT
);
COMMENT ON TABLE api_clients IS 'Llaves de la API de integración /api/v1 (solo hash). Gestión en /admin, pestaña Integraciones.';

CREATE TABLE IF NOT EXISTS api_rate_counters (
  client_id   UUID NOT NULL REFERENCES api_clients(id) ON DELETE CASCADE,
  window_kind TEXT NOT NULL CHECK (window_kind IN ('minute','day')),
  bucket      TIMESTAMPTZ NOT NULL,
  count       INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (client_id, window_kind, bucket)
);

CREATE TABLE IF NOT EXISTS api_request_log (
  id          BIGSERIAL PRIMARY KEY,
  client_id   UUID REFERENCES api_clients(id) ON DELETE CASCADE,
  at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  method      TEXT NOT NULL,
  path        TEXT NOT NULL,
  query       TEXT,
  status      INTEGER NOT NULL,
  duration_ms INTEGER,
  ip_hash     TEXT,
  request_id  TEXT
);
CREATE INDEX IF NOT EXISTS idx_api_request_log_client_at ON api_request_log (client_id, at DESC);
CREATE INDEX IF NOT EXISTS idx_api_request_log_at ON api_request_log (at DESC);
COMMENT ON TABLE api_request_log IS 'Auditoría de /api/v1: nunca guarda la llave ni el cuerpo de la respuesta. Se conserva 90 días.';

ALTER TABLE api_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_rate_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_request_log ENABLE ROW LEVEL SECURITY;
-- Sin políticas: solo el service role (servidor) accede.
REVOKE ALL ON api_clients, api_rate_counters, api_request_log FROM anon, authenticated;
REVOKE ALL ON SEQUENCE api_request_log_id_seq FROM anon, authenticated;

-- Autenticación + límite de uso en una sola llamada.
-- status: ok | invalid | revoked | expired | rate_limited_minute | rate_limited_day
CREATE OR REPLACE FUNCTION api_authenticate(p_key_hash TEXT)
RETURNS TABLE (
  status          TEXT,
  client_id       UUID,
  client_name     TEXT,
  scopes          TEXT[],
  allowed_ips     TEXT[],
  limit_minute    INTEGER,
  limit_day       INTEGER,
  used_minute     INTEGER,
  used_day        INTEGER,
  reset_minute    TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
  c        api_clients%ROWTYPE;
  b_minute TIMESTAMPTZ := date_trunc('minute', now());
  b_day    TIMESTAMPTZ := date_trunc('day', now());
  n_minute INTEGER;
  n_day    INTEGER;
BEGIN
  SELECT * INTO c FROM api_clients WHERE key_hash = p_key_hash;
  IF NOT FOUND THEN
    RETURN QUERY SELECT 'invalid'::TEXT, NULL::UUID, NULL::TEXT, NULL::TEXT[], NULL::TEXT[], NULL::INT, NULL::INT, NULL::INT, NULL::INT, NULL::TIMESTAMPTZ;
    RETURN;
  END IF;
  IF c.revoked_at IS NOT NULL THEN
    RETURN QUERY SELECT 'revoked'::TEXT, c.id, c.name, c.scopes, c.allowed_ips, c.rate_limit_per_minute, c.rate_limit_per_day, NULL::INT, NULL::INT, NULL::TIMESTAMPTZ;
    RETURN;
  END IF;
  IF c.expires_at IS NOT NULL AND c.expires_at <= now() THEN
    RETURN QUERY SELECT 'expired'::TEXT, c.id, c.name, c.scopes, c.allowed_ips, c.rate_limit_per_minute, c.rate_limit_per_day, NULL::INT, NULL::INT, NULL::TIMESTAMPTZ;
    RETURN;
  END IF;

  INSERT INTO api_rate_counters AS r (client_id, window_kind, bucket, count) VALUES (c.id, 'minute', b_minute, 1)
    ON CONFLICT (client_id, window_kind, bucket) DO UPDATE SET count = r.count + 1
    RETURNING r.count INTO n_minute;
  INSERT INTO api_rate_counters AS r (client_id, window_kind, bucket, count) VALUES (c.id, 'day', b_day, 1)
    ON CONFLICT (client_id, window_kind, bucket) DO UPDATE SET count = r.count + 1
    RETURNING r.count INTO n_day;

  UPDATE api_clients SET last_used_at = now() WHERE id = c.id;

  -- Limpieza ocasional de contadores y registros viejos
  IF random() < 0.01 THEN
    DELETE FROM api_rate_counters WHERE bucket < now() - INTERVAL '2 days';
    DELETE FROM api_request_log WHERE at < now() - INTERVAL '90 days';
  END IF;

  RETURN QUERY SELECT
    CASE WHEN n_day > c.rate_limit_per_day THEN 'rate_limited_day'
         WHEN n_minute > c.rate_limit_per_minute THEN 'rate_limited_minute'
         ELSE 'ok' END,
    c.id, c.name, c.scopes, c.allowed_ips, c.rate_limit_per_minute, c.rate_limit_per_day,
    n_minute, n_day, b_minute + INTERVAL '1 minute';
END;
$$;
REVOKE ALL ON FUNCTION api_authenticate(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION api_authenticate(TEXT) TO service_role;

-- Uso diario por llave (para la pestaña Integraciones)
CREATE OR REPLACE VIEW api_usage_daily AS
SELECT client_id,
       date_trunc('day', at)::date AS day,
       count(*)                                   AS requests,
       count(*) FILTER (WHERE status >= 400)      AS errors,
       round(avg(duration_ms))::int               AS avg_ms
FROM api_request_log
GROUP BY 1, 2;
REVOKE ALL ON api_usage_daily FROM anon, authenticated;
