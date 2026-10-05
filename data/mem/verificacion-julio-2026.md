# Verificación de la carga — Informe de Desempeño EEE, edición julio 2026

- **Fuente:** Ministerio de Energía y Minas (MEM), publicado el 22-sep-2026
  - Excel: https://mem.gob.do/wp-content/uploads/2026/09/Informe-de-Desempeno-Anexos._-julio-2026.xlsx
  - PDF: https://mem.gob.do/wp-content/uploads/2026/09/Informe_Desempeno_EEE_julio_2026-.pdf
- **Carga:** `bun scripts/mem-load.ts` (5-oct-2026) · las 11 hojas del informe · 918 indicadores · 98,210 valores de esta edición (tarifas desde jul-2013; resto desde ene-2009)

## Verificaciones automáticas (en cada carga)

| Verificación | Comparaciones | Diferencias |
|---|---|---|
| Cada indicador del catálogo tiene datos | 339 | 0 |
| Suma de meses = total anual del Excel (GWh, US$ MM, RD$ MM) | 3,648 | 3 (anomalías de la fuente, ver `anomalias-conocidas.json`) |
| Edenorte + Edesur + Edeeste = total EDEs, mes a mes | 5,908 | 0 |

## Cotejo contra el resumen ejecutivo del PDF

| Dato del PDF | PDF | Base de datos | |
|---|---|---|---|
| Energía comprada EDEs ene–jul (GWh) | 12,072.1 | 12,072.1 | ✅ |
| Energía facturada EDEs ene–jul (GWh) | 7,257.2 | 7,257.2 | ✅ |
| Factura compra EDEs ene–jul (US$ MM) | 1,925.6 | 1,925.6 | ✅ |
| Facturación venta EDEs ene–jul (US$ MM) | 1,229.9 | 1,229.9 | ✅ |
| Cobros EDEs ene–jul (US$ MM) | 1,156.6 | 1,156.6 | ✅ |
| Gastos operativos EDEs ene–jul (US$ MM) | 266.8 | 266.8 | ✅ |
| Inversiones EDEs ene–jul (US$ MM) | 133.2 | 133.2 | ✅ |
| Energía facturada EGEHID ene–jul (GWh) | 885.0 | 885.0 | ✅ |
| Pérdidas año móvil jul-26 (%) | 39.2 | 39.2 | ✅ |
| Cobranza año móvil jul-26 (%) | 95.4 | 95.4 | ✅ |
| CRI año móvil jul-26 (%) | 58.0 | 58.0 | ✅ |
| Índice de recuperación de energía año móvil jul-26 (%) | 57.7 | 57.7 | ✅ |
| Tasa de cambio jul-26 (RD$/US$) | 58.88 | 58.88 | ✅ |
| Factura compra EDEs jul-26 (US$ MM) | 317.67 | 317.67 | ✅ |

**14 de 14 cifras coinciden.**

## Observaciones sobre la fuente

- El costo marginal de potencia figura en el Excel como cUS$/kW-mes, pero sus valores (≈ 9–11) corresponden a US$/kW-mes. Se mantiene la unidad publicada con una nota en la ficha del indicador hasta confirmarlo.
- La hoja CDEEE solo tiene datos hasta enero 2024.
- En CDEEE, la etiqueta "EgeHaina (Larimar) II" aparece en dos filas con valores distintos; se cargan como series separadas.

## Anexo de resultados financieros (flujo de caja, US$ MM)

Se carga desde la hoja "Anexo Res Financieros" con plantillas explícitas por empresa (EDEs, Edenorte, Edesur, Edeeste, EGEHID, ETED, EGPC): 339 partidas. Cada edición trae solo los meses del año en curso (enero → mes de la edición).

| Verificación (edición julio) | Comparaciones | Diferencias |
|---|---|---|
| Totales = suma de sus partidas; balances = su fórmula; EDEs = Edenorte + Edesur + Edeeste | 1,239 | 0 |
| Columna "Acumulado" = suma de los meses | 339 | 0 |

