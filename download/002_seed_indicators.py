#!/usr/bin/env python3
"""
Generates SQL INSERT statements for all missing indicators from the XLS.
Already seeded: 22 indicators from "Variables Relevantes" (001_observatorio_foro_schema.sql)
This script generates: ~200+ remaining indicators from all other sheets.
"""

import re

def slugify(text: str) -> str:
    """Convert text to URL-friendly slug."""
    t = text.lower().strip()
    # Remove content in parentheses (units) for cleaner slugs
    t = re.sub(r'\([^)]*\)', '', t)
    # Replace special chars
    t = t.replace('ñ', 'n').replace('ó', 'o').replace('í', 'i').replace('á', 'a').replace('é', 'e').replace('ú', 'u')
    t = t.replace('à', 'a').replace('è', 'e').replace('ù', 'u')
    # Replace non-alphanumeric with hyphens
    t = re.sub(r'[^a-z0-9]+', '-', t)
    t = re.sub(r'-+', '-', t)
    t = t.strip('-')
    return t

def sql_escape(text: str) -> str:
    """Escape single quotes for SQL."""
    return text.replace("'", "''")

# Category slug lookup
CAT = {
    'variables-relevantes': 'variables-relevantes',
    'edes': 'empresas-distribuidoras',
    'cdeee': 'cdeee',
    'egehid': 'egehid',
    'eted': 'eted',
    'egpc': 'egpc-punta-catalina',
    'res-financieros': 'resultados-financieros',
    'deuda': 'deuda-generadoras',
    'tarifario': 'regimen-tarifario',
    'tarifario-anterior': 'regimen-tarifario-anterior',
}

# Entity slug lookup (for breakdowns)
ENT = {
    'edenorte': 'edenorte',
    'edesur': 'edesur',
    'edeeste': 'edeeste',
    'edes': 'edes-consolidado',
    'cdeee': 'cdeee',
    'egehid': 'egehid',
    'eted': 'eted',
    'egpc': 'egpc',
    'gsf': 'gsf',
    'cespm': 'cespm',
    'dpp': 'dpp',
    'egehaina-larimar': 'egehaina-larimar',
    'electronic-jrc': 'electronic-jrc',
    'montecristi-solar': 'montecristi-solar',
    'c-power': 'c-power',
    'pecasa': 'pecasa',
    'matafongo': 'matafongo',
    'wcg-energy': 'wcg-energy',
    'emerald-solar': 'emerald-solar',
    'poseidon': 'poseidon',
    'quisqueya-ii': 'quisqueya-ii',
    'falcondo': 'falcondo',
    'rsj': 'rsj',
    'mercado-spot': 'mercado-spot',
}

lines = []
lines.append("-- ============================================================")
lines.append("-- SEED: Indicadores restantes (PASO 2)")
lines.append("-- Generado automáticamente desde análisis del XLS")
lines.append("-- ============================================================")
lines.append("")

# ============================================================
# 1. Add missing category: Regimen tarifario anterior
# ============================================================
lines.append("-- ============================================================")
lines.append("-- NUEVA CATEGORÍA: Régimen Tarifario Anterior")
lines.append("-- ============================================================")
lines.append("""INSERT INTO indicator_categories (name, slug, icon, color, description, source_sheet, sort_order) VALUES
  ('Régimen Tarifario Anterior', 'regimen-tarifario-anterior', 'FileText', '#A855F7',
   'Cargos tarifarios del régimen anterior por tipo de servicio y distribuidora',
   'Regimen tarifario anterior', 10)
ON CONFLICT (slug) DO NOTHING;""")
lines.append("")

# ============================================================
# 2. Missing Variables Relevantes indicators
# ============================================================
lines.append("-- ============================================================")
lines.append("-- VARIABLES RELEVANTES: Indicadores faltantes")
lines.append("-- ============================================================")

vr_missing = [
    ("Gas Natural Conversion (US$/MMBTU)", "gas-natural-conversion-usd-mmbtu", "US$/MMBTU",
     "Precio del gas natural convertido a equivalente por millón de BTU", "line", 23),
    # Composición Generación (%)
    ("Composición Carbón Mineral (PP)", "composicion-carbon-mineral-pp", "PP",
     "Participación porcentual del carbón mineral en la generación energética", "bar", 24),
    ("Composición Gas Natural (PP)", "composicion-gas-natural-pp", "PP",
     "Participación porcentual del gas natural en la generación energética", "bar", 25),
    ("Composición Fuel Oil No. 2 (PP)", "composicion-fuel-oil-2-pp", "PP",
     "Participación porcentual del Fuel Oil No. 2 en la generación energética", "bar", 26),
    ("Composición Fuel Oil No. 6 (PP)", "composicion-fuel-oil-6-pp", "PP",
     "Participación porcentual del Fuel Oil No. 6 en la generación energética", "bar", 27),
    ("Composición Fuel Oil No. 2 y No. 6 (PP)", "composicion-fuel-oil-2-y-6-pp", "PP",
     "Participación porcentual combinada del Fuel Oil No. 2 y No. 6 en la generación", "bar", 28),
    ("Composición Hidráulica (PP)", "composicion-hidraulica-pp", "PP",
     "Participación porcentual de la generación hidráulica", "bar", 29),
    ("Composición Eólica (PP)", "composicion-eolica-pp", "PP",
     "Participación porcentual de la generación eólica", "bar", 30),
    ("Composición Solar Fotovoltaica (PP)", "composicion-solar-fv-pp", "PP",
     "Participación porcentual de la generación solar fotovoltaica", "bar", 31),
    ("Composición Biomasa (PP)", "composicion-biomasa-pp", "PP",
     "Participación porcentual de la generación por biomasa", "bar", 32),
    ("Composición Total Renovable No Convencional (PP)", "composicion-total-renovable-no-convencional-pp", "PP",
     "Participación porcentual total de fuentes renovables no convencionales", "line", 33),
    # Fuel Oil 2+6 combined
    ("Generación Fuel Oil No. 2 y No. 6", "generacion-fuel-oil-2-y-6", "GWh",
     "Generación combinada de energía a partir de Fuel Oil No. 2 y No. 6", "bar", 34),
]

