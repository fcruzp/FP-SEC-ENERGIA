# Plan de profesionalización — Portal Secretaría de Energía FP + Observatorio Energético

*Creado el 4 de octubre de 2026 a partir de 5 auditorías (frontend, backend/seguridad, exactitud de datos, fuentes externas, historia del proyecto). Última actualización: 11 de octubre de 2026.*

---

## 0. Estado actual (11-oct-2026)

| Fase | Estado | Resumen |
|---|---|---|
| 0 · Contención | ✅ Completa | `/admin` protegido, fechas y porcentajes correctos, fuente MEM citada, portada con datos reales, keep-alive y backup funcionando. El contenido de relleno del portal se mantiene **a propósito** como mockup para la presentación. |
| 1 · Exactitud de datos | ✅ Completa | Las 11 hojas del informe del MEM, ediciones marzo→julio 2026: 918 indicadores, 98,430 valores, 147 correcciones del MEM registradas, 14/14 cifras del PDF verificadas, 35 pruebas. Carga desde `/admin` o script en ~4–6 s. |
| 2 · API sólida | 🟡 Parcial | Hecho: vista `indicator_stats` (sin tope de filas), conteo honesto, panel de carga. Falta: caché, validación con zod, actualizar `xlsx`. |
| 3 · Observatorio profesional | ✅ Completa | Ficha técnica, metodología, correcciones públicas, CSV, calendario, SEO, accesibilidad. Falta solo la API de datos abiertos (opcional). |
| 4 · Automatización y nuevas fuentes | ⬜ Pendiente | Detector de ediciones nuevas del MEM, Organismo Coordinador, BCRD, MICM, SIE, Hacienda. |
| 5 · Portal institucional | 🟡 Parcial | Teaser con datos reales hecho. Falta: gestor de contenido (§5), contenido real, suscripción, video ligero. |
| 6 · Ingeniería y operación | 🟡 Parcial | Hecho: tipos verificados en el build, pruebas, keep-alive/backup, guía de operación. Falta: limpieza del scaffold, lint en el build, CI, despliegue en Netlify. |
| IA (§6) | ⬜ Pendiente | OpenRouter con `openai/gpt-6-luna`. |
| 7 · API de integración | 🟡 Casi completa | API `/api/v1` de solo lectura (9 endpoints) con llaves por aplicación (hash, permisos, vencimiento, límite de uso, auditoría), Swagger UI en `/desarrolladores` y pestaña "Integraciones" en `/admin`. Falta: llave de Skay y prueba de punta a punta. Plan: [PLAN-API-INTEGRACION.md](PLAN-API-INTEGRACION.md) · guía: [docs/api/README.md](docs/api/README.md). |

### Pendientes que dependen de Francisco

- [x] **Netlify** (desplegado por Francisco, 12-oct-2026): configurar las variables `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL`, `ADMIN_USER`, `ADMIN_PASSWORD` y redesplegar (ver [GUIA-OPERACION.md](GUIA-OPERACION.md)). Sin esto el sitio publicado apunta a la base antigua.
- [ ] Biografía real de **Juan Gómez** (la actual no está verificada). Los otros tres miembros del equipo son de ejemplo.
- [ ] Contenido real de noticias, documentos y eventos (o seguir con mockup hasta el gestor de contenido).
- [ ] `OPENROUTER_API_KEY` cuando se haga el análisis con IA.
- [ ] Decidir si el repositorio de GitHub debe ser **privado** (los backups son descargables si es público; hoy los datos son públicos, pero no lo serán cuando haya usuarios o suscriptores).
- [x] Secrets de GitHub del keep-alive (funcionando desde el 11-oct-2026).

### Pendientes técnicos conocidos