Las ediciones de marzo y abril usaban otro formato en el bloque EGPC (sin la fila "3. Gastos Totales"); se reconocen con una variante explícita de la plantilla.

Totales EDEs enero–julio 2026: aportes del Gobierno US$ 1,126.9 MM · ingresos US$ 1,188.7 MM · gastos US$ 2,153.8 MM · balance operacional US$ −965.1 MM.

## Anexo de deuda (US$ MM)

- **Deuda corriente de las EDEs con generadoras:** saldo al cierre del mes (foto); cada edición aporta su mes. Total, por EDE y por generadora (48, lista explícita). Julio 2026: **179.0**.
- **Pagos de las EDEs por compra de energía:** mensual del año en curso, por EDE y concepto (generadores privados; CDEEE, EGEHID y ETED; Punta Catalina). Enero–julio 2026: **1,928.2**.
- **Balance pendiente de pago:** foto al cierre del mes, por EDE.
- Verificado: generadoras = total (sin contar "Grupo AES", que es subtotal de AES Andrés + AES DPP + EGE Itabo); EDEs = total; conceptos = total del mes; fila "Total" = suma de los meses.
- No se cargan: deuda corriente de la CDEEE (sin datos desde 2022) ni deuda congelada (en cero).
- Anomalía de la fuente (edición abril 2026): la fila de mayo repetía los pagos a CTPC de abril y la fila Total los sumaba; se cargan solo los meses ejecutados.

## Tarifas (RD$)

Serie mensual continua **julio 2013 → julio 2026** (157 meses, sin huecos) para 28 conceptos de 7 categorías (BTS1, BTS2, BTD, BTH, MTD1, MTD2, MTH) × tarifa aplicada y de referencia × 3 EDEs = **168 series**. Une el régimen anterior (2013–2019, mensual) y el nuevo (desde 2020, por trimestres u otros períodos). Hasta octubre 2021 la tarifa aplicada fue única para las tres EDEs. Los períodos duplicados ("abr - may 26" y "abr - jun 26") se verifican idénticos.

Ejemplo (BTS1, primeros 200 kWh, Edenorte): aplicada RD$ 4.44/kWh de 2013 a octubre 2021 y RD$ 5.97 en julio 2026; referencia RD$ 16.80.

## Historial de ediciones cargadas y revisiones del MEM

Las ediciones se cargaron en orden (marzo → julio 2026). En cada carga se compara cada valor con el de la edición anterior; los cambios quedan en la tabla `data_point_revisions`.

| Edición | Hoja EDE | Valores | Valores revisados respecto a la edición anterior |
|---|---|---|---|
| Marzo 2026 | `EDE's` | 95,029 | — |
| Abril 2026 | `EDE` (renombrada solo en esta edición) | 95,654 | 35 |
| Mayo 2026 | `EDE's` | 96,622 | 16 |
| Junio 2026 (vf) | `EDE's` | 97,416 | 96 |
| Julio 2026 | `EDE's` | 98,210 | 0 |

En total, la base tiene 918 indicadores y 98,430 valores (las fotos mensuales de deuda se acumulan de una edición a otra).

Revisiones relevantes:

- **Abril 2026:** clientes facturados de Edesur en ene–dic 2025 rebajados en ≈78,000 (≈8 %); el total EDEs se ajusta igual. Gastos operativos de EGPC de marzo 2026: 2.51 → 3.47 US$ MM.
- **Mayo 2026:** aportes del Gobierno de marzo 2026 corregidos: Edesur 32.5 → 42.4 US$ MM (total EDEs 177.0 → 186.9). Ajustes menores en ingresos de EGEHID de abril.
- **Junio 2026:** reclasificación de la generación de 2025 entre gas natural (−40 a −57 GWh/mes) y fuel oil No. 6 (+38 a +57 GWh/mes), con su efecto en la composición de la matriz. Ajustes menores en FETE, inversiones y disponibilidad de 2026.
