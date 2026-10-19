#!/usr/bin/env bash
# Copia de seguridad de Supabase, VERIFICADA. Lo ejecuta .github/workflows/supabase-keepalive.yml.
#
# Entradas (variables de entorno):
#   SUPABASE_DB_URL    cadena del «Session pooler» (puerto 5432). La conexión directa
#                      (db.<ref>.supabase.co) solo tiene IPv6 y los runners de GitHub son IPv4.
#   RESTORE_TEST_URL   (opcional) Postgres vacío donde se RESTAURA la copia para comprobarla.
#   OUT_DIR            carpeta de salida (por defecto ./backup).
#   MIN_DATA_POINTS / MIN_INDICATORS  mínimos esperados: cuidan de una copia "válida" pero casi vacía.
#
# POR QUÉ SE VERIFICA
# Una copia que nadie comprueba puede estar vacía o truncada, y no se sabe hasta el día que hace falta.
# Por eso no basta con que pg_dump termine: se comprueba que el gzip es íntegro, que están las
# definiciones de las tablas que más costaría reconstruir, que vienen los datos (COPY) con al menos
# tantas filas como se espera y, si hay RESTORE_TEST_URL, que la copia se restaura de verdad.
#
# ⚠️ Nunca `gunzip -c x.gz | grep -q`: con pipefail, grep sale al primer acierto, gunzip recibe SIGPIPE
# y el pipeline falla aunque el texto estaba. Se descomprime UNA vez a un archivo y se busca en él.
set -euo pipefail

OUT_DIR="${OUT_DIR:-backup}"
MIN_DATA_POINTS="${MIN_DATA_POINTS:-90000}"   # hoy hay 98,430; solo crece con cada edición del MEM
MIN_INDICATORS="${MIN_INDICATORS:-900}"       # hoy hay 918
# Tablas que más costaría reconstruir: datos con su procedencia, catálogo, ediciones, correcciones
# del MEM, llaves emitidas (solo hash: no se pueden recrear sin reemitirlas) y configuración del MCP.
CRITICAL_TABLES=(data_points indicators indicator_categories entities reports data_point_revisions ingestion_runs api_clients mcp_settings)

summary() { if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then printf '%s\n' "$1" >> "$GITHUB_STEP_SUMMARY"; fi; }
fail() { echo "::error title=Backup de Supabase::$1"; summary "### ❌ Backup: $1"; exit 1; }

[ -n "${SUPABASE_DB_URL:-}" ] || fail "Falta el secret SUPABASE_DB_URL (REPOSITORY secret con la cadena del Session pooler)."
case "$SUPABASE_DB_URL" in
  *db.*.supabase.co*) fail "SUPABASE_DB_URL usa la conexión directa (db.<ref>.supabase.co), que solo tiene IPv6 y falla en GitHub. Usa la del «Session pooler» (…pooler.supabase.com:5432).";;
esac

# El cliente debe ser de la versión mayor del servidor o más nuevo, o pg_dump se niega ("server version mismatch")
server_major="$(psql "$SUPABASE_DB_URL" -X -tA -c 'show server_version_num' | awk '{print int($1/10000)}')" \
  || fail "No se pudo conectar a Postgres con SUPABASE_DB_URL (¿contraseña, proyecto pausado o cadena de otro proyecto?)."
client_major="$(pg_dump --version | grep -oE '[0-9]+' | head -1)"
echo "Servidor Postgres ${server_major} · pg_dump ${client_major}"
[ "$client_major" -ge "$server_major" ] || fail "pg_dump ${client_major} es más viejo que el servidor (${server_major}). Instala postgresql-client-${server_major} del repositorio pgdg."

mkdir -p "$OUT_DIR"
stamp="$(date -u +%Y-%m-%d)"
gz="${OUT_DIR}/supabase-public-${stamp}.sql.gz"
sql="${OUT_DIR}/.verificacion.sql"

pg_dump "$SUPABASE_DB_URL" --schema=public --no-owner --no-privileges | gzip -9 > "$gz"