- Confirmar con el MEM o el OC la **unidad del costo marginal de potencia** (el Excel dice cUS$/kW-mes; los valores corresponden a US$/kW-mes). Hoy se muestra la unidad publicada con una nota.
- En Netlify, comprobar que la carga desde `/admin` termina dentro del límite de tiempo de las funciones (≈6 s medidos desde la PC; límite de 10 s en el plan gratuito, 26 s ampliable). Si no, cargar con el script.
- Panel `/admin`: las pestañas "Indicadores" y "Datos" son casi solo de lectura; "datos recientes" ordena por fecha de carga (muestra 2009 primero).
- Código obsoleto por retirar: `scripts/full-load.cjs`, `scripts/insert-*.js/ts`, `scripts/load-sheet.mjs`, `scripts/full-data-load.mjs`, `scripts/dry-run.cjs`, `scripts/match-report.cjs`, `scripts/generate-sql-seed.ts`, `scripts/seed-xls-data.ts`, `src/lib/parse-xls.ts` y la ruta `/api/admin/parse-xls` (desactivada, responde 410), `download/003_*.sql` y los JSON de extracción (usan identificadores de la base antigua).
- La categoría "Régimen Tarifario Anterior" quedó vacía (las tarifas 2013–2019 ahora están dentro de "Régimen Tarifario"); se puede borrar.
- El historial de git contiene un `.env` antiguo con claves del **proyecto de Supabase anterior** (perdido). No afecta al proyecto actual, pero conviene saberlo si el repositorio es público.

---

## 1. Diagnóstico inicial (4-oct-2026, ya resuelto en su mayoría)

**Lo que está bien**
- Los **números individuales son fieles al Excel**: 48/48 valores muestreados idénticos; los totales de Q1-2026 cuadran con el PDF del MEM (compra EDEs 4,479.6 GWh, pérdidas 38.7 %, CRI 59.3 %, etc.).
- Arquitectura razonable (Next.js + Supabase), RLS correcto para lectura pública, la service-role key no llega al navegador.
- El diseño visual del Observatorio es sólido y responsive.

**Lo que hoy impide decir que el Observatorio es exacto**

| # | Problema | Impacto |
|---|---|---|
| 1 | **8 % de los datos (4,799 puntos) están guardados bajo el indicador o la empresa equivocada.** Ej.: el precio medio de venta de las EDEs aparece como si fuera de EGEHID; gastos de personal de ETED/EGEHID/EGPC guardados como CDEEE. Causa: el parser empareja por nombre con heurísticas y un mapa manual con 8 claves duplicadas. | Gráficos con series mezcladas (ej. "Factura venta EGEHID" Q1 suma 505 en vez de 41.5). |
| 2 | **Fechas corridas un mes en pantalla** (marzo 2026 se ve como "feb 2026") por zona horaria. Los datos en la BD están bien. | Todo el Observatorio muestra el mes equivocado. |
| 3 | **El dashboard trunca a 1,000 filas** (límite de Supabase): 52 de 145 indicadores salen sin último valor; sparklines con 4 puntos en vez de 12. | KPIs y "Tendencias" calculados sobre datos parciales. |
| 4 | **Porcentajes mostrados como fracción** ("0,39 %" en vez de "38,7 %"). Carbón US$/Ton guardado como US$/MMBTU. | Valores visibles incorrectos. |
| 5 | **No se cargan 5 hojas** (Anexo Res. Financieros, Anexo Deuda, ambos regímenes tarifarios) ni ~7,900 celdas de las hojas cargadas. 210 de 487 indicadores vacíos. | Cobertura ~57 %. |
| 6 | **Datos atrasados 4 meses**: el MEM ya publicó hasta **julio 2026**; tenemos marzo. | Desactualizado. |
| 7 | **`/admin` no tiene contraseña.** Cualquiera puede subir un Excel y escribir en la base. | Riesgo de que alguien publique datos falsos con el nombre del partido. |
| 8 | **Cifras inventadas en la portada** ("40 % pérdidas", "4,200 MW", "Monitoreo en tiempo real"), equipo directivo de relleno con foto enlazada de otro sitio, noticias/eventos/documentos ficticios, fuente citada como "MIM.gob.do" y como "datos de la Secretaría de Energía FP". | Riesgo reputacional; contradice el propósito de un observatorio. |
| 9 | Sin keep-alive ni backups de Supabase; sin tests ni CI; restos del generador de código (Z.ai) por todo el repo. | Fragilidad operativa. |

> Nota: los **costos marginales de energía y potencia sí quedaron cargados** con el parser v5 (filas 44–45 de Variables Relevantes). Lo pendiente es **confirmar la unidad de potencia** (el Excel dice cUSD/kW-mes, pero los valores 7.7–10.5 sugieren US$/kW-mes) y, a futuro, traer la serie fina desde el Organismo Coordinador.

