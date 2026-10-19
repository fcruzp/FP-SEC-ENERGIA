#!/usr/bin/env bash
# Latido diario: una ESCRITURA real en Postgres para que Supabase no pause el proyecto.
# Lo ejecuta .github/workflows/supabase-keepalive.yml después de la consulta REST.
#
# POR QUÉ ADEMÁS DE LA CONSULTA REST
# Supabase pausa por "poca actividad de base de datos" en 7 días y no define exactamente qué cuenta.
# En octubre de 2026 llegó un aviso de pausa aunque la consulta REST diaria respondía 200 todos los
# días: una lectura con resultado vacío por la API puede no contarse. Una transacción que escribe
# (UPDATE de una fila) es actividad de base de datos sin ambigüedad.
# Tabla: keepalive_heartbeat (migración download/009_keepalive_heartbeat.sql), cerrada a la clave pública.
set -euo pipefail

summary() { if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then printf '%s\n' "$1" >> "$GITHUB_STEP_SUMMARY"; fi; }
fail() { echo "::error title=Latido de Supabase::$1"; summary "### ❌ Latido: $1"; exit 1; }

[ -n "${SUPABASE_DB_URL:-}" ] || fail "Falta el secret SUPABASE_DB_URL (REPOSITORY secret con la cadena del Session pooler)."
case "$SUPABASE_DB_URL" in
  *db.*.supabase.co*) fail "SUPABASE_DB_URL usa la conexión directa (solo IPv6, falla en GitHub). Usa la del «Session pooler» (…pooler.supabase.com:5432).";;
esac
command -v psql > /dev/null || fail "No hay psql en el runner."

out="$(psql "$SUPABASE_DB_URL" -X -q -tA -v ON_ERROR_STOP=1 -c "
  INSERT INTO keepalive_heartbeat (id, last_beat, beats, source) VALUES (1, now(), 1, 'github-actions')
  ON CONFLICT (id) DO UPDATE SET last_beat = now(), beats = keepalive_heartbeat.beats + 1, source = EXCLUDED.source
  RETURNING beats || ' latidos; último ' || to_char(last_beat AT TIME ZONE 'America/Santo_Domingo', 'YYYY-MM-DD HH24:MI') || ' (RD)';" 2>&1)" \
  || {
    case "$out" in
      *keepalive_heartbeat*does\ not\ exist*) fail "Falta la tabla keepalive_heartbeat: aplica download/009_keepalive_heartbeat.sql.";;
      *password\ authentication\ failed*) fail "La contraseña de SUPABASE_DB_URL no es válida (¿se restableció la contraseña de la base?).";;
      *) fail "No se pudo escribir el latido: ${out}";;
    esac
  }
echo "✅ Latido escrito en Postgres: ${out}"
summary "### ✅ Latido escrito en Postgres: ${out}"