for name, slug, unit, desc, chart, sort in vr_missing:
    lines.append(f"""INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'variables-relevantes'),
   '{sql_escape(name)}', '{slug}', '{sql_escape(unit)}', '{sql_escape(desc)}', '{chart}', {sort})
ON CONFLICT (slug) DO NOTHING;""")
lines.append("")

# ============================================================
# 3. EDE's indicators (42 parents + 3 breakdowns each)
# ============================================================
lines.append("-- ============================================================")
lines.append("-- EDE's: 42 indicadores principales + desglose por EDE")
lines.append("-- ============================================================")

edes_indicators = [
    ("Compra de Energía (GWh)", "compra-energia-gwh", "GWh", "Energía comprada por las EDEs", "area"),
    ("Precio Medio de Compra de Energía (cUSD/kWh)", "precio-medio-compra-energia-cusd-kwh", "cUSD/kWh", "Precio medio ponderado de compra de energía", "line"),
    ("Factura por Compra de Energía (USD MM)", "factura-compra-energia-usd-mm", "USD MM", "Monto total facturado por compra de energía", "bar"),
    ("Compra de Energía CONTRATOS (GWh)", "compra-energia-contratos-gwh", "GWh", "Energía comprada bajo contratos", "area"),
    ("Precio Medio de Compra de Energía CONTRATOS (cUSD/kWh)", "precio-medio-compra-energia-contratos", "cUSD/kWh", "Precio medio de compra bajo contratos", "line"),
    ("Factura por Compra de Energía CONTRATOS (USD MM)", "factura-compra-energia-contratos-usd-mm", "USD MM", "Monto facturado por compra bajo contratos", "bar"),
    ("Compra de Energía SPOT (GWh)", "compra-energia-spot-gwh", "GWh", "Energía comprada en el mercado spot", "area"),
    ("Precio Medio de Compra de Energía SPOT (cUSD/kWh)", "precio-medio-compra-energia-spot", "cUSD/kWh", "Precio medio de compra en mercado spot", "line"),
    ("Factura por Compra de Energía SPOT (USD MM)", "factura-compra-energia-spot-usd-mm", "USD MM", "Monto facturado por compra en mercado spot", "bar"),
    ("Energía Facturada (GWh)", "energia-facturada-gwh", "GWh", "Energía total facturada a clientes", "area"),
    ("Precio Medio de Venta de Energía (cUSD/kWh)", "precio-medio-venta-energia-cusd-kwh", "cUSD/kWh", "Precio medio de venta de energía en dólares", "line"),
    ("Precio Medio de Venta de Energía (DOP/kWh)", "precio-medio-venta-energia-dop-kwh", "DOP/kWh", "Precio medio de venta de energía en pesos", "line"),
    ("Factura por Venta de Energía (USD MM)", "factura-venta-energia-usd-mm", "USD MM", "Monto total facturado por venta de energía en dólares", "bar"),
    ("Factura por Venta de Energía (DOP MM)", "factura-venta-energia-dop-mm", "DOP MM", "Monto total facturado por venta de energía en pesos", "bar"),
    ("Energía Cobrada (GWh)", "energia-cobrada-gwh", "GWh", "Energía efectivamente cobrada", "area"),
    ("Cobros por Energía (USD MM)", "cobros-energia-usd-mm", "USD MM", "Cobros por concepto de energía en dólares", "bar"),
    ("Cobros por Energía (DOP MM)", "cobros-energia-dop-mm", "DOP MM", "Cobros por concepto de energía en pesos", "bar"),
    ("FETE (USD MM)", "fete-usd-mm", "USD MM", "Fondo de Estabilización Tarifaria Eléctrica", "bar"),
    ("Otros Cobros (USD MM)", "otros-cobros-usd-mm", "USD MM", "Otros cobros distintos a energía y FETE", "bar"),
    ("Otros Ingresos (USD MM)", "otros-ingresos-edes-usd-mm", "USD MM", "Otros ingresos de las EDEs", "bar"),
    ("Gastos Operativos (USD MM)", "gastos-operativos-edes-usd-mm", "USD MM", "Total gastos operativos de las EDEs", "bar"),
    ("Gastos de Personal (USD MM)", "gastos-personal-edes-usd-mm", "USD MM", "Gastos de personal de las EDEs", "bar"),
    ("Proveedores (USD MM)", "proveedores-edes-usd-mm", "USD MM", "Pagos a proveedores de las EDEs", "bar"),
    ("Impuestos (USD MM)", "impuestos-edes-usd-mm", "USD MM", "Pagos de impuestos de las EDEs", "bar"),
    ("Pagos a Instituciones Regulatorias (USD MM)", "pagos-inst-regulatorias-edes-usd-mm", "USD MM", "Pagos a instituciones regulatorias", "bar"),
    ("Pagos Ayuntamientos y compensaciones (USD MM)", "pagos-ayuntamientos-edes-usd-mm", "USD MM", "Pagos a ayuntamientos y compensaciones", "bar"),
    ("Otros Gastos (USD MM)", "otros-gastos-edes-usd-mm", "USD MM", "Otros gastos operativos de las EDEs", "bar"),
    ("Gastos Financieros (USD MM)", "gastos-financieros-edes-usd-mm", "USD MM", "Gastos financieros de las EDEs", "bar"),
    ("Inversiones Total (USD MM)", "inversiones-total-edes-usd-mm", "USD MM", "Total inversiones de las EDEs", "bar"),
    ("Pérdidas (GWh)", "perdidas-gwh", "GWh", "Energía perdida en el sistema de distribución", "bar"),
    ("Pérdidas (%)", "perdidas-porcentaje", "%", "Porcentaje de pérdidas de energía", "line"),
    ("Pérdidas - Año Móvil (%)", "perdidas-ano-movil-porcentaje", "%", "Porcentaje de pérdidas en año móvil", "line"),
    ("Cobranzas (%)", "cobranzas-porcentaje", "%", "Porcentaje de cobranza", "line"),
    ("Cobranzas - Año Móvil (%)", "cobranzas-ano-movil-porcentaje", "%", "Porcentaje de cobranza en año móvil", "line"),
    ("CRI (%)", "cri-porcentaje", "%", "Índice de Recuperación de Cartera", "line"),
    ("CRI - Año Móvil (%)", "cri-ano-movil-porcentaje", "%", "Índice de Recuperación de Cartera en año móvil", "line"),
    ("Índice de Recuperación de Energía (%)", "ire-porcentaje", "%", "Proporción de energía cobrada vs facturada", "line"),
    ("Índice de Recuperación de Energía - Año Móvil (%)", "ire-ano-movil-porcentaje", "%", "IRE en año móvil", "line"),
    ("Cantidad de Clientes Facturados", "clientes-facturados", "clientes", "Número de clientes con factura emitida", "bar"),
    ("Cantidad de Clientes Bonoluz", "clientes-bonoluz", "clientes", "Número de clientes en el programa Bonoluz", "bar"),
    ("Disponibilidad", "disponibilidad-edes", "ratio", "Índice de disponibilidad del servicio eléctrico", "gauge"),
    ("Cantidad de Empleados EDE's", "empleados-edes", "empleados", "Total de empleados de las EDEs", "bar"),
]