---

## 2. Principios rectores

1. **Ningún número sin fuente.** Cada valor visible enlaza a la edición del informe (archivo, hoja, celda) de donde salió.
2. **La carga falla antes que equivocarse.** Mapeo explícito y verificado; si una etiqueta del Excel no coincide con lo esperado, la carga se detiene.
3. **Conciliación automática.** Después de cada carga se verifica contra los totales que trae el propio Excel y el PDF.
4. **Distinguir dato oficial de cálculo propio** del Observatorio.
5. **Versionar cada edición** del MEM: si el MEM revisa un valor pasado, se registra y se muestra.

---

## 3. Plan por fases

### Fase 0 — Contención (1–2 días)
Objetivo: que lo publicado no sea incorrecto ni vulnerable.

- [x] Proteger `/admin` y `/api/admin/*` (login con Supabase Auth + rol admin; mínimo inmediato: Basic Auth por middleware).
- [x] Corregir fechas: una única función de fechas en UTC usada por gráficos, tablas y filtros.
- [x] Mostrar porcentajes correctamente (×100) y quitar la unidad duplicada en títulos.
- [x] Atribución correcta: "Fuente: Ministerio de Energía y Minas (MEM) — Informe de Desempeño de las Empresas Eléctricas Estatales, edición marzo 2026", con enlace a mem.gob.do.
- [x] Portada: cifras fijas reemplazadas por datos reales del MEM; retirado "Monitoreo en tiempo real".
- [—] Portada: equipo/eventos/documentos de relleno. **Decisión (4-oct): se mantienen visibles como mockup** para la presentación; se reemplazan con el gestor de contenido.
- [x] GitHub Action: keep-alive diario + `pg_dump` semanal (backup).
- [x] Commit de lo hecho hasta hoy (setup-db, prerequisito users).

### Fase 1 — Exactitud de datos (núcleo, 1–2 semanas)
Objetivo: 100 % de los datos en el indicador y la empresa correctos, verificables.

- [x] **Parser único nuevo** (TypeScript, compartido por CLI y panel admin) con **mapa explícito y versionado**: `(hoja, fila, etiqueta esperada) → (indicador, empresa, unidad, escala)`. Se elimina el emparejamiento por nombre y los ~10 scripts viejos.
- [x] Fechas leídas desde el número serial de Excel; columnas anuales/acumuladas tratadas como `yearly`/`ytd` o excluidas; ningún "deduplicado silencioso".
- [x] **Conciliación automática** tras cada carga: suma ene–dic = "Acumulado Año"; ene–mar = columna C; EDEs individuales suman el consolidado; fórmulas del glosario (CRI, pérdidas, precio medio) se cumplen; totales clave = PDF.
- [x] **Procedencia**: tabla `reports` (una fila por edición), `report_id` en cada dato, tabla `ingestion_runs` con cobertura, y registro de revisiones cuando el MEM cambia un valor pasado.
- [x] **Catálogo limpio**: unidades normalizadas (tabla de unidades), restricción empresa-del-dato = empresa-del-indicador, nombres no ambiguos, porcentajes con convención única.
- [x] Anexo de resultados financieros (plantillas explícitas y conciliación contable).
- [x] Hojas de **deuda con generadoras** (deuda corriente, pagos, balance pendiente) y **tarifas** (serie continua 2013–2026, aplicada y de referencia por EDE).
- [x] Ediciones intermedias (mar–jun 2026) para el historial de revisiones.
- [x] Pruebas automáticas del parser (bun test).
- [x] Recargar desde cero y **ponerse al día**: ediciones abril–julio 2026 (y ediciones anteriores para detectar revisiones históricas).
- [x] Tests de regresión del parser contra el Excel real (`tests/mem-parser.test.ts`: cifras del PDF, estructura, variantes de formato, deuda, tarifas).

### Fase 2 — API sólida y rápida (3–5 días)
- [x] Vistas/funciones SQL para último valor, valor anterior y últimos 12 meses (sin tope de 1,000 filas).
- [x] Conteo honesto de indicadores (solo los que tienen datos) y páginas para los desgloses por empresa.
- [ ] Caché: los datos cambian una vez al mes; revalidar al cargar una edición nueva.
- [ ] Validación de parámetros (zod), actualizar `xlsx` (vulnerabilidades conocidas), límite de tamaño de archivo.
- [x] Panel admin: pestaña "Cargar edición del MEM" con validación previa y carga usando el mismo parser y la misma escritura que el script (requiere `SUPABASE_DB_URL` en el servidor).

