# Respaldo de Supabase: secrets, descarga y restauración

La tarea [**Supabase keep-alive y backup**](https://github.com/fcruzp/FP-SEC-ENERGIA/actions/workflows/supabase-keepalive.yml) ([código](../.github/workflows/supabase-keepalive.yml)) hace dos cosas:

| Trabajo | Cuándo (hora de RD) | Qué hace |
|---|---|---|
| **keepalive** | Todos los días, 07:17 | Una consulta liviana con la clave pública, que además es un **centinela**: si la tabla cerrada `users` devuelve filas, la tarea se pone en rojo porque alguien abrió sus políticas. Después escribe un **latido** real en Postgres (tabla `keepalive_heartbeat`), porque Supabase avisó de una pausa aunque la consulta respondía bien todos los días. |
| **backup** | Los lunes, 07:47 | `pg_dump` del esquema `public`, comprimido, **verificado** (gzip íntegro, tablas críticas, filas de datos) y **restaurado de prueba** en un Postgres vacío. Se guarda 90 días como artefacto. |

Los cron de GitHub van en UTC; RD es UTC−4 todo el año. Para correrla a mano: abre la tarea → **Run workflow** → **Run workflow**. No uses "Re-run jobs" de una ejecución vieja, porque re-ejecuta el commit viejo.

---

## 1. Los secrets: de dónde sale cada uno

Se crean en https://github.com/fcruzp/FP-SEC-ENERGIA/settings/secrets/actions → pestaña **Secrets** → **New repository secret**.

Tienen que ser **Repository secrets**. Los *Environment secrets* no los ve esta tarea y falla con "Faltan los secrets".

| Secret | Valor | Dónde está en Supabase |
|---|---|---|
| `SUPABASE_URL` | `https://<ref>.supabase.co` (hoy `https://ehkbefrcfbnwuusnuhpz.supabase.co`) | Project Settings → **Data API** (o API) → Project URL |
| `SUPABASE_ANON_KEY` | La clave **pública**: `anon` (empieza por `eyJ…`) o `sb_publishable_…` | Project Settings → **API Keys** |
| `SUPABASE_DB_URL` | `postgresql://postgres.<ref>:<contraseña>@aws-…pooler.supabase.com:5432/postgres` | Botón **Connect** (arriba) → **Session pooler** → copia la URI y reemplaza `[YOUR-PASSWORD]` por la contraseña de la base |

Sobre `SUPABASE_DB_URL`:
- Usa la cadena del **Session pooler (puerto 5432)**. La "Direct connection" (`db.<ref>.supabase.co`) solo tiene IPv6 y falla en GitHub; el script lo detecta y lo dice.
- Si no recuerdas la contraseña de la base, restablécela en Project Settings → **Database** → Reset database password. Después actualiza también `.env.local` y Netlify.

**Nunca uses la clave `service_role` / `sb_secret_…` en `SUPABASE_ANON_KEY`.** Esa clave salta el RLS: el centinela vería filas y, además, la clave quedaría expuesta.

---

## 2. Si la tarea se pone en rojo

Abre la ejecución fallida → el trabajo con ✗ → el paso con ✗. El mensaje dice qué pasó y qué hacer:

| Mensaje | Qué significa |
|---|---|
| **CENTINELA: la clave pública LEYÓ filas de 'users'** | Alguien abrió las políticas RLS de `users` o desactivó RLS. Esos datos quedaron públicos. Revisa *Authentication → Policies* en Supabase. Si se abrió a propósito, cambia `KEEPALIVE_TABLE` en el script a otra tabla cerrada; **no borres la comprobación**. |
| HTTP 000 / 5xx | Proyecto pausado o caído. Entra al panel de Supabase y pulsa **Restore project**. |
| HTTP 401/403 | La clave pública del secret no corresponde al proyecto, o la tabla perdió el permiso de lectura. |
| HTTP 400 | La consulta ya no vale: cambió la columna. El mensaje incluye la causa exacta. |
| HTTP 402 | Supabase restringió el proyecto por exceder el plan gratuito. |
| HTTP 404 | La tabla no existe o la URL es de otro proyecto. |
| Backup: "no contiene…", "filas…", "NO se pudo restaurar" | La copia salió mal y **no se guardó como buena**. Lee el detalle y vuelve a correr la tarea. |

---

## 3. Descargar una copia

1. Abre https://github.com/fcruzp/FP-SEC-ENERGIA/actions/workflows/supabase-keepalive.yml.
2. Entra a una ejecución de un **lunes** o a una manual, que tenga el trabajo **backup** en verde.
3. Abajo, en **Artifacts**, descarga `supabase-backup-<número>`. Es un `.zip`.
4. Descomprímelo. Dentro está `supabase-public-AAAA-MM-DD.sql.gz`.

Las copias se borran solas a los 90 días. Si quieres conservar una más tiempo, descárgala y guárdala aparte, por ejemplo en Google Drive.

> El repositorio es público: cualquiera con cuenta de GitHub puede descargar estos artefactos. Hoy los datos son públicos y las llaves de la API están guardadas solo como hash. Si algún día la base guarda datos personales, conviene hacer el repositorio privado o cifrar la copia.

---

## 4. Restaurar la copia en una base nueva (el peor día)

Probado: cada lunes la tarea hace exactamente esto contra un Postgres vacío y compara las filas.

### 4.1 Crear el proyecto

1. En https://supabase.com/dashboard crea un proyecto nuevo, en una región cercana (por ejemplo `us-east-1`). Anota la contraseña de la base.
2. Su versión de Postgres debe ser **igual o más nueva** que la de la copia (hoy 17). Se ve en Project Settings → Infrastructure.
3. En **Connect** → **Session pooler**, copia la cadena de conexión (puerto 5432) con la contraseña.

### 4.2 Restaurar los datos

Necesitas `psql` versión 17 o más nueva. En Windows hay dos formas:

**Con Docker** (no instala nada). Desde la carpeta donde está el `.sql.gz`:

```bash
docker run --rm -it -v "%cd%":/b postgres:17 bash -c "gunzip -c /b/supabase-public-AAAA-MM-DD.sql.gz | grep -v '^CREATE SCHEMA public;$' > /tmp/r.sql && psql 'CADENA_DEL_SESSION_POOLER' -v ON_ERROR_STOP=1 -f /tmp/r.sql"
```

**Con psql instalado.** Instálalo con el instalador de https://www.postgresql.org/download/windows/ eligiendo solo *Command Line Tools*. Luego, en Git Bash:

```bash
gunzip -c supabase-public-AAAA-MM-DD.sql.gz | grep -v '^CREATE SCHEMA public;$' > restaurar.sql
```

```bash
psql "CADENA_DEL_SESSION_POOLER" -v ON_ERROR_STOP=1 -f restaurar.sql
```

La línea `CREATE SCHEMA public` se quita porque el esquema ya existe en cualquier base nueva. `ON_ERROR_STOP` detiene la restauración en el primer error, en vez de dejarla a medias sin avisar.

### 4.3 Volver a aplicar los permisos

La copia se hace con `--no-privileges`, así que **no trae los permisos**. En un proyecto nuevo, Supabase da por defecto permisos de lectura a la clave pública sobre todas las tablas. Las tablas privadas, como las de llaves o el MCP, siguen protegidas por RLS, pero hay que volver a cerrarlas del todo.

Desde la carpeta del repositorio:

```bash
psql "CADENA_DEL_SESSION_POOLER" -v ON_ERROR_STOP=1 -f download/005_procedencia_y_ediciones.sql -f download/007_api_integracion.sql -f download/008_mcp.sql -f download/009_keepalive_heartbeat.sql
```

Estas migraciones se pueden repetir sin dañar datos: rehacen `REVOKE`, `GRANT` y funciones y no tocan los datos cargados.

### 4.4 Apuntar todo al proyecto nuevo

1. **`.env.local`** en tu PC: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` y `SUPABASE_DB_URL` del proyecto nuevo.
2. **Netlify**: las mismas variables, en Site configuration → Environment variables. Después, Deploys → Trigger deploy.
3. **GitHub**: los tres secrets de la sección 1.
4. Corre esta tarea a mano y comprueba que los dos trabajos quedan en verde.
5. Abre el sitio y el Observatorio.

### 4.5 Qué NO está en la copia

- **Usuarios de Supabase Auth** (esquema `auth`). Hoy no se usan.
- **Archivos de Supabase Storage.** Hoy no se usan.
- **La configuración del proyecto:** proveedores de inicio de sesión, URL del sitio y llaves de la API de Supabase. Se reconfigura a mano.
- **Las llaves de la API del Observatorio sí están, pero solo como hash.** Siguen funcionando después de restaurar, porque se comparan contra el hash, no hay que reemitirlas.