sort = 1
for name, slug, unit, desc, chart in edes_indicators:
    # Parent (Total EDEs)
    lines.append(f"""INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   '{sql_escape(name)}', '{slug}', '{sql_escape(unit)}', '{sql_escape(desc)}', '{chart}', false,
   (SELECT id FROM entities WHERE slug = 'edes-consolidado'), {sort})
ON CONFLICT (slug) DO NOTHING;""")
    
    # Breakdowns: Edenorte, Edesur, Edeeste
    for ede, ede_slug in [('Edenorte', 'edenorte'), ('Edesur', 'edesur'), ('Edeeste', 'edeeste')]:
        child_slug = f"{slug}-{ede_slug}"
        child_name = f"{name.split('(')[0].strip()} - {ede}"
        lines.append(f"""INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   '{sql_escape(child_name)}', '{child_slug}', '{sql_escape(unit)}', '{sql_escape(desc)} - {ede}', '{chart}', true,
   (SELECT id FROM entities WHERE slug = '{ede_slug}'),
   (SELECT id FROM indicators WHERE slug = '{slug}'), {sort})
ON CONFLICT (slug) DO NOTHING;""")
    
    sort += 1
    if sort % 5 == 0:
        lines.append("")

lines.append("")

# ============================================================
# 4. CDEEE indicators
# ============================================================
lines.append("-- ============================================================")
lines.append("-- CDEEE: Indicadores principales y desgloses")
lines.append("-- ============================================================")

cdeee_main = [
    # (name, slug, unit, desc, chart, has_breakdowns, breakdown_entities)
    ("Energía Comprada (GWh)", "cdeee-energia-comprada-gwh", "GWh",
     "Energía total comprada por CDEEE", "area", True,
     ['gsf','cespm','dpp','egehaina-larimar','electronic-jrc','montecristi-solar',
      'c-power','pecasa','matafongo','wcg-energy','emerald-solar','poseidon',
      'quisqueya-ii','egehid','falcondo','rsj','mercado-spot']),

    ("Precio Medio de Compra (USCents/KWh)", "cdeee-precio-medio-compra", "USCents/KWh",
     "Precio medio ponderado de compra de energía CDEEE", "line", False, []),

    ("Factura por Compra de Energía (US$ MM)", "cdeee-factura-compra-energia", "US$ MM",
     "Monto facturado por compra de energía CDEEE", "bar", True,
     ['gsf','cespm','dpp','egehaina-larimar','electronic-jrc','montecristi-solar',
      'c-power','pecasa','matafongo','wcg-energy','emerald-solar','poseidon',
      'quisqueya-ii','egehid','falcondo','rsj','mercado-spot']),

    ("Total de Energía Facturada (GWh)", "cdeee-energia-facturada-gwh", "GWh",
     "Energía facturada por CDEEE a sus clientes", "area", True,
     ['edenorte','edesur','edeeste','mercado-spot']),

    ("Precio Medio de Venta (USCents/KWh)", "cdeee-precio-medio-venta", "USCents/KWh",
     "Precio medio de venta de energía CDEEE", "line", False, []),

    ("Total Facturado (US$ MM)", "cdeee-total-facturado-usd-mm", "US$ MM",
     "Total facturado por CDEEE", "bar", True,
     ['edenorte','edesur','edeeste','mercado-spot']),

    ("Otros Ingresos (US$ MM)", "cdeee-otros-ingresos-usd-mm", "US$ MM",
     "Otros ingresos de CDEEE", "bar", False, []),

    ("Gastos Operativos (US$ MM)", "cdeee-gastos-operativos-usd-mm", "US$ MM",
     "Total gastos operativos de CDEEE", "bar", True,
     []),  # sub-items are text descriptions, not entities

    ("Egresos Financieros (US$ MM)", "cdeee-egresos-financieros-usd-mm", "US$ MM",
     "Egresos financieros de CDEEE", "bar", False, []),

    ("Inversiones (US$ MM)", "cdeee-inversiones-usd-mm", "US$ MM",
     "Total inversiones de CDEEE", "bar", False, []),

    ("Cantidad de Empleados CDEEE", "cdeee-empleados", "empleados",
     "Total empleados de CDEEE y sus unidades", "bar", False, []),
]