### Fase 3 — Un observatorio de nivel profesional (2–3 semanas)
Inspirado en Our World in Data, Ember, Energía Abierta (Chile) y ESIOS (España).

- [x] **Ficha por indicador**: definición, fórmula, unidad, fuente exacta, frecuencia, última actualización, notas.
- [x] **Página de metodología**: glosario del MEM (CRI, pérdidas, P.P., equivalencias), enfoque devengado vs. caja, diferencias entre fuentes.
- [x] **Cita al pie de cada gráfico** + botón **Descargar CSV** (con celda de origen) + enlace al Excel y PDF originales del MEM.
- [x] **Calendario de actualización** y fecha de datos visible ("Datos a: julio 2026 · publicado por el MEM el 22-sep-2026").
- [x] **Registro público de correcciones** (changelog).
- [x] "Tendencias" con comparación **interanual** y umbral mínimo (eliminar +519 % sobre bases casi cero); marcar anomalías de la fuente.
- [x] Metadatos por indicador y categoría (SEO, compartir en redes), `sitemap.xml` y `robots.txt`.
- [x] Accesibilidad de gráficos (tabla alternativa, textos descriptivos).
- [ ] Opcional posterior: datos abiertos / API pública con licencia.

### Fase 4 — Automatización y nuevas fuentes (2–3 semanas)
- [ ] **Detector de ediciones nuevas del MEM** vía la API de WordPress de mem.gob.do (`/wp-json/wp/v2/media?search=Desempeno`), descarga, carga en "borrador", conciliación y **aprobación humana** antes de publicar.
- [ ] **Organismo Coordinador (OC)**: costos marginales de energía (diarios) y potencia (IMTE mensual), demanda máxima, operación real — API pública de apps.oc.org.do.
- [ ] **Banco Central** (tasa de cambio), **MICM** (precios semanales de combustibles), **SIE** (tarifas), **Hacienda** (subsidio eléctrico).
- [ ] **Contraste externo** con Ember / OLADE para detectar discrepancias.

### Fase 5 — Portal institucional (en paralelo, depende de contenido)
- [x] Teaser del Observatorio en portada alimentado con datos reales (`/api/observatorio/headline`).
- [ ] **Gestor de contenido** (pestaña "Contenido" en `/admin`, ver §5).
- [ ] Equipo, noticias, documentos y eventos reales (necesita material de la Secretaría).
- [ ] Formulario de suscripción funcional.
- [ ] Rendimiento: video del hero de 14 MB → versión ligera con póster.

### Fase 6 — Ingeniería y operación (transversal)
- [ ] Limpieza: Prisma/SQLite, carpetas `skills/`, `examples/`, `mini-services/`, `.zscripts/`, Caddyfile, ~30 capturas de prueba, dependencias sin uso.
- [x] Chequeo de tipos en el build (se quitó `ignoreBuildErrors`; 0 errores de TypeScript).
- [ ] Lint en el build (hoy hay ~30 reglas desactivadas en `eslint.config.mjs`).
- [ ] CI en GitHub: tipos, lint y `bun test tests` en cada push.
- [ ] Despliegue (Netlify) con variables de entorno nuevas (ver "Pendientes que dependen de Francisco").
- [x] Guía de operación con todos los enlaces ([GUIA-OPERACION.md](GUIA-OPERACION.md)) y README.
- [x] Keep-alive diario y backup semanal de Supabase (GitHub Actions), funcionando.

---

## 4. Decisiones tomadas (4-oct-2026)

| Tema | Decisión |
|---|---|
| Foro ciudadano | Se mantiene, **parqueado**. Mockup navegable en `/foro` para mostrar al cliente. |
| Contenido del portal | Habrá equipo real (pendiente). Se construye un **gestor de contenido** (ver §5). |
| Fuentes | Se sigue con el **MEM**. Se explora el **Organismo Coordinador (OC)**. Regla: **cada dato muestra su fuente** (MEM u OC). |
| Hosting | **Netlify**. |
| Análisis con IA | **Sí**, vía **OpenRouter** con un modelo **GPT Luna** de OpenAI (ver §6). |

