/**
 * Definiciones de los indicadores del Informe de Desempeño (MEM).
 * Las fórmulas provienen del glosario del propio informe; las fuentes primarias,
 * de su sección de referencias. Se asignan por patrón de slug.
 */

export interface Definition {
  definition: string
  formula?: string
  /** Quién produce el dato que el MEM publica */
  primarySource?: string
}

interface Rule extends Definition { match: RegExp }

const CUED_FORMS = 'Formularios de información de Edenorte, Edesur y Edeeste remitidos por el Consejo Unificado de las Empresas Distribuidoras (CUED) al MEM.'
const CUED_CASH = 'Flujos de caja de las empresas distribuidoras remitidos por el CUED al MEM.'
const SENI = 'Departamento de Estudio y Seguimiento de Operaciones del SENI, Dirección de Mercado Eléctrico del MEM (datos del Organismo Coordinador).'

const RULES: Rule[] = [
  // ── Indicadores de gestión de las EDEs ──
  {
    match: /^edes-perdidas-ano-movil/,
    definition: 'Proporción de la energía comprada por las distribuidoras que no se factura (pérdidas técnicas y no técnicas), acumulada en los últimos 12 meses.',
    formula: 'Pérdidas = (Compra de energía − Energía facturada) / Compra de energía × 100, sobre 12 meses móviles (GWh)',
    primarySource: CUED_FORMS,
  },
  {
    match: /^edes-perdidas-pct/,
    definition: 'Proporción de la energía comprada en el mes que no se factura (pérdidas técnicas y no técnicas).',
    formula: 'Pérdidas = (Compra de energía − Energía facturada) / Compra de energía × 100 (GWh)',
    primarySource: CUED_FORMS,
  },
  {
    match: /^edes-perdidas-gwh/,
    definition: 'Energía comprada por las distribuidoras que no se factura.',
    formula: 'Pérdidas (GWh) = Compra de energía − Energía facturada',
    primarySource: CUED_FORMS,
  },
  {
    match: /^edes-cobranzas/,
    definition: 'Relación entre lo cobrado por venta de energía y lo facturado por ese mismo concepto.',
    formula: 'Cobranza = Cobros por venta de energía / Facturación por venta de energía × 100 (US$ MM)',
    primarySource: CUED_FORMS,
  },
  {
    match: /^edes-cri/,
    definition: 'Índice de Recuperación de Efectivo (Cash Recovery Index): proporción del valor de la energía comprada que las distribuidoras recuperan en efectivo.',
    formula: 'CRI = (1 − Pérdidas) × Índice de cobranza',
    primarySource: CUED_FORMS,
  },
  {
    match: /^edes-indice-de-recuperacion-de-energia/,
    definition: 'Proporción de la energía comprada o suministrada que efectivamente se cobra.',
    primarySource: CUED_FORMS,
  },
  {
    match: /^edes-precio-medio-de-compra/,
    definition: 'Precio promedio que pagan las distribuidoras por la energía que compran.',
    formula: 'Precio medio de compra = Factura por compra de energía (US$ MM) / Compra de energía (GWh) × 100 (cUS$/kWh)',
    primarySource: SENI,
  },
  {
    match: /^edes-precio-medio-de-venta/,
    definition: 'Precio promedio al que las distribuidoras facturan la energía a sus clientes.',
    formula: 'Precio medio de venta = Facturación por venta de energía (US$ MM) / Energía facturada (GWh) × 100 (cUS$/kWh)',
    primarySource: CUED_FORMS,
  },
  { match: /^edes-(compra-de-energia|factura-por-compra)/, definition: 'Energía comprada por las distribuidoras en el mercado eléctrico mayorista (contratos y mercado spot) y su valor facturado.', primarySource: SENI },
  { match: /^edes-energia-facturada/, definition: 'Energía facturada por las distribuidoras a sus clientes.', primarySource: CUED_FORMS },
  { match: /^edes-(factura-por-venta|energia-cobrada|cobros|fete|otros-cobros|otros-ingresos)/, definition: 'Facturación y cobros de las distribuidoras por la venta de energía y otros conceptos.', primarySource: CUED_FORMS },
  { match: /^edes-cantidad-de-clientes/, definition: 'Cantidad de clientes facturados por las distribuidoras en el mes.', primarySource: CUED_FORMS },
  { match: /^edes-disponibilidad/, definition: 'Disponibilidad del servicio eléctrico de las distribuidoras.', primarySource: CUED_FORMS },
  { match: /^edes-/, definition: 'Indicador operativo o financiero de las empresas distribuidoras (Edenorte, Edesur, Edeeste).', primarySource: CUED_FORMS },

  // ── Variables del sistema ──
  { match: /^tasa-de-cambio/, definition: 'Tasa de cambio del dólar estadounidense (promedio del mes).', primarySource: 'Banco Central de la República Dominicana (BCRD).' },
  { match: /^costo-marginal/, definition: 'Costo marginal del sistema eléctrico: costo de abastecer una unidad adicional de energía o de potencia en el Mercado Eléctrico Mayorista.', primarySource: SENI },
  { match: /^(peaje-de-transmision|derecho-de-conexion)/, definition: 'Cargos regulados por el uso del sistema de transmisión.', primarySource: SENI },
  { match: /^generacion-/, definition: 'Energía generada en el sistema eléctrico nacional interconectado, por tipo de combustible o fuente.', primarySource: SENI },
  { match: /^participacion-/, definition: 'Participación de cada combustible o fuente en la generación total del mes.', formula: 'Participación = Generación de la fuente / Generación total × 100', primarySource: SENI },
  {
    match: /^precio-/,
    definition: 'Precio internacional de referencia del combustible.',
    formula: 'Equivalencias del informe: 1 barril de fuel oil No. 6 = 5.8 × 10⁶ BTU; 1 tonelada de carbón = 2.66 × 10⁷ BTU',
    primarySource: SENI,
  },

  // ── Empresas de generación y transmisión ──
  { match: /^egehid-/, definition: 'Indicador operativo o financiero de la Empresa de Generación Hidroeléctrica Dominicana (EGEHID).', primarySource: 'Dirección Financiera de EGEHID.' },
  { match: /^eted-/, definition: 'Indicador operativo o financiero de la Empresa de Transmisión Eléctrica Dominicana (ETED).', primarySource: 'Dirección Financiera de ETED.' },
  { match: /^egpc-/, definition: 'Indicador operativo o financiero de la Empresa de Generación Eléctrica Punta Catalina (EGEPC).', primarySource: 'Dirección Financiera de EGEPC.' },
  { match: /^cdeee-/, definition: 'Indicador de la Corporación Dominicana de Empresas Eléctricas Estatales (CDEEE), en proceso de liquidación; la serie se publica hasta enero 2024.', primarySource: 'CDEEE.' },

  // ── Anexos ──
  { match: /^rf-.*aportes-del-gobierno/, definition: 'Transferencias del Gobierno a las empresas para cubrir su déficit operacional (subsidio), registradas en su flujo de caja.', primarySource: 'Flujos de caja de las empresas y libramientos del Ministerio de Hacienda y Economía para cubrir el déficit de las EDEs.' },
  { match: /^rf-/, definition: 'Partida del flujo de caja (base percibido) de la empresa: ingresos, gastos, inversiones, balances y su financiamiento.', primarySource: `${CUED_CASH} Para EGEHID, ETED y EGEPC, sus direcciones financieras.` },
  { match: /^deuda-edes-corriente/, definition: 'Saldo que las distribuidoras adeudan a las generadoras por compra de energía, potencia y derecho de conexión, al cierre del mes.', primarySource: 'Formularios "GENCO\'s Financiero" (facturación, pagos y deudas con generadores) de las EDEs, remitidos por el CUED.' },
  { match: /^deuda-edes-balance-pendiente/, definition: 'Balance pendiente de pago de las distribuidoras por concepto, al cierre del mes.', primarySource: 'Formularios "GENCO\'s Financiero" de las EDEs, remitidos por el CUED.' },
  { match: /^pagos-edes/, definition: 'Pagos efectuados por las distribuidoras por compra de energía, potencia y derecho de conexión, por destinatario.', primarySource: 'Formularios "GENCO\'s Financiero" de las EDEs, remitidos por el CUED.' },
  { match: /^tarifa-/, definition: 'Cargo tarifario vigente para la categoría de cliente indicada. La tarifa aplicada es la que se cobra; la de referencia es la que cubriría los costos de abastecimiento.', primarySource: 'Resoluciones de la Superintendencia de Electricidad (SIE) de fijación de tarifas de referencia y de transición.' },
]