# CDEEE Gastos Operativos sub-items (not entities, just breakdown names)
cdeee_opex_breakdown = [
    ("Gastos de Personal", "cdeee-gastos-personal"),
    ("Servicios No Personales", "cdeee-servicios-no-personales"),
    ("Materiales y Suministros", "cdeee-materiales-suministros"),
    ("Otros Gastos (Incluye Pagos a Instituciones Regulatorias)", "cdeee-otros-gastos"),
]

# CDEEE Empleados sub-items
cdeee_empleados_breakdown = [
    ("CDEEE-Punta Catalina", "cdeee-empleados-punta-catalina"),
    ("UERS", "cdeee-empleados-uers"),
    ("PSB", "cdeee-empleados-psb"),
    ("PRA", "cdeee-empleados-pra"),
    ("GPIP", "cdeee-empleados-gpip"),
    ("Dieta Militares", "cdeee-empleados-dieta-militares"),
]

sort = 1
for name, slug, unit, desc, chart, has_ent_breakdown, ent_list in cdeee_main:
    lines.append(f"""INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'cdeee'),
   '{sql_escape(name)}', '{slug}', '{sql_escape(unit)}', '{sql_escape(desc)}', '{chart}', false,
   (SELECT id FROM entities WHERE slug = 'cdeee'), {sort})
ON CONFLICT (slug) DO NOTHING;""")

    # Entity breakdowns
    for ent_slug in ent_list:
        ent_name_map = {
            'gsf': 'GSF', 'cespm': 'CESPM', 'dpp': 'DPP',
            'egehaina-larimar': 'EgeHaina (Larimar) II', 'electronic-jrc': 'Electronic JRC',
            'montecristi-solar': 'Montecristi Solar F.V.', 'c-power': 'C Power DR Operations',
            'pecasa': 'PECASA', 'matafongo': 'Matafongo', 'wcg-energy': 'WCG Energy Ltd',
            'emerald-solar': 'Emerald Solar', 'poseidon': 'Poseidón',
            'quisqueya-ii': 'Quisqueya II', 'egehid': 'EGEHID',
            'falcondo': 'FALCONDO', 'rsj': 'RSJ', 'mercado-spot': 'Mercado Spot',
            'edenorte': 'Edenorte', 'edesur': 'Edesur', 'edeeste': 'Edeeste',
        }
        ent_display = ent_name_map.get(ent_slug, ent_slug.replace('-', ' ').title())
        child_slug = f"{slug}-{ent_slug}"
        child_name = f"{name.split('(')[0].strip()} - {ent_display}"
        lines.append(f"""INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'cdeee'),
   '{sql_escape(child_name)}', '{child_slug}', '{sql_escape(unit)}', '{sql_escape(desc)} - {ent_display}', '{chart}', true,
   (SELECT id FROM entities WHERE slug = '{ent_slug}'),
   (SELECT id FROM indicators WHERE slug = '{slug}'), {sort})
ON CONFLICT (slug) DO NOTHING;""")

    sort += 1

# Add CDEEE Gastos Operativos text breakdowns (no entity_id)
for sub_name, sub_slug in cdeee_opex_breakdown:
    lines.append(f"""INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'cdeee'),
   '{sql_escape(sub_name)}', '{sub_slug}', 'US$ MM', 'Desglose de gastos operativos CDEEE', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'cdeee-gastos-operativos-usd-mm'), 8)
ON CONFLICT (slug) DO NOTHING;""")

# Add CDEEE Empleados text breakdowns
for sub_name, sub_slug in cdeee_empleados_breakdown:
    lines.append(f"""INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'cdeee'),
   '{sql_escape(sub_name)}', '{sub_slug}', 'empleados', 'Desglose de empleados CDEEE', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'cdeee-empleados'), 11)
ON CONFLICT (slug) DO NOTHING;""")

lines.append("")

# ============================================================
# 5. EGEHID indicators
# ============================================================
lines.append("-- ============================================================")
lines.append("-- EGEHID: Indicadores principales y desgloses")
lines.append("-- ============================================================")

