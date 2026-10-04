# Plan de profesionalización — Portal Secretaría de Energía FP + Observatorio Energético

*Fecha: 4 de octubre de 2026 · Basado en 5 auditorías: frontend, backend/seguridad, exactitud de datos, fuentes externas, historia del proyecto.*

---

## 1. Diagnóstico en una página

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

- [ ] Proteger `/admin` y `/api/admin/*` (login con Supabase Auth + rol admin; mínimo inmediato: Basic Auth por middleware).
- [ ] Corregir fechas: una única función de fechas en UTC usada por gráficos, tablas y filtros.
- [ ] Mostrar porcentajes correctamente (×100) y quitar la unidad duplicada en títulos.
- [ ] Atribución correcta: "Fuente: Ministerio de Energía y Minas (MEM) — Informe de Desempeño de las Empresas Eléctricas Estatales, edición marzo 2026", con enlace a mem.gob.do.
- [ ] Portada: quitar o conectar a datos reales las cifras fijas; retirar "Monitoreo en tiempo real"; retirar equipo/eventos/documentos de relleno hasta tener contenido real.
- [ ] GitHub Action: keep-alive diario + `pg_dump` semanal (backup).
- [ ] Commit de lo hecho hasta hoy (setup-db, prerequisito users).

### Fase 1 — Exactitud de datos (núcleo, 1–2 semanas)
Objetivo: 100 % de los datos en el indicador y la empresa correctos, verificables.

- [ ] **Parser único nuevo** (TypeScript, compartido por CLI y panel admin) con **mapa explícito y versionado**: `(hoja, fila, etiqueta esperada) → (indicador, empresa, unidad, escala)`. Se elimina el emparejamiento por nombre y los ~10 scripts viejos.
- [ ] Fechas leídas desde el número serial de Excel; columnas anuales/acumuladas tratadas como `yearly`/`ytd` o excluidas; ningún "deduplicado silencioso".
- [ ] **Conciliación automática** tras cada carga: suma ene–dic = "Acumulado Año"; ene–mar = columna C; EDEs individuales suman el consolidado; fórmulas del glosario (CRI, pérdidas, precio medio) se cumplen; totales clave = PDF.
- [ ] **Procedencia**: tabla `reports` (una fila por edición), `report_id` en cada dato, tabla `ingestion_runs` con cobertura, y registro de revisiones cuando el MEM cambia un valor pasado.
- [ ] **Catálogo limpio**: unidades normalizadas (tabla de unidades), restricción empresa-del-dato = empresa-del-indicador, nombres no ambiguos, porcentajes con convención única.
- [ ] Cargar las **5 hojas faltantes** (anexos financieros, deuda, tarifas trimestrales Indexada/Aplicada por EDE).
- [ ] Recargar desde cero y **ponerse al día**: ediciones abril–julio 2026 (y ediciones anteriores para detectar revisiones históricas).
- [ ] Tests de regresión del parser contra el Excel real.

### Fase 2 — API sólida y rápida (3–5 días)
- [ ] Vistas/funciones SQL para último valor, valor anterior y últimos 12 meses (sin tope de 1,000 filas).
- [ ] Conteo honesto de indicadores (solo los que tienen datos) y páginas para los desgloses por empresa.
- [ ] Caché: los datos cambian una vez al mes; revalidar al cargar una edición nueva.
- [ ] Validación de parámetros (zod), actualizar `xlsx` (vulnerabilidades conocidas), límite de tamaño de archivo.
- [ ] Arreglar el panel admin (hoy probablemente "dice éxito" sin insertar nada).

### Fase 3 — Un observatorio de nivel profesional (2–3 semanas)
Inspirado en Our World in Data, Ember, Energía Abierta (Chile) y ESIOS (España).

- [ ] **Ficha por indicador**: definición, fórmula, unidad, fuente exacta, frecuencia, última actualización, notas.
- [ ] **Página de metodología**: glosario del MEM (CRI, pérdidas, P.P., equivalencias), enfoque devengado vs. caja, diferencias entre fuentes.
- [ ] **Cita al pie de cada gráfico** + botón **Descargar CSV/XLSX** + enlace al Excel original del MEM.
- [ ] **Calendario de actualización** y fecha de datos visible ("Datos a: julio 2026 · publicado por el MEM el 22-sep-2026").
- [ ] **Registro público de correcciones** (changelog).
- [ ] "Tendencias" con comparación **interanual** y umbral mínimo (eliminar +519 % sobre bases casi cero); marcar anomalías de la fuente.
- [ ] Páginas renderizadas en servidor con metadatos por indicador (SEO, compartir en redes), `sitemap.xml`.
- [ ] Accesibilidad de gráficos (tabla alternativa, textos descriptivos).
- [ ] Opcional posterior: datos abiertos / API pública con licencia.

### Fase 4 — Automatización y nuevas fuentes (2–3 semanas)
- [ ] **Detector de ediciones nuevas del MEM** vía la API de WordPress de mem.gob.do (`/wp-json/wp/v2/media?search=Desempeno`), descarga, carga en "borrador", conciliación y **aprobación humana** antes de publicar.
- [ ] **Organismo Coordinador (OC)**: costos marginales de energía (diarios) y potencia (IMTE mensual), demanda máxima, operación real — API pública de apps.oc.org.do.
- [ ] **Banco Central** (tasa de cambio), **MICM** (precios semanales de combustibles), **SIE** (tarifas), **Hacienda** (subsidio eléctrico).
- [ ] **Contraste externo** con Ember / OLADE para detectar discrepancias.

### Fase 5 — Portal institucional (en paralelo, depende de contenido)
- [ ] Teaser del Observatorio en portada alimentado con datos reales.
- [ ] Equipo, noticias, documentos y eventos reales (necesita material de la Secretaría).
- [ ] Formulario de suscripción funcional.
- [ ] Rendimiento: video del hero de 14 MB → versión ligera con póster.

### Fase 6 — Ingeniería y operación (transversal)
- [ ] Limpieza: Prisma/SQLite, carpetas `skills/`, `examples/`, `mini-services/`, `.zscripts/`, Caddyfile, ~30 capturas de prueba, dependencias sin uso.
- [ ] Activar chequeo de tipos y lint en el build (hoy `ignoreBuildErrors: true`).
- [ ] CI en GitHub: tipos, lint, tests del parser.
- [ ] Despliegue (Netlify) con variables de entorno nuevas; revisar que el historial de git no exponga claves del proyecto anterior.

---

## 4. Decisiones que necesito de ti

1. **Foro ciudadano**: nunca se usó. ¿Lo eliminamos (recomendado) o lo dejamos para más adelante?
2. **Contenido del portal**: ¿quiénes son el equipo real? ¿Hay noticias, documentos y eventos reales para publicar?
3. **Alcance de fuentes**: ¿quieres incorporar el Organismo Coordinador y demás fuentes (Fase 4), o el Observatorio se limita al informe del MEM?
4. **Hosting**: ¿seguimos en Netlify?
5. **Análisis con IA** (estaba planeado con OpenRouter): ¿sigue en los planes?

## 5. Orden recomendado

Fase 0 → Fase 1 → Fase 2 → Fase 3, con la Fase 6 en paralelo. La Fase 1 es la que convierte el proyecto en "exacto"; sin ella, todo lo demás pule datos que pueden estar en el lugar equivocado.