# 1. El gzip está íntegro
gzip -t "$gz" || fail "El archivo comprimido está dañado."

# 2. Se descomprime una sola vez para inspeccionarlo (ver nota sobre SIGPIPE arriba)
gunzip -c "$gz" > "$sql"
grep -q '^-- PostgreSQL database dump complete' "$sql" || fail "La copia está incompleta: falta la marca final de pg_dump."

# 3. Definiciones de las tablas críticas
for t in "${CRITICAL_TABLES[@]}"; do
  grep -q "^CREATE TABLE public.${t} (" "$sql" || fail "La copia no contiene CREATE TABLE public.${t}."
done

# 4. Los datos: filas entre el COPY y su terminador '\.'
rows_of() {
  awk -v t="$1" '$0 ~ "^COPY public\\." t " " {f=1; next} f && /^\\\.$/ {exit} f {n++} END {print n+0}' "$sql"
}
grep -q '^COPY public.data_points ' "$sql" || fail "La copia no contiene los datos (COPY) de data_points."
dp_rows="$(rows_of data_points)"
ind_rows="$(rows_of indicators)"
echo "Filas en la copia: data_points=${dp_rows}, indicators=${ind_rows}"
[ "$dp_rows" -ge "$MIN_DATA_POINTS" ] || fail "data_points tiene ${dp_rows} filas en la copia (mínimo esperado ${MIN_DATA_POINTS})."
[ "$ind_rows" -ge "$MIN_INDICATORS" ] || fail "indicators tiene ${ind_rows} filas en la copia (mínimo esperado ${MIN_INDICATORS})."

# 5. Restauración de prueba en un Postgres vacío: la única forma de saber que la copia sirve
restored="no probada"
if [ -n "${RESTORE_TEST_URL:-}" ]; then
  # Roles que Supabase trae de fábrica y que las políticas y funciones pueden nombrar
  psql "$RESTORE_TEST_URL" -X -q -v ON_ERROR_STOP=1 -c "
    DO \$\$ BEGIN
      IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon NOLOGIN; END IF;
      IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
      IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'service_role') THEN CREATE ROLE service_role NOLOGIN; END IF;
    END \$\$;"
  # El esquema public ya existe en una base nueva (también en un proyecto nuevo de Supabase)
  grep -v '^CREATE SCHEMA public;$' "$sql" > "${sql}.restore"
  psql "$RESTORE_TEST_URL" -X -q -v ON_ERROR_STOP=1 -f "${sql}.restore" > "${OUT_DIR}/.restore.log" 2>&1 \
    || { tail -20 "${OUT_DIR}/.restore.log"; fail "La copia NO se pudo restaurar en un Postgres vacío (ver el log arriba)."; }
  r_dp="$(psql "$RESTORE_TEST_URL" -X -tA -c 'select count(*) from public.data_points')"
  r_ind="$(psql "$RESTORE_TEST_URL" -X -tA -c 'select count(*) from public.indicators')"
  [ "$r_dp" = "$dp_rows" ] || fail "Restaurada, pero data_points tiene ${r_dp} filas y la copia ${dp_rows}."
  [ "$r_ind" = "$ind_rows" ] || fail "Restaurada, pero indicators tiene ${r_ind} filas y la copia ${ind_rows}."
  restored="sí: ${r_dp} data_points y ${r_ind} indicadores restaurados en un Postgres vacío"
  rm -f "${sql}.restore"
fi

rm -f "$sql"
size="$(du -h "$gz" | cut -f1)"
echo "✅ Copia verificada: ${gz} (${size}). Restauración de prueba: ${restored}."
summary "### ✅ Backup verificado
| | |
|---|---|
| Archivo | \`$(basename "$gz")\` (${size}) |
| Postgres | servidor ${server_major}, pg_dump ${client_major} |
| data_points | ${dp_rows} filas (mínimo ${MIN_DATA_POINTS}) |
| indicators | ${ind_rows} filas (mínimo ${MIN_INDICATORS}) |
| Tablas críticas | ${CRITICAL_TABLES[*]} |
| Restauración de prueba | ${restored} |"