egehid_main = [
    ("Energía Facturada (GWh)", "egehid-energia-facturada-gwh", "GWh",
     "Energía facturada por EGEHID", "area", True,
     [('CDEEE', 'cdeee'), ("EDE's", 'edes'), ("GenCo's", 'mercado-spot'), ('UNR', 'mercado-spot'), ('Mercado Spot', 'mercado-spot')]),
    # Note: Mercado Contratos sub-items aren't separate entities. We'll use text breakdowns
    ("Precio Medio de Venta de Energía (cUSD/kWh)", "egehid-precio-medio-venta", "cUSD/kWh",
     "Precio medio de venta de energía de EGEHID", "line", False, []),
    ("Factura por Venta de Energía (USD MM)", "egehid-factura-venta-energia", "USD MM",
     "Monto facturado por venta de energía de EGEHID", "bar", True,
     [('CDEEE', 'cdeee'), ("EDE's", 'edes'), ("GenCo's", 'mercado-spot'), ('UNR', 'mercado-spot'), ('Mercado Spot', 'mercado-spot')]),
    ("Otros Ingresos (USD MM)", "egehid-otros-ingresos", "USD MM",
     "Otros ingresos de EGEHID", "bar", False, []),
    ("Gastos Operativos (USD MM)", "egehid-gastos-operativos", "USD MM",
     "Total gastos operativos de EGEHID", "bar", True, []),
    ("Egresos Financieros (USD MM)", "egehid-egresos-financieros", "USD MM",
     "Egresos financieros de EGEHID", "bar", False, []),
    ("Inversiones (USD MM)", "egehid-inversiones", "USD MM",
     "Total inversiones de EGEHID", "bar", False, []),
    ("Cantidad de Empleados EGEHID", "egehid-empleados", "empleados",
     "Total empleados de EGEHID", "bar", False, []),
]

# EGEHID Mercado Contratos breakdowns (text-based, not entity-linked for market segments)
egehid_mercado_breakdown_energy = [
    ("Mercado de Contratos", "egehid-energia-mercado-contratos"),
    ("CDEEE", "egehid-energia-cdeee"),
    ("EDE's", "egehid-energia-edes"),
    ("GenCo's", "egehid-energia-gencos"),
    ("UNR", "egehid-energia-unr"),
    ("Mercado Spot", "egehid-energia-mercado-spot"),
]

egehid_mercado_breakdown_factura = [
    ("Mercado de Contratos", "egehid-factura-mercado-contratos"),
    ("CDEEE", "egehid-factura-cdeee"),
    ("EDE's", "egehid-factura-edes"),
    ("GenCo's", "egehid-factura-gencos"),
    ("UNR", "egehid-factura-unr"),
    ("Mercado Spot", "egehid-factura-mercado-spot"),
]

egehid_opex_breakdown = [
    ("Gastos de Personal", "egehid-gastos-personal"),
    ("Servicios No Personales", "egehid-servicios-no-personales"),
    ("Materiales y Suministros", "egehid-materiales-suministros"),
    ("Otros Gastos", "egehid-otros-gastos"),
]

sort = 1
for name, slug, unit, desc, chart, has_bd, bd_list in egehid_main:
    lines.append(f"""INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'egehid'),
   '{sql_escape(name)}', '{slug}', '{sql_escape(unit)}', '{sql_escape(desc)}', '{chart}', false,
   (SELECT id FROM entities WHERE slug = 'egehid'), {sort})
ON CONFLICT (slug) DO NOTHING;""")
    sort += 1

# EGEHID: Mercado breakdowns for Energía Facturada
for sub_name, sub_slug in egehid_mercado_breakdown_energy:
    lines.append(f"""INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'egehid'),
   '{sql_escape(sub_name)}', '{sub_slug}', 'GWh', 'Desglose de energía facturada EGEHID', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'egehid-energia-facturada-gwh'), 1)
ON CONFLICT (slug) DO NOTHING;""")

# EGEHID: Mercado breakdowns for Factura Venta
for sub_name, sub_slug in egehid_mercado_breakdown_factura:
    lines.append(f"""INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'egehid'),
   '{sql_escape(sub_name)}', '{sub_slug}', 'USD MM', 'Desglose de factura por venta EGEHID', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'egehid-factura-venta-energia'), 3)
ON CONFLICT (slug) DO NOTHING;""")

# EGEHID: Opex breakdowns
for sub_name, sub_slug in egehid_opex_breakdown:
    lines.append(f"""INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'egehid'),
   '{sql_escape(sub_name)}', '{sub_slug}', 'USD MM', 'Desglose de gastos operativos EGEHID', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'egehid-gastos-operativos'), 5)
ON CONFLICT (slug) DO NOTHING;""")

lines.append("")

# ============================================================
# 6. ETED indicators
# ============================================================
lines.append("-- ============================================================")
lines.append("-- ETED: Indicadores principales y desgloses")
lines.append("-- ============================================================")

eted_indicators = [
    ("Peaje Total (USD MM)", "eted-peaje-total-usd-mm", "USD MM",
     "Total peaje de transmisión de ETED", "bar", True),
    ("Otros Ingresos (USD MM)", "eted-otros-ingresos", "USD MM",
     "Otros ingresos de ETED", "bar", False),
    ("Gastos Operativos (US$ MM)", "eted-gastos-operativos", "US$ MM",
     "Total gastos operativos de ETED", "bar", True),
    ("Egresos Financieros (USD MM)", "eted-egresos-financieros", "USD MM",
     "Egresos financieros de ETED", "bar", False),
    ("Inversiones (USD MM)", "eted-inversiones", "USD MM",
     "Total inversiones de ETED", "bar", False),
    ("Total Empleados ETED", "eted-empleados", "empleados",
     "Total empleados de ETED", "bar", False),
]

eted_peaje_breakdown = [
    ("Derecho de Uso", "eted-derecho-uso"),
    ("Derecho de Conexión", "eted-derecho-conexion"),
]

eted_opex_breakdown = [
    ("Gastos de Personal", "eted-gastos-personal"),
    ("Servicios No Personales", "eted-servicios-no-personales"),
    ("Materiales y Suministros", "eted-materiales-suministros"),
    ("Otros Gastos", "eted-otros-gastos"),
]

sort = 1
for name, slug, unit, desc, chart, has_bd in eted_indicators:
    lines.append(f"""INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'eted'),
   '{sql_escape(name)}', '{slug}', '{sql_escape(unit)}', '{sql_escape(desc)}', '{chart}', false,
   (SELECT id FROM entities WHERE slug = 'eted'), {sort})
ON CONFLICT (slug) DO NOTHING;""")
    sort += 1