## 5. Gestor de contenido (noticias, documentos, eventos, equipo)

Hoy todo ese contenido está escrito a mano dentro del código. Procedimiento propuesto:

1. **Tablas en Supabase**: `news`, `documents`, `events`, `team_members` (título, fecha, resumen, cuerpo, imagen, estado borrador/publicado, autor).
2. **Archivos** (PDF, fotos) en **Supabase Storage**, con enlaces públicos.
3. **Pestaña "Contenido" dentro de `/admin`** (protegido): formulario para crear, editar, programar y publicar; vista previa antes de publicar.
4. **El portal lee de esas tablas**: lo publicado aparece al instante; lo marcado como borrador no.
5. **Roles**: editor (crea borradores) y administrador (publica). Se reemplaza la clave única de `/admin` por cuentas individuales con Supabase Auth.

Flujo diario para el equipo: entrar a `/admin` → pestaña "Contenido" → "Nueva noticia" → escribir, subir foto → "Publicar". Sin tocar código ni pedir un despliegue.

## 6. Análisis con IA (OpenRouter + GPT Luna)

- Modelos disponibles hoy en OpenRouter: `openai/gpt-6-luna`, `openai/gpt-6-luna-pro`, `openai/gpt-5.6-luna` (y variantes). **Elegido: `openai/gpt-6-luna`** (el más barato: US$0.10 / US$0.50 por millón de tokens de entrada / salida, frente a US$0.20 / US$1.20 de `gpt-5.6-luna`). Configurable por variable de entorno (`OPENROUTER_MODEL`).
- Uso: botón "Analizar con IA" en cada indicador → resumen en lenguaje claro de tendencia, contexto y comparación entre EDEs.
- Reglas de exactitud: la IA **solo recibe los datos reales del indicador** (con fechas y fuente) y debe citarlos; la respuesta se marca como "Análisis generado por IA"; se guarda en `ai_analysis_logs` y se cachea por indicador y edición del informe (una llamada por mes, no por visita); límite de uso por visitante.
- Requiere: `OPENROUTER_API_KEY` en `.env.local` y en Netlify.

## 7. Orden recomendado

Fase 0 → Fase 1 → Fase 2 → Fase 3, con la Fase 6 en paralelo. La Fase 1 es la que convierte el proyecto en "exacto"; sin ella, todo lo demás pule datos que pueden estar en el lugar equivocado.

**Siguientes pasos sugeridos (11-oct-2026):**
1. Desplegar en Netlify con las variables nuevas (desbloquea mostrar el sitio publicado).
2. Para la presentación: **análisis con IA** (§6) o **gestor de contenido** (§5).
3. Antes de abrir el sitio al público: resto de la Fase 2 (caché, zod, `xlsx`) y limpieza de la Fase 6.
4. Fase 4: detector automático de ediciones del MEM y datos del Organismo Coordinador.
5. Fase 7: API de integración para Skay ([PLAN-API-INTEGRACION.md](PLAN-API-INTEGRACION.md)); se puede construir en local y publicar junto con el despliegue en Netlify.

## 8. Bitácora

| Fecha | Hito |
|---|---|
| 4-oct-2026 | Repo clonado; base de Supabase nueva; 5 auditorías; plan creado; Fase 0 (fechas, porcentajes, fuente, `/admin` protegido, portada real, mockup del foro, keep-alive). |
| 4/5-oct-2026 | Fase 1: parser nuevo con catálogo explícito; edición julio 2026; luego las 11 hojas, ediciones marzo→julio en orden con historial de correcciones; carga desde `/admin`. |
| 5-oct-2026 | Fase 3: ficha técnica, metodología, correcciones públicas, CSV, calendario, SEO, accesibilidad. |
| 11-oct-2026 | Keep-alive y backup funcionando (secrets de GitHub); guía de operación y README. Plan de la API de integración (Fase 7) para el agente Skay. |
| 12-oct-2026 | Sitio desplegado en Netlify (Francisco). Fase 7: API `/api/v1`, llaves por aplicación, Swagger UI en `/desarrolladores`, pestaña "Integraciones", herramientas para Skay; 55 pruebas. |
