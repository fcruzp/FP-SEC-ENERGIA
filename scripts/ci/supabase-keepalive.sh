#!/usr/bin/env bash
# Keep-alive de Supabase con centinela de seguridad. Lo ejecuta .github/workflows/supabase-keepalive.yml
# (y se puede correr en local: SUPABASE_URL=… SUPABASE_ANON_KEY=… bash scripts/ci/supabase-keepalive.sh).
#
# POR QUÉ ASÍ
# - Supabase pausa los proyectos gratuitos tras 7 días sin actividad. Una consulta REST que llega a
#   Postgres cuenta como actividad, aunque no devuelva filas.
# - Se usa la CLAVE PÚBLICA (la misma que viaja en el navegador) y solo la cabecera `apikey`: así
#   funciona con la clave anon (JWT) y con las nuevas `sb_publishable_…`, y la prueba ve exactamente lo
#   que vería cualquier visitante.
#
# ⚠️ CENTINELA — LEER ANTES DE CAMBIAR LA TABLA
# La consulta va a `users`: tiene RLS activo y NINGUNA política, y es la tabla más sensible (correo,
# password_hash). Con la clave pública la respuesta correcta es 200 y una lista VACÍA `[]`.
# Si algún día devuelve filas, alguien abrió sus políticas (o desactivó RLS) y esos datos quedaron
# expuestos a cualquiera: la tarea se pone EN ROJO a propósito.
# Si algún día esta tabla se abre A PROPÓSITO, NO borres la comprobación: cambia KEEPALIVE_TABLE y
# KEEPALIVE_COLUMN a otra tabla que siga cerrada (RLS activo, sin políticas de lectura para anon).
# Las tablas del Observatorio (indicators, data_points, reports…) son públicas por diseño: el sitio las
# lee con esta misma clave. Por eso NO sirven para el centinela.
# Mientras `users` esté vacía, abrirla no expone nada y la respuesta seguiría siendo `[]`; el centinela
# empieza a proteger justo cuando hay algo que proteger.
set -euo pipefail

TABLE="${KEEPALIVE_TABLE:-users}"
COLUMN="${KEEPALIVE_COLUMN:-id}"   # debe EXISTIR en la tabla: si no, PostgREST responde 400 todos los días

summary() { if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then printf '%s\n' "$1" >> "$GITHUB_STEP_SUMMARY"; fi; }
fail() {
  echo "::error title=Keep-alive de Supabase::$1"
  summary "### ❌ Keep-alive: $1"
  exit 1
}

if [ -z "${SUPABASE_URL:-}" ] || [ -z "${SUPABASE_ANON_KEY:-}" ]; then
  fail "Faltan los secrets SUPABASE_URL y/o SUPABASE_ANON_KEY. Créalos como REPOSITORY secrets (Settings → Secrets and variables → Actions → Secrets → New repository secret), no como Environment secrets."
fi

base="${SUPABASE_URL%/}"
ref="$(printf '%s' "$base" | sed -E 's#^https?://([^.]+)\..*#\1#')"
panel="https://supabase.com/dashboard/project/${ref}"
url="${base}/rest/v1/${TABLE}?select=${COLUMN}&limit=1"
body="$(mktemp)"

# --retry cubre cortes pasajeros y 5xx (p. ej. el proyecto despertando); un fallo de conexión da 000
code="$(curl -sS -o "$body" -w '%{http_code}' --max-time 30 --retry 2 --retry-delay 15 \
  -H "apikey: ${SUPABASE_ANON_KEY}" "$url" 2>/dev/null)" || code="000"
text="$(tr -d '\r\n' < "$body" | head -c 600)"
echo "GET /rest/v1/${TABLE}?select=${COLUMN}&limit=1 → HTTP ${code}"

case "$code" in
  200)
    compact="$(printf '%s' "$text" | tr -d ' \t')"
    if [ "$compact" = "[]" ]; then
      echo "✅ Supabase respondió y la tabla ${TABLE} sigue cerrada a la clave pública (lista vacía)."
      summary "### ✅ Keep-alive: Supabase activo; \`${TABLE}\` sigue cerrada a la clave pública."
    elif [ "${compact:0:1}" = "[" ]; then
      fail "CENTINELA: la clave pública LEYÓ filas de '${TABLE}'. Sus políticas RLS se abrieron o RLS se desactivó, y esos datos están expuestos a cualquiera. Revísalo en ${panel}/auth/policies . Si se abrió a propósito, apunta KEEPALIVE_TABLE a otra tabla cerrada (no borres esta comprobación)."
    else
      fail "Respuesta 200 inesperada (no es una lista JSON): ${text}"
    fi
    ;;
  000)
    fail "Sin respuesta de ${base} (DNS, red o proyecto pausado/eliminado). Abre ${panel} : si está pausado, pulsa «Restore project». Si la URL es de otro proyecto, corrige el secret SUPABASE_URL."
    ;;
  401|403)
    fail "HTTP ${code}: la clave pública no es válida para este proyecto o la tabla perdió el permiso de lectura. Detalle: ${text} — Compara el secret SUPABASE_ANON_KEY con Project Settings → API Keys en ${panel} (si el detalle dice 42501, alguien hizo REVOKE: GRANT SELECT ON public.${TABLE} TO anon;)."
    ;;
  400)
    fail "HTTP 400: la consulta ya no es válida (¿cambió la columna '${COLUMN}' de '${TABLE}'?). Causa exacta según Supabase: ${text}"
    ;;
  402)
    fail "HTTP 402: Supabase restringió el proyecto por exceder el plan gratuito (uso justo). Revisa el uso en ${panel}/settings/billing . Detalle: ${text}"
    ;;
  404)
    fail "HTTP 404: la tabla '${TABLE}' no existe o SUPABASE_URL apunta a otro proyecto. Detalle: ${text}"
    ;;
  5*)
    fail "HTTP ${code}: Supabase no está disponible (proyecto pausado, restaurándose o con incidente). Abre ${panel} y https://status.supabase.com . Detalle: ${text}"
    ;;
  *)
    fail "HTTP ${code} inesperado. Detalle: ${text}"
    ;;
esac