# ETED Peaje breakdowns
for sub_name, sub_slug in eted_peaje_breakdown:
    lines.append(f"""INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'eted'),
   '{sql_escape(sub_name)}', '{sub_slug}', 'USD MM', 'Desglose del peaje total ETED', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'eted-peaje-total-usd-mm'), 1)
ON CONFLICT (slug) DO NOTHING;""")

# ETED Opex breakdowns
for sub_name, sub_slug in eted_opex_breakdown:
    lines.append(f"""INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'eted'),
   '{sql_escape(sub_name)}', '{sub_slug}', 'US$ MM', 'Desglose de gastos operativos ETED', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'eted-gastos-operativos'), 3)
ON CONFLICT (slug) DO NOTHING;""")

lines.append("")

# ============================================================
# 7. EGPC / Punta Catalina indicators
# ============================================================
lines.append("-- ============================================================")
lines.append("-- EGPC / Punta Catalina: Indicadores principales y desgloses")
lines.append("-- ============================================================")

egpc_main = [
    ("Total de Energía Facturada (GWh)", "egpc-energia-facturada-gwh", "GWh",
     "Energía facturada por EGPC Punta Catalina", "area"),
    ("Precio Medio de Venta (cUSD/KWh)", "egpc-precio-medio-venta", "cUSD/KWh",
     "Precio medio de venta de energía de EGPC", "line"),
    ("Total Facturado (USD MM)", "egpc-total-facturado", "USD MM",
     "Total facturado por EGPC Punta Catalina", "bar"),
    ("Total Costos de Producción (USD MM)", "egpc-costos-produccion", "USD MM",
     "Total costos de producción de EGPC", "bar"),
    ("Total Gastos Operativos (USD MM)", "egpc-gastos-operativos", "USD MM",
     "Total gastos operativos de EGPC", "bar"),
    ("Gastos de Depreciación y Amortización (USD MM)", "egpc-depreciacion-amortizacion", "USD MM",
     "Gastos de depreciación y amortización de EGPC", "bar"),
    ("Total Gastos Financieros (USD MM)", "egpc-gastos-financieros", "USD MM",
     "Total gastos financieros de EGPC", "bar"),
    ("Total Otros Ingresos (USD MM)", "egpc-otros-ingresos", "USD MM",
     "Total otros ingresos de EGPC", "bar"),
    ("Total Otros Gastos (USD MM)", "egpc-otros-gastos", "USD MM",
     "Total otros gastos de EGPC", "bar"),
    ("Total Inversiones (USD MM)", "egpc-inversiones", "USD MM",
     "Total inversiones de EGPC", "bar"),
    ("Cantidad de Empleados EGEPC", "egpc-empleados", "empleados",
     "Total empleados de EGPC Punta Catalina", "bar"),
]

egpc_energia_breakdown = [
    ("Mercado de Contratos", "egpc-energia-mercado-contratos"),
    ("Edenorte", "egpc-energia-edenorte"),
    ("Edesur", "egpc-energia-edesur"),
    ("Edeeste", "egpc-energia-edeeste"),
    ("Mercado Spot", "egpc-energia-mercado-spot"),
]

egpc_facturado_breakdown = [
    ("Mercado de Contratos", "egpc-facturado-mercado-contratos"),
    ("Edenorte", "egpc-facturado-edenorte"),
    ("Edesur", "egpc-facturado-edesur"),
    ("Edeeste", "egpc-facturado-edeeste"),
    ("Mercado Spot", "egpc-facturado-mercado-spot"),
]

egpc_costos_breakdown = [
    ("Costos Directos", "egpc-costos-directos"),
    ("Cargos del Mercado Eléctrico Mayorista", "egpc-cargos-mem"),
    ("Costos Personal Producción", "egpc-costos-personal-produccion"),
    ("Otros Costos Operativos de Producción", "egpc-otros-costos-produccion"),
]

egpc_opex_breakdown = [
    ("Gastos de Personal", "egpc-gastos-personal"),
    ("Servicios No Personales", "egpc-servicios-no-personales"),
    ("Materiales y Suministros", "egpc-materiales-suministros"),
    ("Gastos por Aporte Sector Eléctrico", "egpc-gastos-aporte-sector"),
]

egpc_empleados_breakdown = [
    ("Empleados Fijos", "egpc-empleados-fijos"),
    ("Dieta Militares", "egpc-empleados-dieta-militares"),
]

sort = 1
for name, slug, unit, desc, chart in egpc_main:
    lines.append(f"""INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'egpc-punta-catalina'),
   '{sql_escape(name)}', '{slug}', '{sql_escape(unit)}', '{sql_escape(desc)}', '{chart}', false,
   (SELECT id FROM entities WHERE slug = 'egpc'), {sort})
ON CONFLICT (slug) DO NOTHING;""")
    sort += 1

# EGPC breakdowns
for sub_name, sub_slug in egpc_energia_breakdown:
    lines.append(f"""INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'egpc-punta-catalina'),
   '{sql_escape(sub_name)}', '{sub_slug}', 'GWh', 'Desglose de energía facturada EGPC', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'egpc-energia-facturada-gwh'), 1)
ON CONFLICT (slug) DO NOTHING;""")

for sub_name, sub_slug in egpc_facturado_breakdown:
    lines.append(f"""INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'egpc-punta-catalina'),
   '{sql_escape(sub_name)}', '{sub_slug}', 'USD MM', 'Desglose de facturación EGPC', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'egpc-total-facturado'), 3)
ON CONFLICT (slug) DO NOTHING;""")