export function getDefinition(slug: string): Definition | null {
  const rule = RULES.find(r => r.match.test(slug))
  if (!rule) return null
  const { match: _match, ...definition } = rule
  return definition
}

/** Glosario del informe, para la página de metodología. */
export const GLOSSARY: { term: string; text: string; formula?: string }[] = [
  { term: 'P.P. (puntos porcentuales)', text: 'Diferencia absoluta entre dos porcentajes.' },
  { term: 'Pérdidas (%)', text: 'Relación entre la energía comprada pero no facturada y el total de energía comprada.', formula: '(Compra de energía − Energía facturada) / Compra de energía × 100' },
  { term: 'Índice de cobranza (%)', text: 'Relación entre los cobros por venta de energía y la facturación por ese concepto.', formula: 'Cobros por venta de energía / Facturación por venta de energía × 100' },
  { term: 'CRI (Cash Recovery Index)', text: 'Índice de recuperación de efectivo.', formula: '(1 − Pérdidas) × Índice de cobranza' },
  { term: 'Índice de recuperación de energía (%)', text: 'Proporción de la energía que se cobra respecto de la suministrada o comprada.' },
  { term: 'Precio medio de compra (cUS$/kWh)', text: 'Precio promedio de la energía comprada por las distribuidoras.', formula: 'Factura por compra de energía (US$ MM) / Compra de energía (GWh) × 100' },
  { term: 'Precio medio de venta (cUS$/kWh)', text: 'Precio promedio de la energía facturada a los clientes.', formula: 'Facturación por venta de energía (US$ MM) / Energía facturada (GWh) × 100' },
  { term: 'Año móvil', text: 'Acumulado de los últimos 12 meses hasta el mes indicado.' },
  { term: 'BTU', text: 'Unidad térmica británica: calor necesario para elevar 1 °F la temperatura de una libra de agua. 1 barril de fuel oil No. 6 = 5.8 × 10⁶ BTU; 1 tonelada de carbón = 2.66 × 10⁷ BTU.' },
]
