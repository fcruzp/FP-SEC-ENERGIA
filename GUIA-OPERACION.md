# Guía de operación — Portal y Observatorio Energético

Enlaces y pasos para mantener el sitio funcionando. Ninguna clave aparece aquí: los valores están en `.env.local` (en tu PC), en los secrets de GitHub y en las variables de Netlify.

---

## 1. GitHub — el repositorio

| Qué | Enlace |
|---|---|
| Repositorio | https://github.com/fcruzp/FP-SEC-ENERGIA |
| Historial de cambios (commits) | https://github.com/fcruzp/FP-SEC-ENERGIA/commits/main |
| Todas las tareas automáticas (Actions) | https://github.com/fcruzp/FP-SEC-ENERGIA/actions |
| Tarea "Supabase keep-alive y backup" | https://github.com/fcruzp/FP-SEC-ENERGIA/actions/workflows/supabase-keepalive.yml |
| Secrets de las tareas (Actions) | https://github.com/fcruzp/FP-SEC-ENERGIA/settings/secrets/actions |
| Entornos (Environments) | https://github.com/fcruzp/FP-SEC-ENERGIA/settings/environments |
| Notificaciones por correo de GitHub | https://github.com/settings/notifications |

### Secrets que necesita la tarea de keep-alive y backup

Van en **Repository secrets** (botón verde "New repository secret"), **no** en "Environment secrets".

| Nombre del secret | Valor (copiarlo de `.env.local`) |
|---|---|
| `SUPABASE_URL` | el valor de `NEXT_PUBLIC_SUPABASE_URL` |
| `SUPABASE_ANON_KEY` | el valor de `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `SUPABASE_DB_URL` | el valor de `SUPABASE_DB_URL` |

---

## 2. Mantener viva la base de datos (keep-alive) y las copias de seguridad

El plan gratuito de Supabase **pausa el proyecto tras 7 días sin actividad**. La tarea automática lo evita.

- **Keep-alive:** todos los días a las 7:17 a. m. hace una consulta pequeña a la base.
- **Backup:** cada lunes, y cada vez que se ejecuta a mano, guarda una copia completa de la base (`backup-AAAA-MM-DD.sql.gz`). Los demás días el trabajo "backup" aparece en verde en 2 segundos porque no hace nada; es normal.

**Ejecutarla a mano** (por ejemplo, para comprobar que funciona o sacar una copia ahora):
1. Abre la [tarea "Supabase keep-alive y backup"](https://github.com/fcruzp/FP-SEC-ENERGIA/actions/workflows/supabase-keepalive.yml).
2. Botón **"Run workflow"** (a la derecha) → **Run workflow**.
3. No uses "Re-run jobs" sobre una ejecución vieja: repite la versión antigua de la tarea.

**Descargar una copia de seguridad:**
1. En la misma página, abre una ejecución de un lunes o una manual.
2. Abajo, en **Artifacts**, haz clic en `supabase-backup-…`.
3. Cada copia se conserva **90 días**.

**Si la tarea falla** (te llega un correo de GitHub):
1. Abre la ejecución fallida → haz clic en el trabajo con la ✗ (por ejemplo, "keepalive") → abre el paso con la ✗.
2. El registro dice qué pasó: si falta un secret lo nombra; si Supabase rechaza la clave muestra el código HTTP.

> Si el repositorio es **público**, cualquier usuario de GitHub puede descargar las copias. Hoy no es un problema (los datos del Observatorio son públicos), pero antes de guardar datos personales en la base hay que hacer el repositorio privado o cifrar la copia.

---

## 3. Supabase — la base de datos

| Qué | Enlace |
|---|---|
| Panel del proyecto | https://supabase.com/dashboard/project/ehkbefrcfbnwuusnuhpz |
| Claves de la API (URL, publishable, secret) | https://supabase.com/dashboard/project/ehkbefrcfbnwuusnuhpz/settings/api-keys |
| Editor de tablas | https://supabase.com/dashboard/project/ehkbefrcfbnwuusnuhpz/editor |
| Editor SQL | https://supabase.com/dashboard/project/ehkbefrcfbnwuusnuhpz/sql |
| Cadena de conexión (`SUPABASE_DB_URL`) | En el panel, botón **Connect** (arriba) → pestaña **Direct** → **Session pooler** |

---

## 4. Netlify — el sitio publicado

| Qué | Enlace |
|---|---|
| Sitio publicado | https://energia-fp.netlify.app |
| Panel de Netlify | https://app.netlify.com |

En el panel de Netlify, dentro del sitio:
- **Site configuration → Environment variables**: deben estar `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL`, `ADMIN_USER` y `ADMIN_PASSWORD` (los mismos valores de `.env.local`).
- **Deploys → Trigger deploy → Clear cache and deploy site**: vuelve a publicar después de cambiar variables.

---

## 5. Cargar una edición nueva del Informe de Desempeño (MEM)

El MEM publica cada edición unos **dos meses después del cierre del mes** (julio 2026 salió el 22 de septiembre).

| Qué | Enlace |
|---|---|
| Página de los informes en el MEM | https://mem.gob.do/category/sector-electrico/informe-de-desempeno/ |
| Lista de archivos más recientes (técnica) | https://mem.gob.do/wp-json/wp/v2/media?search=Desempeno&per_page=10&orderby=date&order=desc |

**Desde el panel (recomendado):**
1. Descarga el Excel de anexos del mes, **sin cambiarle el nombre**.
2. Entra a `/admin` del sitio (pide usuario y contraseña) → pestaña **"Cargar"**.
3. Elige el archivo, pega los enlaces oficiales del Excel y del PDF y la fecha de publicación.
4. **1. Validar** → revisa el informe → **2. Cargar en el Observatorio**.

Si la validación dice que la estructura del Excel cambió, el MEM modificó filas o etiquetas: hay que revisar el catálogo antes de cargar (se hace con el script, ver abajo).

**Desde la PC (script):**

```bash
bun scripts/mem-load.ts --file "data/mem/<archivo>.xlsx" --source-url "<enlace del Excel>" --pdf-url "<enlace del PDF>" --published AAAA-MM-DD
```

Agrega `--dry-run` para solo verificar sin escribir nada.

---

## 6. Páginas del sitio

| Página | Dirección | ¿Pide clave? |
|---|---|---|
| Portal | `/` | No |
| Observatorio | `/observatorio` | No |
| Metodología | `/observatorio/metodologia` | No |
| Correcciones del MEM | `/observatorio/correcciones` | No |
| Foro (vista previa) | `/foro` | No |
| Panel de administración | `/admin` | Sí (`ADMIN_USER` / `ADMIN_PASSWORD`) |

En tu PC, con el servidor de desarrollo encendido, todas están en `http://localhost:3000`.

---

## 7. Documentos del proyecto

| Documento | Para qué |
|---|---|
| [PLAN-PROFESIONALIZACION.md](PLAN-PROFESIONALIZACION.md) | Plan por fases y avance |
| [data/mem/verificacion-julio-2026.md](data/mem/verificacion-julio-2026.md) | Cómo se verificaron los datos (cotejo con el PDF, correcciones del MEM, anomalías) |
| [data/mem/anomalias-conocidas.json](data/mem/anomalias-conocidas.json) | Errores detectados en los Excel del MEM |