for sub_name, sub_slug in egpc_costos_breakdown:
    lines.append(f"""INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'egpc-punta-catalina'),
   '{sql_escape(sub_name)}', '{sub_slug}', 'USD MM', 'Desglose de costos de producción EGPC', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'egpc-costos-produccion'), 4)
ON CONFLICT (slug) DO NOTHING;""")

for sub_name, sub_slug in egpc_opex_breakdown:
    lines.append(f"""INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'egpc-punta-catalina'),
   '{sql_escape(sub_name)}', '{sub_slug}', 'USD MM', 'Desglose de gastos operativos EGPC', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'egpc-gastos-operativos'), 5)
ON CONFLICT (slug) DO NOTHING;""")

for sub_name, sub_slug in egpc_empleados_breakdown:
    lines.append(f"""INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'egpc-punta-catalina'),
   '{sql_escape(sub_name)}', '{sub_slug}', 'empleados', 'Desglose de empleados EGPC', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'egpc-empleados'), 11)
ON CONFLICT (slug) DO NOTHING;""")

lines.append("")

# ============================================================
# 8. Anexo Res Financieros (simplified - key indicators per entity)
# ============================================================
lines.append("-- ============================================================")
lines.append("-- RESULTADOS FINANCIEROS: Indicadores clave por entidad")
lines.append("-- (Versión simplificada: indicadores principales, no las 57 filas completas)")
lines.append("-- ============================================================")

# Key financial indicators common to most entities
res_fin_indicators = [
    "Total Ingresos",
    "Ingresos por Venta de Energía",
    "Total Gastos",
    "Compra de Energía",
    "Gastos Operativos (OPEX)",
    "Gastos Financieros",
    "Balance Operacional",
    "Inversiones (CAPEX)",
    "Balance con Inversiones",
    "Financiamiento",
    "Balance luego de Financiamiento",
]

# Entities in this sheet and their slugs
res_fin_entities = [
    ("EDEs Total", "edes-consolidado"),
    ("Edenorte", "edenorte"),
    ("Edesur", "edesur"),
    ("Edeeste", "edeeste"),
    ("EGEHID", "egehid"),
    ("ETED", "eted"),
    ("EGEPC", "egpc"),
]

sort = 1
for ind_name in res_fin_indicators:
    ind_slug_base = slugify(ind_name)
    # Parent (EDEs Total)
    full_slug = f"rf-{ind_slug_base}"
    lines.append(f"""INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'resultados-financieros'),
   '{sql_escape(ind_name)}', '{full_slug}', 'USD MM',
   '{sql_escape(ind_name)} — Resultados Financieros', 'bar', false,
   (SELECT id FROM entities WHERE slug = 'edes-consolidado'), {sort})
ON CONFLICT (slug) DO NOTHING;""")

    # Breakdown by entity (skip EDEs Total which is the parent)
    for ent_name, ent_slug in res_fin_entities[1:]:
        child_slug = f"rf-{ind_slug_base}-{ent_slug}"
        child_name = f"{ind_name} - {ent_name}"
        lines.append(f"""INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'resultados-financieros'),
   '{sql_escape(child_name)}', '{child_slug}', 'USD MM',
   '{sql_escape(ind_name)} - {ent_name}', 'bar', true,
   (SELECT id FROM entities WHERE slug = '{ent_slug}'),
   (SELECT id FROM indicators WHERE slug = '{full_slug}'), {sort})
ON CONFLICT (slug) DO NOTHING;""")
    
    sort += 1

lines.append("")

# ============================================================
# 9. Anexo Deuda (simplified - main debt totals)
# ============================================================
lines.append("-- ============================================================")
lines.append("-- DEUDA CON GENERADORAS: Indicadores principales")
lines.append("-- (Versión simplificada: totales por entidad)")
lines.append("-- ============================================================")

deuda_indicators = [
    ("Deuda Corriente Total EDEs (USD MM)", "deuda-corriente-total-edes", "edes-consolidado"),
    ("Deuda Corriente Edenorte (USD MM)", "deuda-corriente-edenorte", "edenorte"),
    ("Deuda Corriente Edesur (USD MM)", "deuda-corriente-edesur", "edesur"),
    ("Deuda Corriente Edeeste (USD MM)", "deuda-corriente-edeeste", "edeeste"),
    ("Deuda Corriente CDEEE (USD MM)", "deuda-corriente-cdeee", "cdeee"),
    ("Deuda Congelada Total (USD MM)", "deuda-congelada-total", None),
    ("Pagos por Compra de Energía - Generadores Privados (USD MM)", "pagos-generadores-privados", None),
    ("Pagos por Compra de Energía - CDEEE/EGEHID/ETED (USD MM)", "pagos-cdeee-egehid-eted", None),
]

sort = 1
for name, slug, ent_slug in deuda_indicators:
    ent_clause = f"(SELECT id FROM entities WHERE slug = '{ent_slug}')" if ent_slug else "NULL"
    lines.append(f"""INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'deuda-generadoras'),
   '{sql_escape(name)}', '{slug}', 'USD MM',
   '{sql_escape(name)}', 'bar', false, {ent_clause}, {sort})
ON CONFLICT (slug) DO NOTHING;""")
    sort += 1

lines.append("")

# ============================================================
# 10. Nuevo Régimen Tarifario
# ============================================================
lines.append("-- ============================================================")
lines.append("-- NUEVO RÉGIMEN TARIFARIO: Cargos por tarifa y concepto")
lines.append("-- ============================================================")

