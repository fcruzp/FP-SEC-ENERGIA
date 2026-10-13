# Prompt para integrar el Observatorio Energético en Skay

Copiar todo lo que está dentro del bloque y pegarlo en una sesión de Claude Code abierta en el proyecto de Skay.

````text
Quiero agregarle a Skay una capacidad nueva: consultar datos oficiales del sector eléctrico dominicano a través de la API del Observatorio Energético, que es otro proyecto mío. Trátala como una integración más (una "skill" o herramienta más del agente), siguiendo exactamente el mismo patrón que ya usa Skay para sus otras APIs de terceros.

## Contexto

- Skay es un agente tipo chatbot que hace inferencia con un modelo vía OpenRouter (function calling / tools) y se conecta a muchas APIs (búsqueda web, X, Facebook, etc.).
- El Observatorio Energético (sitio: https://energia-fp.netlify.app) publica, con una API REST de SOLO LECTURA, los datos del "Informe de Desempeño de las Empresas Eléctricas Estatales" del Ministerio de Energía y Minas (MEM) de República Dominicana: generación, costo marginal, pérdidas, cobranza y CRI de Edenorte/Edesur/Edeeste, finanzas de las empresas estatales (EGEHID, ETED, Punta Catalina), deuda con generadoras, tarifas, combustibles y tasa de cambio. Series mensuales desde 2009 en muchos casos. 918 indicadores.
- Documentación (léela antes de empezar; el proyecto está en esta misma PC):
  - Guía de la API y de la integración con Skay: C:\PROJECTS\CLAUDE\FP-ENERGIA\docs\api\README.md
  - Definiciones de herramientas listas (formato function calling de OpenAI/OpenRouter, con el endpoint de cada una en "x-http") y la instrucción de sistema sugerida: C:\PROJECTS\CLAUDE\FP-ENERGIA\docs\api\skay-tools.json
  - Contrato OpenAPI 3.1 (público): https://energia-fp.netlify.app/api/v1/openapi.json
  - Swagger UI: https://energia-fp.netlify.app/desarrolladores

## Datos clave de la API

- URL base: https://energia-fp.netlify.app/api/v1
- Autenticación: cabecera `Authorization: Bearer <llave>` (formato `fpe_live_` + 32 caracteres). Nunca en la URL.
- Endpoints (todos GET): /resumen, /indicadores?q=&categoria=&entidad=, /indicadores/{slug}, /indicadores/{slug}/serie?desde=AAAA-MM&hasta=AAAA-MM, /comparar?slugs=a,b,c (máx. 6), /correcciones, /meta, /categorias, /entidades.
- Respuesta: `{ data, meta }`. `meta.fuente.cita` trae un texto listo para citar (MEM, edición, fecha de publicación); `meta.fuente.excel_url` y `pdf_url` son los enlaces oficiales.
- Periodos AAAA-MM; porcentajes en escala 0–100 (variación de un % = puntos porcentuales). Meses sin dato = null; nunca interpolar.
- Errores en application/problem+json con `code`, `detail` y `request_id` (401 llave, 403 permiso, 404 slug, 422 parámetros, 429 límite con Retry-After). Límite: 60 peticiones/min y 10,000/día.
- Flujo recomendado para el modelo: /resumen para preguntas generales; si se necesita algo específico, buscar el slug exacto con /indicadores?q=... y luego pedir ficha, serie o comparación por slug.
- No hay CORS: la llave solo debe usarse desde el servidor/backend de Skay, jamás en código que corra en el navegador.

## Lo que quiero que hagas

1. Explora primero el proyecto Skay y explícame brevemente cómo están implementadas las integraciones existentes (dónde se definen las herramientas, cómo se ejecutan, cómo se leen las variables de entorno y los secretos, cómo se arma el system prompt, cómo se manejan errores y timeouts). No inventes una arquitectura nueva: replica la que ya existe.
2. Agrega la integración "Observatorio Energético" con las 7 herramientas de skay-tools.json (energia_resumen, energia_buscar_indicadores, energia_ficha_indicador, energia_serie, energia_comparar, energia_correcciones, energia_fuentes). Puedes ajustar nombres o formato al estilo de Skay, pero conserva las descripciones (son las que guían al modelo) y los parámetros.
3. Ejecutor: construye la URL según "x-http" (los parámetros de ruta como {slug} van en el path, el resto como query), envía la cabecera Bearer, usa un timeout razonable (~15 s), y si la API responde un error devuelve al modelo el `detail` del problem+json en vez de lanzar una excepción, para que pueda corregir (p. ej. buscar el slug correcto). Respeta Retry-After en 429. Opcional: caché en memoria de unos minutos (los datos cambian una vez al mes).
4. Instrucción de sistema: agrega al system prompt de Skay la "instruccion_de_sistema_sugerida" de skay-tools.json (adaptada al tono de Skay): usar primero las herramientas energia_* para el sector eléctrico dominicano, citar siempre meta.fuente.cita con el mes del dato, y no mezclar estas cifras oficiales con números de redes sociales sin aclarar el origen.
5. Configuración: lee `FP_ENERGIA_API_URL` y `FP_ENERGIA_API_KEY` desde las variables de entorno, igual que las demás integraciones. Agrégalas al archivo de ejemplo de variables (.env.example o equivalente) SIN el valor de la llave. Si la llave falta, la integración debe desactivarse sola con un aviso en el log, sin romper Skay.
6. Yo pondré la llave real: dime exactamente en qué archivo (p. ej. .env.local) y, si Skay está desplegado, en qué panel del hosting debo agregar las dos variables. NO me pidas que pegue la llave en el chat y no la escribas en ningún archivo versionado.
7. Pruebas: cuando te confirme que puse la llave, verifica la conexión con una llamada real a /meta (sin imprimir la llave) y luego haz una prueba de punta a punta con Skay preguntando: "¿Cuáles son las pérdidas de Edeeste en el último año móvil y cómo se comparan con Edenorte?". La respuesta correcta según la edición de julio 2026 del MEM es Edeeste ≈ 56.5 % y Edenorte ≈ 26.0 %, citando esa edición. Prueba también una pregunta que requiera buscar un slug (p. ej. "¿cómo ha evolucionado el costo marginal de la energía en 2026?") y un caso de error (slug inexistente) para confirmar que el modelo se recupera.
8. Si Skay tiene pruebas automáticas, agrega las de esta integración (con la API simulada, sin usar la llave real). Documenta la integración donde Skay documente las demás.
9. Muéstrame el resumen de los cambios y espera mi confirmación antes de hacer commit o push.
````
