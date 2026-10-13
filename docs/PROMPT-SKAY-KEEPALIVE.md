# Prompt: mantener viva la base de Supabase de Skay (keep-alive + backup)

Copiar todo lo que está dentro del bloque y pegarlo en una sesión de Claude Code abierta en el proyecto de Skay. Es la misma solución que funciona en FP-ENERGIA desde el 11-oct-2026.

````text
Quiero proteger la base de datos de Supabase de Skay igual que hice en otro proyecto mío (FP-ENERGIA): una tarea de GitHub Actions que (1) la mantenga activa todos los días para que Supabase no la pause, y (2) guarde una copia de seguridad semanal. En el otro proyecto perdí una cuenta/proyecto de Supabase completo y tuve que reconstruir la base; no quiero que vuelva a pasar.

## Por qué

- En el plan gratuito, Supabase PAUSA un proyecto tras 7 días sin actividad, y un proyecto pausado mucho tiempo puede llegar a no poder restaurarse.
- Sin backups propios, si se pierde el acceso a la cuenta o el proyecto, se pierden los datos.

## Referencia que funciona (FP-ENERGIA)

El archivo está en esta misma PC: C:\PROJECTS\CLAUDE\FP-ENERGIA\.github\workflows\supabase-keepalive.yml — léelo y úsalo como base. Resumen:
- Se ejecuta diario (cron '17 11 * * *' = 07:17 hora de RD) y también a mano (workflow_dispatch).
- Trabajo "keepalive": un curl a la API REST de Supabase, `GET $SUPABASE_URL/rest/v1/<tabla>?select=id&limit=1` con SOLO la cabecera `apikey: $SUPABASE_ANON_KEY` (así funciona tanto con claves anon tipo JWT como con las nuevas `sb_publishable_...`). Falla con un mensaje claro (`::error::`) si faltan los secrets o si la respuesta no es 200.
- Trabajo "backup": solo los lunes (o al ejecutarlo a mano). Instala el cliente de Postgres 17 desde apt.postgresql.org (el pg_dump debe ser de la misma versión mayor que el servidor, o más nuevo), hace `pg_dump "$SUPABASE_DB_URL" --schema=public --no-owner --no-privileges | gzip > backup-AAAA-MM-DD.sql.gz` y lo sube como artefacto con `actions/upload-artifact@v4`, retención 90 días.
- Secrets de GitHub: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_DB_URL (cadena de conexión Postgres del "Session pooler").

## Lo que quiero que hagas

1. Revisa el proyecto Skay: confirma que usa Supabase, cuántos proyectos de Supabase usa (si hay más de uno, cada uno necesita su keep-alive), cuál es su URL/ref (sin mostrarme claves) y si ya existe algún workflow de GitHub Actions o keep-alive. Revisa también el remoto de git (owner/repo) para darme los enlaces exactos.
2. Elige para la consulta del keep-alive una tabla REAL de Skay que la clave pública (anon/publishable) pueda leer según sus políticas RLS. Verifícalo con una llamada real usando la URL y la clave pública de las variables de entorno locales (sin imprimir la clave) y comprueba que responde 200. Si ninguna tabla es legible con la clave pública, propónme la alternativa más segura (por ejemplo, una función RPC mínima de solo lectura, o hacer el keep-alive con la conexión Postgres `SELECT 1` usando el secret SUPABASE_DB_URL) y explícame el trade-off antes de hacerlo.
3. Revisa la versión de Postgres del servidor de Skay (`SHOW server_version` con la conexión de .env, si existe) y usa el cliente de pg_dump de esa versión mayor o superior.
4. Si Skay usa otros esquemas además de `public` con datos propios (por ejemplo `storage` con metadatos, o esquemas personalizados), dime cuáles y pregúntame si los incluimos. Ojo: los ARCHIVOS de Supabase Storage no van en pg_dump; si Skay guarda archivos importantes allí, avísame y propón cómo respaldarlos.
5. Crea `.github/workflows/supabase-keepalive.yml` adaptado a Skay, con comentarios en español, mensajes de error claros y sin ningún secreto en el archivo.
6. Dame instrucciones paso a paso, con enlaces exactos del repositorio de Skay, para crear los 3 secrets. IMPORTANTE (errores que ya cometí en el otro proyecto):
   - Deben ser **Repository secrets**: Settings → Secrets and variables → Actions → pestaña "Secrets" → "New repository secret". NO "Environment secrets" (con esos el workflow no los ve y falla).
   - Para probar, usar **Actions → la tarea → "Run workflow"**. NO "Re-run jobs" de una ejecución vieja, porque re-ejecuta el commit viejo.
   - Dónde encontrar cada valor en Supabase: URL y clave pública en Project Settings → API (o Data API / API Keys); la cadena de conexión en el botón "Connect" → "Session pooler" (reemplazando [YOUR-PASSWORD] por la contraseña de la base).
   - No me pidas que pegue las claves en el chat.
7. Si el repositorio de Skay es PÚBLICO, adviérteme: los artefactos de Actions (los backups) se pueden descargar por cualquiera que tenga acceso al repo; recomiéndame si conviene hacerlo privado o cifrar el backup (p. ej. con `gpg --symmetric` y un secret BACKUP_PASSPHRASE).
8. Documenta en el README de Skay (o en una guía de operación) los enlaces: la tarea en Actions, la página de secrets, el panel de Supabase del proyecto, cómo descargar un backup (Actions → ejecución de un lunes → Artifacts) y cómo restaurarlo (`gunzip -c backup.sql.gz | psql "<cadena de conexión>"` en una base vacía).
9. Muéstrame el resumen de cambios y espera mi confirmación antes de hacer commit y push. Cuando esté subido y yo haya creado los secrets, guíame para ejecutarlo a mano y revisar que los dos trabajos quedan en verde (y que el backup aparece en Artifacts).
````