tarifas = [
    ("BTS1", "BTS1 - Baja Tensión Servicio 1 (Residencial)", [
        ("Cargo Fijo (0-100 kWh)", "cargo-fijo-0-100"),
        ("Cargo Fijo (101+ kWh)", "cargo-fijo-101-mas"),
        ("Cargo por Energía (0-200 kWh)", "cargo-energia-0-200"),
        ("Cargo por Energía (201-300 kWh)", "cargo-energia-201-300"),
        ("Cargo por Energía (301-700 kWh)", "cargo-energia-301-700"),
        ("Cargo por Energía (701+ kWh)", "cargo-energia-701-mas"),
    ]),
    ("BTS2", "BTS2 - Baja Tensión Servicio 2 (Residencial)", [
        ("Cargo Fijo", "cargo-fijo"),
        ("Cargo por Energía (0-200 kWh)", "cargo-energia-0-200"),
        ("Cargo por Energía (201-300 kWh)", "cargo-energia-201-300"),
        ("Cargo por Energía (301-700 kWh)", "cargo-energia-301-700"),
        ("Cargo por Energía (701+ kWh)", "cargo-energia-701-mas"),
    ]),
    ("BTD", "BTD - Baja Tensión Demanda (Comercial)", [
        ("Cargo Fijo", "cargo-fijo"),
        ("Energía", "energia"),
        ("Potencia Máxima", "potencia-maxima"),
    ]),
    ("BTH", "BTH - Baja Tensión Horaria (Comercial)", [
        ("Cargo Fijo", "cargo-fijo"),
        ("Energía", "energia"),
        ("Potencia Máxima fuera de punta", "potencia-maxima-fuera-punta"),
        ("Potencia Máxima en horas de punta", "potencia-maxima-horas-punta"),
    ]),
    ("MTD1", "MTD1 - Media Tensión Demanda 1 (Industrial)", [
        ("Cargo Fijo", "cargo-fijo"),
        ("Energía", "energia"),
        ("Potencia Máxima", "potencia-maxima"),
    ]),
    ("MTD2", "MTD2 - Media Tensión Demanda 2 (Industrial)", [
        ("Cargo Fijo", "cargo-fijo"),
        ("Energía", "energia"),
        ("Potencia Máxima", "potencia-maxima"),
    ]),
    ("MTH", "MTH - Media Tensión Horaria (Industrial)", [
        ("Cargo Fijo", "cargo-fijo"),
        ("Energía", "energia"),
        ("Potencia Máxima fuera de punta", "potencia-maxima-fuera-punta"),
        ("Potencia Máxima en horas de punta", "potencia-maxima-horas-punta"),
    ]),
]

sort = 1
for tarifa_code, tarifa_name, conceptos in tarifas:
    parent_slug = f"nt-{slugify(tarifa_code)}"
    lines.append(f"""INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'regimen-tarifario'),
   '{sql_escape(tarifa_name)}', '{parent_slug}', 'RD$',
   'Tarifa {tarifa_code} — Nuevo Régimen Tarifario', 'bar', false, {sort})
ON CONFLICT (slug) DO NOTHING;""")

    for concepto, concept_slug_base in conceptos:
        child_slug = f"nt-{slugify(tarifa_code)}-{concept_slug_base}"
        child_name = f"{tarifa_code} - {concepto}"
        lines.append(f"""INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'regimen-tarifario'),
   '{sql_escape(child_name)}', '{child_slug}', 'RD$',
   '{sql_escape(concepto)} - Tarifa {tarifa_code}', 'bar', true,
   (SELECT id FROM indicators WHERE slug = '{parent_slug}'), {sort})
ON CONFLICT (slug) DO NOTHING;""")

    sort += 1

lines.append("")

# ============================================================
# 11. Régimen Tarifario Anterior (same structure)
# ============================================================
lines.append("-- ============================================================")
lines.append("-- RÉGIMEN TARIFARIO ANTERIOR: Cargos por tarifa y concepto")
lines.append("-- ============================================================")

sort = 1
for tarifa_code, tarifa_name, conceptos in tarifas:
    parent_slug = f"at-{slugify(tarifa_code)}"
    lines.append(f"""INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'regimen-tarifario-anterior'),
   '{sql_escape(tarifa_name)}', '{parent_slug}', 'RD$',
   'Tarifa {tarifa_code} — Régimen Tarifario Anterior', 'bar', false, {sort})
ON CONFLICT (slug) DO NOTHING;""")

    for concepto, concept_slug_base in conceptos:
        child_slug = f"at-{slugify(tarifa_code)}-{concept_slug_base}"
        child_name = f"{tarifa_code} - {concepto}"
        lines.append(f"""INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'regimen-tarifario-anterior'),
   '{sql_escape(child_name)}', '{child_slug}', 'RD$',
   '{sql_escape(concepto)} - Tarifa {tarifa_code} (Anterior)', 'bar', true,
   (SELECT id FROM indicators WHERE slug = '{parent_slug}'), {sort})
ON CONFLICT (slug) DO NOTHING;""")

    sort += 1

lines.append("")
lines.append("-- ============================================================")
lines.append("-- FIN DEL SEED DE INDICADORES")
lines.append("-- ============================================================")

# Write to file
output_path = '/home/z/my-project/download/002_seed_indicators.sql'
sql_content = '\n'.join(lines)
with open(output_path, 'w', encoding='utf-8') as f:
    f.write(sql_content)

# Count indicators
import re
count = len(re.findall(r"INSERT INTO indicators", sql_content))
print(f"Generated {count} INSERT statements for indicators")
print(f"Output: {output_path}")
print(f"File size: {len(sql_content):,} bytes")
