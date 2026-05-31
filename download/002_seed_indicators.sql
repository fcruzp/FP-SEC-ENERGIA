-- ============================================================
-- SEED: Indicadores restantes (PASO 2)
-- Generado automáticamente desde análisis del XLS
-- ============================================================

-- ============================================================
-- NUEVA CATEGORÍA: Régimen Tarifario Anterior
-- ============================================================
INSERT INTO indicator_categories (name, slug, icon, color, description, source_sheet, sort_order) VALUES
  ('Régimen Tarifario Anterior', 'regimen-tarifario-anterior', 'FileText', '#A855F7',
   'Cargos tarifarios del régimen anterior por tipo de servicio y distribuidora',
   'Regimen tarifario anterior', 10)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- VARIABLES RELEVANTES: Indicadores faltantes
-- ============================================================
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'variables-relevantes'),
   'Gas Natural Conversion (US$/MMBTU)', 'gas-natural-conversion-usd-mmbtu', 'US$/MMBTU', 'Precio del gas natural convertido a equivalente por millón de BTU', 'line', 23)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'variables-relevantes'),
   'Composición Carbón Mineral (PP)', 'composicion-carbon-mineral-pp', 'PP', 'Participación porcentual del carbón mineral en la generación energética', 'bar', 24)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'variables-relevantes'),
   'Composición Gas Natural (PP)', 'composicion-gas-natural-pp', 'PP', 'Participación porcentual del gas natural en la generación energética', 'bar', 25)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'variables-relevantes'),
   'Composición Fuel Oil No. 2 (PP)', 'composicion-fuel-oil-2-pp', 'PP', 'Participación porcentual del Fuel Oil No. 2 en la generación energética', 'bar', 26)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'variables-relevantes'),
   'Composición Fuel Oil No. 6 (PP)', 'composicion-fuel-oil-6-pp', 'PP', 'Participación porcentual del Fuel Oil No. 6 en la generación energética', 'bar', 27)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'variables-relevantes'),
   'Composición Fuel Oil No. 2 y No. 6 (PP)', 'composicion-fuel-oil-2-y-6-pp', 'PP', 'Participación porcentual combinada del Fuel Oil No. 2 y No. 6 en la generación', 'bar', 28)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'variables-relevantes'),
   'Composición Hidráulica (PP)', 'composicion-hidraulica-pp', 'PP', 'Participación porcentual de la generación hidráulica', 'bar', 29)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'variables-relevantes'),
   'Composición Eólica (PP)', 'composicion-eolica-pp', 'PP', 'Participación porcentual de la generación eólica', 'bar', 30)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'variables-relevantes'),
   'Composición Solar Fotovoltaica (PP)', 'composicion-solar-fv-pp', 'PP', 'Participación porcentual de la generación solar fotovoltaica', 'bar', 31)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'variables-relevantes'),
   'Composición Biomasa (PP)', 'composicion-biomasa-pp', 'PP', 'Participación porcentual de la generación por biomasa', 'bar', 32)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'variables-relevantes'),
   'Composición Total Renovable No Convencional (PP)', 'composicion-total-renovable-no-convencional-pp', 'PP', 'Participación porcentual total de fuentes renovables no convencionales', 'line', 33)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'variables-relevantes'),
   'Generación Fuel Oil No. 2 y No. 6', 'generacion-fuel-oil-2-y-6', 'GWh', 'Generación combinada de energía a partir de Fuel Oil No. 2 y No. 6', 'bar', 34)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- EDE's: 42 indicadores principales + desglose por EDE
-- ============================================================
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Compra de Energía (GWh)', 'compra-energia-gwh', 'GWh', 'Energía comprada por las EDEs', 'area', false,
   (SELECT id FROM entities WHERE slug = 'edes-consolidado'), 1)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Compra de Energía - Edenorte', 'compra-energia-gwh-edenorte', 'GWh', 'Energía comprada por las EDEs - Edenorte', 'area', true,
   (SELECT id FROM entities WHERE slug = 'edenorte'),
   (SELECT id FROM indicators WHERE slug = 'compra-energia-gwh'), 1)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Compra de Energía - Edesur', 'compra-energia-gwh-edesur', 'GWh', 'Energía comprada por las EDEs - Edesur', 'area', true,
   (SELECT id FROM entities WHERE slug = 'edesur'),
   (SELECT id FROM indicators WHERE slug = 'compra-energia-gwh'), 1)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Compra de Energía - Edeeste', 'compra-energia-gwh-edeeste', 'GWh', 'Energía comprada por las EDEs - Edeeste', 'area', true,
   (SELECT id FROM entities WHERE slug = 'edeeste'),
   (SELECT id FROM indicators WHERE slug = 'compra-energia-gwh'), 1)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Precio Medio de Compra de Energía (cUSD/kWh)', 'precio-medio-compra-energia-cusd-kwh', 'cUSD/kWh', 'Precio medio ponderado de compra de energía', 'line', false,
   (SELECT id FROM entities WHERE slug = 'edes-consolidado'), 2)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Precio Medio de Compra de Energía - Edenorte', 'precio-medio-compra-energia-cusd-kwh-edenorte', 'cUSD/kWh', 'Precio medio ponderado de compra de energía - Edenorte', 'line', true,
   (SELECT id FROM entities WHERE slug = 'edenorte'),
   (SELECT id FROM indicators WHERE slug = 'precio-medio-compra-energia-cusd-kwh'), 2)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Precio Medio de Compra de Energía - Edesur', 'precio-medio-compra-energia-cusd-kwh-edesur', 'cUSD/kWh', 'Precio medio ponderado de compra de energía - Edesur', 'line', true,
   (SELECT id FROM entities WHERE slug = 'edesur'),
   (SELECT id FROM indicators WHERE slug = 'precio-medio-compra-energia-cusd-kwh'), 2)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Precio Medio de Compra de Energía - Edeeste', 'precio-medio-compra-energia-cusd-kwh-edeeste', 'cUSD/kWh', 'Precio medio ponderado de compra de energía - Edeeste', 'line', true,
   (SELECT id FROM entities WHERE slug = 'edeeste'),
   (SELECT id FROM indicators WHERE slug = 'precio-medio-compra-energia-cusd-kwh'), 2)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Factura por Compra de Energía (USD MM)', 'factura-compra-energia-usd-mm', 'USD MM', 'Monto total facturado por compra de energía', 'bar', false,
   (SELECT id FROM entities WHERE slug = 'edes-consolidado'), 3)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Factura por Compra de Energía - Edenorte', 'factura-compra-energia-usd-mm-edenorte', 'USD MM', 'Monto total facturado por compra de energía - Edenorte', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edenorte'),
   (SELECT id FROM indicators WHERE slug = 'factura-compra-energia-usd-mm'), 3)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Factura por Compra de Energía - Edesur', 'factura-compra-energia-usd-mm-edesur', 'USD MM', 'Monto total facturado por compra de energía - Edesur', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edesur'),
   (SELECT id FROM indicators WHERE slug = 'factura-compra-energia-usd-mm'), 3)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Factura por Compra de Energía - Edeeste', 'factura-compra-energia-usd-mm-edeeste', 'USD MM', 'Monto total facturado por compra de energía - Edeeste', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edeeste'),
   (SELECT id FROM indicators WHERE slug = 'factura-compra-energia-usd-mm'), 3)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Compra de Energía CONTRATOS (GWh)', 'compra-energia-contratos-gwh', 'GWh', 'Energía comprada bajo contratos', 'area', false,
   (SELECT id FROM entities WHERE slug = 'edes-consolidado'), 4)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Compra de Energía CONTRATOS - Edenorte', 'compra-energia-contratos-gwh-edenorte', 'GWh', 'Energía comprada bajo contratos - Edenorte', 'area', true,
   (SELECT id FROM entities WHERE slug = 'edenorte'),
   (SELECT id FROM indicators WHERE slug = 'compra-energia-contratos-gwh'), 4)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Compra de Energía CONTRATOS - Edesur', 'compra-energia-contratos-gwh-edesur', 'GWh', 'Energía comprada bajo contratos - Edesur', 'area', true,
   (SELECT id FROM entities WHERE slug = 'edesur'),
   (SELECT id FROM indicators WHERE slug = 'compra-energia-contratos-gwh'), 4)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Compra de Energía CONTRATOS - Edeeste', 'compra-energia-contratos-gwh-edeeste', 'GWh', 'Energía comprada bajo contratos - Edeeste', 'area', true,
   (SELECT id FROM entities WHERE slug = 'edeeste'),
   (SELECT id FROM indicators WHERE slug = 'compra-energia-contratos-gwh'), 4)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Precio Medio de Compra de Energía CONTRATOS (cUSD/kWh)', 'precio-medio-compra-energia-contratos', 'cUSD/kWh', 'Precio medio de compra bajo contratos', 'line', false,
   (SELECT id FROM entities WHERE slug = 'edes-consolidado'), 5)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Precio Medio de Compra de Energía CONTRATOS - Edenorte', 'precio-medio-compra-energia-contratos-edenorte', 'cUSD/kWh', 'Precio medio de compra bajo contratos - Edenorte', 'line', true,
   (SELECT id FROM entities WHERE slug = 'edenorte'),
   (SELECT id FROM indicators WHERE slug = 'precio-medio-compra-energia-contratos'), 5)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Precio Medio de Compra de Energía CONTRATOS - Edesur', 'precio-medio-compra-energia-contratos-edesur', 'cUSD/kWh', 'Precio medio de compra bajo contratos - Edesur', 'line', true,
   (SELECT id FROM entities WHERE slug = 'edesur'),
   (SELECT id FROM indicators WHERE slug = 'precio-medio-compra-energia-contratos'), 5)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Precio Medio de Compra de Energía CONTRATOS - Edeeste', 'precio-medio-compra-energia-contratos-edeeste', 'cUSD/kWh', 'Precio medio de compra bajo contratos - Edeeste', 'line', true,
   (SELECT id FROM entities WHERE slug = 'edeeste'),
   (SELECT id FROM indicators WHERE slug = 'precio-medio-compra-energia-contratos'), 5)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Factura por Compra de Energía CONTRATOS (USD MM)', 'factura-compra-energia-contratos-usd-mm', 'USD MM', 'Monto facturado por compra bajo contratos', 'bar', false,
   (SELECT id FROM entities WHERE slug = 'edes-consolidado'), 6)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Factura por Compra de Energía CONTRATOS - Edenorte', 'factura-compra-energia-contratos-usd-mm-edenorte', 'USD MM', 'Monto facturado por compra bajo contratos - Edenorte', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edenorte'),
   (SELECT id FROM indicators WHERE slug = 'factura-compra-energia-contratos-usd-mm'), 6)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Factura por Compra de Energía CONTRATOS - Edesur', 'factura-compra-energia-contratos-usd-mm-edesur', 'USD MM', 'Monto facturado por compra bajo contratos - Edesur', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edesur'),
   (SELECT id FROM indicators WHERE slug = 'factura-compra-energia-contratos-usd-mm'), 6)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Factura por Compra de Energía CONTRATOS - Edeeste', 'factura-compra-energia-contratos-usd-mm-edeeste', 'USD MM', 'Monto facturado por compra bajo contratos - Edeeste', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edeeste'),
   (SELECT id FROM indicators WHERE slug = 'factura-compra-energia-contratos-usd-mm'), 6)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Compra de Energía SPOT (GWh)', 'compra-energia-spot-gwh', 'GWh', 'Energía comprada en el mercado spot', 'area', false,
   (SELECT id FROM entities WHERE slug = 'edes-consolidado'), 7)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Compra de Energía SPOT - Edenorte', 'compra-energia-spot-gwh-edenorte', 'GWh', 'Energía comprada en el mercado spot - Edenorte', 'area', true,
   (SELECT id FROM entities WHERE slug = 'edenorte'),
   (SELECT id FROM indicators WHERE slug = 'compra-energia-spot-gwh'), 7)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Compra de Energía SPOT - Edesur', 'compra-energia-spot-gwh-edesur', 'GWh', 'Energía comprada en el mercado spot - Edesur', 'area', true,
   (SELECT id FROM entities WHERE slug = 'edesur'),
   (SELECT id FROM indicators WHERE slug = 'compra-energia-spot-gwh'), 7)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Compra de Energía SPOT - Edeeste', 'compra-energia-spot-gwh-edeeste', 'GWh', 'Energía comprada en el mercado spot - Edeeste', 'area', true,
   (SELECT id FROM entities WHERE slug = 'edeeste'),
   (SELECT id FROM indicators WHERE slug = 'compra-energia-spot-gwh'), 7)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Precio Medio de Compra de Energía SPOT (cUSD/kWh)', 'precio-medio-compra-energia-spot', 'cUSD/kWh', 'Precio medio de compra en mercado spot', 'line', false,
   (SELECT id FROM entities WHERE slug = 'edes-consolidado'), 8)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Precio Medio de Compra de Energía SPOT - Edenorte', 'precio-medio-compra-energia-spot-edenorte', 'cUSD/kWh', 'Precio medio de compra en mercado spot - Edenorte', 'line', true,
   (SELECT id FROM entities WHERE slug = 'edenorte'),
   (SELECT id FROM indicators WHERE slug = 'precio-medio-compra-energia-spot'), 8)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Precio Medio de Compra de Energía SPOT - Edesur', 'precio-medio-compra-energia-spot-edesur', 'cUSD/kWh', 'Precio medio de compra en mercado spot - Edesur', 'line', true,
   (SELECT id FROM entities WHERE slug = 'edesur'),
   (SELECT id FROM indicators WHERE slug = 'precio-medio-compra-energia-spot'), 8)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Precio Medio de Compra de Energía SPOT - Edeeste', 'precio-medio-compra-energia-spot-edeeste', 'cUSD/kWh', 'Precio medio de compra en mercado spot - Edeeste', 'line', true,
   (SELECT id FROM entities WHERE slug = 'edeeste'),
   (SELECT id FROM indicators WHERE slug = 'precio-medio-compra-energia-spot'), 8)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Factura por Compra de Energía SPOT (USD MM)', 'factura-compra-energia-spot-usd-mm', 'USD MM', 'Monto facturado por compra en mercado spot', 'bar', false,
   (SELECT id FROM entities WHERE slug = 'edes-consolidado'), 9)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Factura por Compra de Energía SPOT - Edenorte', 'factura-compra-energia-spot-usd-mm-edenorte', 'USD MM', 'Monto facturado por compra en mercado spot - Edenorte', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edenorte'),
   (SELECT id FROM indicators WHERE slug = 'factura-compra-energia-spot-usd-mm'), 9)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Factura por Compra de Energía SPOT - Edesur', 'factura-compra-energia-spot-usd-mm-edesur', 'USD MM', 'Monto facturado por compra en mercado spot - Edesur', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edesur'),
   (SELECT id FROM indicators WHERE slug = 'factura-compra-energia-spot-usd-mm'), 9)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Factura por Compra de Energía SPOT - Edeeste', 'factura-compra-energia-spot-usd-mm-edeeste', 'USD MM', 'Monto facturado por compra en mercado spot - Edeeste', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edeeste'),
   (SELECT id FROM indicators WHERE slug = 'factura-compra-energia-spot-usd-mm'), 9)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Energía Facturada (GWh)', 'energia-facturada-gwh', 'GWh', 'Energía total facturada a clientes', 'area', false,
   (SELECT id FROM entities WHERE slug = 'edes-consolidado'), 10)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Energía Facturada - Edenorte', 'energia-facturada-gwh-edenorte', 'GWh', 'Energía total facturada a clientes - Edenorte', 'area', true,
   (SELECT id FROM entities WHERE slug = 'edenorte'),
   (SELECT id FROM indicators WHERE slug = 'energia-facturada-gwh'), 10)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Energía Facturada - Edesur', 'energia-facturada-gwh-edesur', 'GWh', 'Energía total facturada a clientes - Edesur', 'area', true,
   (SELECT id FROM entities WHERE slug = 'edesur'),
   (SELECT id FROM indicators WHERE slug = 'energia-facturada-gwh'), 10)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Energía Facturada - Edeeste', 'energia-facturada-gwh-edeeste', 'GWh', 'Energía total facturada a clientes - Edeeste', 'area', true,
   (SELECT id FROM entities WHERE slug = 'edeeste'),
   (SELECT id FROM indicators WHERE slug = 'energia-facturada-gwh'), 10)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Precio Medio de Venta de Energía (cUSD/kWh)', 'precio-medio-venta-energia-cusd-kwh', 'cUSD/kWh', 'Precio medio de venta de energía en dólares', 'line', false,
   (SELECT id FROM entities WHERE slug = 'edes-consolidado'), 11)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Precio Medio de Venta de Energía - Edenorte', 'precio-medio-venta-energia-cusd-kwh-edenorte', 'cUSD/kWh', 'Precio medio de venta de energía en dólares - Edenorte', 'line', true,
   (SELECT id FROM entities WHERE slug = 'edenorte'),
   (SELECT id FROM indicators WHERE slug = 'precio-medio-venta-energia-cusd-kwh'), 11)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Precio Medio de Venta de Energía - Edesur', 'precio-medio-venta-energia-cusd-kwh-edesur', 'cUSD/kWh', 'Precio medio de venta de energía en dólares - Edesur', 'line', true,
   (SELECT id FROM entities WHERE slug = 'edesur'),
   (SELECT id FROM indicators WHERE slug = 'precio-medio-venta-energia-cusd-kwh'), 11)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Precio Medio de Venta de Energía - Edeeste', 'precio-medio-venta-energia-cusd-kwh-edeeste', 'cUSD/kWh', 'Precio medio de venta de energía en dólares - Edeeste', 'line', true,
   (SELECT id FROM entities WHERE slug = 'edeeste'),
   (SELECT id FROM indicators WHERE slug = 'precio-medio-venta-energia-cusd-kwh'), 11)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Precio Medio de Venta de Energía (DOP/kWh)', 'precio-medio-venta-energia-dop-kwh', 'DOP/kWh', 'Precio medio de venta de energía en pesos', 'line', false,
   (SELECT id FROM entities WHERE slug = 'edes-consolidado'), 12)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Precio Medio de Venta de Energía - Edenorte', 'precio-medio-venta-energia-dop-kwh-edenorte', 'DOP/kWh', 'Precio medio de venta de energía en pesos - Edenorte', 'line', true,
   (SELECT id FROM entities WHERE slug = 'edenorte'),
   (SELECT id FROM indicators WHERE slug = 'precio-medio-venta-energia-dop-kwh'), 12)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Precio Medio de Venta de Energía - Edesur', 'precio-medio-venta-energia-dop-kwh-edesur', 'DOP/kWh', 'Precio medio de venta de energía en pesos - Edesur', 'line', true,
   (SELECT id FROM entities WHERE slug = 'edesur'),
   (SELECT id FROM indicators WHERE slug = 'precio-medio-venta-energia-dop-kwh'), 12)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Precio Medio de Venta de Energía - Edeeste', 'precio-medio-venta-energia-dop-kwh-edeeste', 'DOP/kWh', 'Precio medio de venta de energía en pesos - Edeeste', 'line', true,
   (SELECT id FROM entities WHERE slug = 'edeeste'),
   (SELECT id FROM indicators WHERE slug = 'precio-medio-venta-energia-dop-kwh'), 12)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Factura por Venta de Energía (USD MM)', 'factura-venta-energia-usd-mm', 'USD MM', 'Monto total facturado por venta de energía en dólares', 'bar', false,
   (SELECT id FROM entities WHERE slug = 'edes-consolidado'), 13)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Factura por Venta de Energía - Edenorte', 'factura-venta-energia-usd-mm-edenorte', 'USD MM', 'Monto total facturado por venta de energía en dólares - Edenorte', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edenorte'),
   (SELECT id FROM indicators WHERE slug = 'factura-venta-energia-usd-mm'), 13)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Factura por Venta de Energía - Edesur', 'factura-venta-energia-usd-mm-edesur', 'USD MM', 'Monto total facturado por venta de energía en dólares - Edesur', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edesur'),
   (SELECT id FROM indicators WHERE slug = 'factura-venta-energia-usd-mm'), 13)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Factura por Venta de Energía - Edeeste', 'factura-venta-energia-usd-mm-edeeste', 'USD MM', 'Monto total facturado por venta de energía en dólares - Edeeste', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edeeste'),
   (SELECT id FROM indicators WHERE slug = 'factura-venta-energia-usd-mm'), 13)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Factura por Venta de Energía (DOP MM)', 'factura-venta-energia-dop-mm', 'DOP MM', 'Monto total facturado por venta de energía en pesos', 'bar', false,
   (SELECT id FROM entities WHERE slug = 'edes-consolidado'), 14)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Factura por Venta de Energía - Edenorte', 'factura-venta-energia-dop-mm-edenorte', 'DOP MM', 'Monto total facturado por venta de energía en pesos - Edenorte', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edenorte'),
   (SELECT id FROM indicators WHERE slug = 'factura-venta-energia-dop-mm'), 14)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Factura por Venta de Energía - Edesur', 'factura-venta-energia-dop-mm-edesur', 'DOP MM', 'Monto total facturado por venta de energía en pesos - Edesur', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edesur'),
   (SELECT id FROM indicators WHERE slug = 'factura-venta-energia-dop-mm'), 14)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Factura por Venta de Energía - Edeeste', 'factura-venta-energia-dop-mm-edeeste', 'DOP MM', 'Monto total facturado por venta de energía en pesos - Edeeste', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edeeste'),
   (SELECT id FROM indicators WHERE slug = 'factura-venta-energia-dop-mm'), 14)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Energía Cobrada (GWh)', 'energia-cobrada-gwh', 'GWh', 'Energía efectivamente cobrada', 'area', false,
   (SELECT id FROM entities WHERE slug = 'edes-consolidado'), 15)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Energía Cobrada - Edenorte', 'energia-cobrada-gwh-edenorte', 'GWh', 'Energía efectivamente cobrada - Edenorte', 'area', true,
   (SELECT id FROM entities WHERE slug = 'edenorte'),
   (SELECT id FROM indicators WHERE slug = 'energia-cobrada-gwh'), 15)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Energía Cobrada - Edesur', 'energia-cobrada-gwh-edesur', 'GWh', 'Energía efectivamente cobrada - Edesur', 'area', true,
   (SELECT id FROM entities WHERE slug = 'edesur'),
   (SELECT id FROM indicators WHERE slug = 'energia-cobrada-gwh'), 15)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Energía Cobrada - Edeeste', 'energia-cobrada-gwh-edeeste', 'GWh', 'Energía efectivamente cobrada - Edeeste', 'area', true,
   (SELECT id FROM entities WHERE slug = 'edeeste'),
   (SELECT id FROM indicators WHERE slug = 'energia-cobrada-gwh'), 15)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Cobros por Energía (USD MM)', 'cobros-energia-usd-mm', 'USD MM', 'Cobros por concepto de energía en dólares', 'bar', false,
   (SELECT id FROM entities WHERE slug = 'edes-consolidado'), 16)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Cobros por Energía - Edenorte', 'cobros-energia-usd-mm-edenorte', 'USD MM', 'Cobros por concepto de energía en dólares - Edenorte', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edenorte'),
   (SELECT id FROM indicators WHERE slug = 'cobros-energia-usd-mm'), 16)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Cobros por Energía - Edesur', 'cobros-energia-usd-mm-edesur', 'USD MM', 'Cobros por concepto de energía en dólares - Edesur', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edesur'),
   (SELECT id FROM indicators WHERE slug = 'cobros-energia-usd-mm'), 16)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Cobros por Energía - Edeeste', 'cobros-energia-usd-mm-edeeste', 'USD MM', 'Cobros por concepto de energía en dólares - Edeeste', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edeeste'),
   (SELECT id FROM indicators WHERE slug = 'cobros-energia-usd-mm'), 16)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Cobros por Energía (DOP MM)', 'cobros-energia-dop-mm', 'DOP MM', 'Cobros por concepto de energía en pesos', 'bar', false,
   (SELECT id FROM entities WHERE slug = 'edes-consolidado'), 17)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Cobros por Energía - Edenorte', 'cobros-energia-dop-mm-edenorte', 'DOP MM', 'Cobros por concepto de energía en pesos - Edenorte', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edenorte'),
   (SELECT id FROM indicators WHERE slug = 'cobros-energia-dop-mm'), 17)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Cobros por Energía - Edesur', 'cobros-energia-dop-mm-edesur', 'DOP MM', 'Cobros por concepto de energía en pesos - Edesur', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edesur'),
   (SELECT id FROM indicators WHERE slug = 'cobros-energia-dop-mm'), 17)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Cobros por Energía - Edeeste', 'cobros-energia-dop-mm-edeeste', 'DOP MM', 'Cobros por concepto de energía en pesos - Edeeste', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edeeste'),
   (SELECT id FROM indicators WHERE slug = 'cobros-energia-dop-mm'), 17)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'FETE (USD MM)', 'fete-usd-mm', 'USD MM', 'Fondo de Estabilización Tarifaria Eléctrica', 'bar', false,
   (SELECT id FROM entities WHERE slug = 'edes-consolidado'), 18)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'FETE - Edenorte', 'fete-usd-mm-edenorte', 'USD MM', 'Fondo de Estabilización Tarifaria Eléctrica - Edenorte', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edenorte'),
   (SELECT id FROM indicators WHERE slug = 'fete-usd-mm'), 18)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'FETE - Edesur', 'fete-usd-mm-edesur', 'USD MM', 'Fondo de Estabilización Tarifaria Eléctrica - Edesur', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edesur'),
   (SELECT id FROM indicators WHERE slug = 'fete-usd-mm'), 18)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'FETE - Edeeste', 'fete-usd-mm-edeeste', 'USD MM', 'Fondo de Estabilización Tarifaria Eléctrica - Edeeste', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edeeste'),
   (SELECT id FROM indicators WHERE slug = 'fete-usd-mm'), 18)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Otros Cobros (USD MM)', 'otros-cobros-usd-mm', 'USD MM', 'Otros cobros distintos a energía y FETE', 'bar', false,
   (SELECT id FROM entities WHERE slug = 'edes-consolidado'), 19)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Otros Cobros - Edenorte', 'otros-cobros-usd-mm-edenorte', 'USD MM', 'Otros cobros distintos a energía y FETE - Edenorte', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edenorte'),
   (SELECT id FROM indicators WHERE slug = 'otros-cobros-usd-mm'), 19)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Otros Cobros - Edesur', 'otros-cobros-usd-mm-edesur', 'USD MM', 'Otros cobros distintos a energía y FETE - Edesur', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edesur'),
   (SELECT id FROM indicators WHERE slug = 'otros-cobros-usd-mm'), 19)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Otros Cobros - Edeeste', 'otros-cobros-usd-mm-edeeste', 'USD MM', 'Otros cobros distintos a energía y FETE - Edeeste', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edeeste'),
   (SELECT id FROM indicators WHERE slug = 'otros-cobros-usd-mm'), 19)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Otros Ingresos (USD MM)', 'otros-ingresos-edes-usd-mm', 'USD MM', 'Otros ingresos de las EDEs', 'bar', false,
   (SELECT id FROM entities WHERE slug = 'edes-consolidado'), 20)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Otros Ingresos - Edenorte', 'otros-ingresos-edes-usd-mm-edenorte', 'USD MM', 'Otros ingresos de las EDEs - Edenorte', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edenorte'),
   (SELECT id FROM indicators WHERE slug = 'otros-ingresos-edes-usd-mm'), 20)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Otros Ingresos - Edesur', 'otros-ingresos-edes-usd-mm-edesur', 'USD MM', 'Otros ingresos de las EDEs - Edesur', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edesur'),
   (SELECT id FROM indicators WHERE slug = 'otros-ingresos-edes-usd-mm'), 20)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Otros Ingresos - Edeeste', 'otros-ingresos-edes-usd-mm-edeeste', 'USD MM', 'Otros ingresos de las EDEs - Edeeste', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edeeste'),
   (SELECT id FROM indicators WHERE slug = 'otros-ingresos-edes-usd-mm'), 20)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Gastos Operativos (USD MM)', 'gastos-operativos-edes-usd-mm', 'USD MM', 'Total gastos operativos de las EDEs', 'bar', false,
   (SELECT id FROM entities WHERE slug = 'edes-consolidado'), 21)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Gastos Operativos - Edenorte', 'gastos-operativos-edes-usd-mm-edenorte', 'USD MM', 'Total gastos operativos de las EDEs - Edenorte', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edenorte'),
   (SELECT id FROM indicators WHERE slug = 'gastos-operativos-edes-usd-mm'), 21)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Gastos Operativos - Edesur', 'gastos-operativos-edes-usd-mm-edesur', 'USD MM', 'Total gastos operativos de las EDEs - Edesur', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edesur'),
   (SELECT id FROM indicators WHERE slug = 'gastos-operativos-edes-usd-mm'), 21)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Gastos Operativos - Edeeste', 'gastos-operativos-edes-usd-mm-edeeste', 'USD MM', 'Total gastos operativos de las EDEs - Edeeste', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edeeste'),
   (SELECT id FROM indicators WHERE slug = 'gastos-operativos-edes-usd-mm'), 21)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Gastos de Personal (USD MM)', 'gastos-personal-edes-usd-mm', 'USD MM', 'Gastos de personal de las EDEs', 'bar', false,
   (SELECT id FROM entities WHERE slug = 'edes-consolidado'), 22)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Gastos de Personal - Edenorte', 'gastos-personal-edes-usd-mm-edenorte', 'USD MM', 'Gastos de personal de las EDEs - Edenorte', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edenorte'),
   (SELECT id FROM indicators WHERE slug = 'gastos-personal-edes-usd-mm'), 22)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Gastos de Personal - Edesur', 'gastos-personal-edes-usd-mm-edesur', 'USD MM', 'Gastos de personal de las EDEs - Edesur', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edesur'),
   (SELECT id FROM indicators WHERE slug = 'gastos-personal-edes-usd-mm'), 22)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Gastos de Personal - Edeeste', 'gastos-personal-edes-usd-mm-edeeste', 'USD MM', 'Gastos de personal de las EDEs - Edeeste', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edeeste'),
   (SELECT id FROM indicators WHERE slug = 'gastos-personal-edes-usd-mm'), 22)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Proveedores (USD MM)', 'proveedores-edes-usd-mm', 'USD MM', 'Pagos a proveedores de las EDEs', 'bar', false,
   (SELECT id FROM entities WHERE slug = 'edes-consolidado'), 23)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Proveedores - Edenorte', 'proveedores-edes-usd-mm-edenorte', 'USD MM', 'Pagos a proveedores de las EDEs - Edenorte', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edenorte'),
   (SELECT id FROM indicators WHERE slug = 'proveedores-edes-usd-mm'), 23)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Proveedores - Edesur', 'proveedores-edes-usd-mm-edesur', 'USD MM', 'Pagos a proveedores de las EDEs - Edesur', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edesur'),
   (SELECT id FROM indicators WHERE slug = 'proveedores-edes-usd-mm'), 23)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Proveedores - Edeeste', 'proveedores-edes-usd-mm-edeeste', 'USD MM', 'Pagos a proveedores de las EDEs - Edeeste', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edeeste'),
   (SELECT id FROM indicators WHERE slug = 'proveedores-edes-usd-mm'), 23)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Impuestos (USD MM)', 'impuestos-edes-usd-mm', 'USD MM', 'Pagos de impuestos de las EDEs', 'bar', false,
   (SELECT id FROM entities WHERE slug = 'edes-consolidado'), 24)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Impuestos - Edenorte', 'impuestos-edes-usd-mm-edenorte', 'USD MM', 'Pagos de impuestos de las EDEs - Edenorte', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edenorte'),
   (SELECT id FROM indicators WHERE slug = 'impuestos-edes-usd-mm'), 24)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Impuestos - Edesur', 'impuestos-edes-usd-mm-edesur', 'USD MM', 'Pagos de impuestos de las EDEs - Edesur', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edesur'),
   (SELECT id FROM indicators WHERE slug = 'impuestos-edes-usd-mm'), 24)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Impuestos - Edeeste', 'impuestos-edes-usd-mm-edeeste', 'USD MM', 'Pagos de impuestos de las EDEs - Edeeste', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edeeste'),
   (SELECT id FROM indicators WHERE slug = 'impuestos-edes-usd-mm'), 24)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Pagos a Instituciones Regulatorias (USD MM)', 'pagos-inst-regulatorias-edes-usd-mm', 'USD MM', 'Pagos a instituciones regulatorias', 'bar', false,
   (SELECT id FROM entities WHERE slug = 'edes-consolidado'), 25)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Pagos a Instituciones Regulatorias - Edenorte', 'pagos-inst-regulatorias-edes-usd-mm-edenorte', 'USD MM', 'Pagos a instituciones regulatorias - Edenorte', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edenorte'),
   (SELECT id FROM indicators WHERE slug = 'pagos-inst-regulatorias-edes-usd-mm'), 25)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Pagos a Instituciones Regulatorias - Edesur', 'pagos-inst-regulatorias-edes-usd-mm-edesur', 'USD MM', 'Pagos a instituciones regulatorias - Edesur', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edesur'),
   (SELECT id FROM indicators WHERE slug = 'pagos-inst-regulatorias-edes-usd-mm'), 25)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Pagos a Instituciones Regulatorias - Edeeste', 'pagos-inst-regulatorias-edes-usd-mm-edeeste', 'USD MM', 'Pagos a instituciones regulatorias - Edeeste', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edeeste'),
   (SELECT id FROM indicators WHERE slug = 'pagos-inst-regulatorias-edes-usd-mm'), 25)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Pagos Ayuntamientos y compensaciones (USD MM)', 'pagos-ayuntamientos-edes-usd-mm', 'USD MM', 'Pagos a ayuntamientos y compensaciones', 'bar', false,
   (SELECT id FROM entities WHERE slug = 'edes-consolidado'), 26)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Pagos Ayuntamientos y compensaciones - Edenorte', 'pagos-ayuntamientos-edes-usd-mm-edenorte', 'USD MM', 'Pagos a ayuntamientos y compensaciones - Edenorte', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edenorte'),
   (SELECT id FROM indicators WHERE slug = 'pagos-ayuntamientos-edes-usd-mm'), 26)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Pagos Ayuntamientos y compensaciones - Edesur', 'pagos-ayuntamientos-edes-usd-mm-edesur', 'USD MM', 'Pagos a ayuntamientos y compensaciones - Edesur', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edesur'),
   (SELECT id FROM indicators WHERE slug = 'pagos-ayuntamientos-edes-usd-mm'), 26)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Pagos Ayuntamientos y compensaciones - Edeeste', 'pagos-ayuntamientos-edes-usd-mm-edeeste', 'USD MM', 'Pagos a ayuntamientos y compensaciones - Edeeste', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edeeste'),
   (SELECT id FROM indicators WHERE slug = 'pagos-ayuntamientos-edes-usd-mm'), 26)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Otros Gastos (USD MM)', 'otros-gastos-edes-usd-mm', 'USD MM', 'Otros gastos operativos de las EDEs', 'bar', false,
   (SELECT id FROM entities WHERE slug = 'edes-consolidado'), 27)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Otros Gastos - Edenorte', 'otros-gastos-edes-usd-mm-edenorte', 'USD MM', 'Otros gastos operativos de las EDEs - Edenorte', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edenorte'),
   (SELECT id FROM indicators WHERE slug = 'otros-gastos-edes-usd-mm'), 27)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Otros Gastos - Edesur', 'otros-gastos-edes-usd-mm-edesur', 'USD MM', 'Otros gastos operativos de las EDEs - Edesur', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edesur'),
   (SELECT id FROM indicators WHERE slug = 'otros-gastos-edes-usd-mm'), 27)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Otros Gastos - Edeeste', 'otros-gastos-edes-usd-mm-edeeste', 'USD MM', 'Otros gastos operativos de las EDEs - Edeeste', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edeeste'),
   (SELECT id FROM indicators WHERE slug = 'otros-gastos-edes-usd-mm'), 27)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Gastos Financieros (USD MM)', 'gastos-financieros-edes-usd-mm', 'USD MM', 'Gastos financieros de las EDEs', 'bar', false,
   (SELECT id FROM entities WHERE slug = 'edes-consolidado'), 28)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Gastos Financieros - Edenorte', 'gastos-financieros-edes-usd-mm-edenorte', 'USD MM', 'Gastos financieros de las EDEs - Edenorte', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edenorte'),
   (SELECT id FROM indicators WHERE slug = 'gastos-financieros-edes-usd-mm'), 28)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Gastos Financieros - Edesur', 'gastos-financieros-edes-usd-mm-edesur', 'USD MM', 'Gastos financieros de las EDEs - Edesur', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edesur'),
   (SELECT id FROM indicators WHERE slug = 'gastos-financieros-edes-usd-mm'), 28)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Gastos Financieros - Edeeste', 'gastos-financieros-edes-usd-mm-edeeste', 'USD MM', 'Gastos financieros de las EDEs - Edeeste', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edeeste'),
   (SELECT id FROM indicators WHERE slug = 'gastos-financieros-edes-usd-mm'), 28)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Inversiones Total (USD MM)', 'inversiones-total-edes-usd-mm', 'USD MM', 'Total inversiones de las EDEs', 'bar', false,
   (SELECT id FROM entities WHERE slug = 'edes-consolidado'), 29)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Inversiones Total - Edenorte', 'inversiones-total-edes-usd-mm-edenorte', 'USD MM', 'Total inversiones de las EDEs - Edenorte', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edenorte'),
   (SELECT id FROM indicators WHERE slug = 'inversiones-total-edes-usd-mm'), 29)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Inversiones Total - Edesur', 'inversiones-total-edes-usd-mm-edesur', 'USD MM', 'Total inversiones de las EDEs - Edesur', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edesur'),
   (SELECT id FROM indicators WHERE slug = 'inversiones-total-edes-usd-mm'), 29)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Inversiones Total - Edeeste', 'inversiones-total-edes-usd-mm-edeeste', 'USD MM', 'Total inversiones de las EDEs - Edeeste', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edeeste'),
   (SELECT id FROM indicators WHERE slug = 'inversiones-total-edes-usd-mm'), 29)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Pérdidas (GWh)', 'perdidas-gwh', 'GWh', 'Energía perdida en el sistema de distribución', 'bar', false,
   (SELECT id FROM entities WHERE slug = 'edes-consolidado'), 30)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Pérdidas - Edenorte', 'perdidas-gwh-edenorte', 'GWh', 'Energía perdida en el sistema de distribución - Edenorte', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edenorte'),
   (SELECT id FROM indicators WHERE slug = 'perdidas-gwh'), 30)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Pérdidas - Edesur', 'perdidas-gwh-edesur', 'GWh', 'Energía perdida en el sistema de distribución - Edesur', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edesur'),
   (SELECT id FROM indicators WHERE slug = 'perdidas-gwh'), 30)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Pérdidas - Edeeste', 'perdidas-gwh-edeeste', 'GWh', 'Energía perdida en el sistema de distribución - Edeeste', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edeeste'),
   (SELECT id FROM indicators WHERE slug = 'perdidas-gwh'), 30)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Pérdidas (%)', 'perdidas-porcentaje', '%', 'Porcentaje de pérdidas de energía', 'line', false,
   (SELECT id FROM entities WHERE slug = 'edes-consolidado'), 31)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Pérdidas - Edenorte', 'perdidas-porcentaje-edenorte', '%', 'Porcentaje de pérdidas de energía - Edenorte', 'line', true,
   (SELECT id FROM entities WHERE slug = 'edenorte'),
   (SELECT id FROM indicators WHERE slug = 'perdidas-porcentaje'), 31)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Pérdidas - Edesur', 'perdidas-porcentaje-edesur', '%', 'Porcentaje de pérdidas de energía - Edesur', 'line', true,
   (SELECT id FROM entities WHERE slug = 'edesur'),
   (SELECT id FROM indicators WHERE slug = 'perdidas-porcentaje'), 31)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Pérdidas - Edeeste', 'perdidas-porcentaje-edeeste', '%', 'Porcentaje de pérdidas de energía - Edeeste', 'line', true,
   (SELECT id FROM entities WHERE slug = 'edeeste'),
   (SELECT id FROM indicators WHERE slug = 'perdidas-porcentaje'), 31)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Pérdidas - Año Móvil (%)', 'perdidas-ano-movil-porcentaje', '%', 'Porcentaje de pérdidas en año móvil', 'line', false,
   (SELECT id FROM entities WHERE slug = 'edes-consolidado'), 32)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Pérdidas - Año Móvil - Edenorte', 'perdidas-ano-movil-porcentaje-edenorte', '%', 'Porcentaje de pérdidas en año móvil - Edenorte', 'line', true,
   (SELECT id FROM entities WHERE slug = 'edenorte'),
   (SELECT id FROM indicators WHERE slug = 'perdidas-ano-movil-porcentaje'), 32)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Pérdidas - Año Móvil - Edesur', 'perdidas-ano-movil-porcentaje-edesur', '%', 'Porcentaje de pérdidas en año móvil - Edesur', 'line', true,
   (SELECT id FROM entities WHERE slug = 'edesur'),
   (SELECT id FROM indicators WHERE slug = 'perdidas-ano-movil-porcentaje'), 32)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Pérdidas - Año Móvil - Edeeste', 'perdidas-ano-movil-porcentaje-edeeste', '%', 'Porcentaje de pérdidas en año móvil - Edeeste', 'line', true,
   (SELECT id FROM entities WHERE slug = 'edeeste'),
   (SELECT id FROM indicators WHERE slug = 'perdidas-ano-movil-porcentaje'), 32)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Cobranzas (%)', 'cobranzas-porcentaje', '%', 'Porcentaje de cobranza', 'line', false,
   (SELECT id FROM entities WHERE slug = 'edes-consolidado'), 33)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Cobranzas - Edenorte', 'cobranzas-porcentaje-edenorte', '%', 'Porcentaje de cobranza - Edenorte', 'line', true,
   (SELECT id FROM entities WHERE slug = 'edenorte'),
   (SELECT id FROM indicators WHERE slug = 'cobranzas-porcentaje'), 33)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Cobranzas - Edesur', 'cobranzas-porcentaje-edesur', '%', 'Porcentaje de cobranza - Edesur', 'line', true,
   (SELECT id FROM entities WHERE slug = 'edesur'),
   (SELECT id FROM indicators WHERE slug = 'cobranzas-porcentaje'), 33)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Cobranzas - Edeeste', 'cobranzas-porcentaje-edeeste', '%', 'Porcentaje de cobranza - Edeeste', 'line', true,
   (SELECT id FROM entities WHERE slug = 'edeeste'),
   (SELECT id FROM indicators WHERE slug = 'cobranzas-porcentaje'), 33)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Cobranzas - Año Móvil (%)', 'cobranzas-ano-movil-porcentaje', '%', 'Porcentaje de cobranza en año móvil', 'line', false,
   (SELECT id FROM entities WHERE slug = 'edes-consolidado'), 34)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Cobranzas - Año Móvil - Edenorte', 'cobranzas-ano-movil-porcentaje-edenorte', '%', 'Porcentaje de cobranza en año móvil - Edenorte', 'line', true,
   (SELECT id FROM entities WHERE slug = 'edenorte'),
   (SELECT id FROM indicators WHERE slug = 'cobranzas-ano-movil-porcentaje'), 34)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Cobranzas - Año Móvil - Edesur', 'cobranzas-ano-movil-porcentaje-edesur', '%', 'Porcentaje de cobranza en año móvil - Edesur', 'line', true,
   (SELECT id FROM entities WHERE slug = 'edesur'),
   (SELECT id FROM indicators WHERE slug = 'cobranzas-ano-movil-porcentaje'), 34)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Cobranzas - Año Móvil - Edeeste', 'cobranzas-ano-movil-porcentaje-edeeste', '%', 'Porcentaje de cobranza en año móvil - Edeeste', 'line', true,
   (SELECT id FROM entities WHERE slug = 'edeeste'),
   (SELECT id FROM indicators WHERE slug = 'cobranzas-ano-movil-porcentaje'), 34)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'CRI (%)', 'cri-porcentaje', '%', 'Índice de Recuperación de Cartera', 'line', false,
   (SELECT id FROM entities WHERE slug = 'edes-consolidado'), 35)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'CRI - Edenorte', 'cri-porcentaje-edenorte', '%', 'Índice de Recuperación de Cartera - Edenorte', 'line', true,
   (SELECT id FROM entities WHERE slug = 'edenorte'),
   (SELECT id FROM indicators WHERE slug = 'cri-porcentaje'), 35)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'CRI - Edesur', 'cri-porcentaje-edesur', '%', 'Índice de Recuperación de Cartera - Edesur', 'line', true,
   (SELECT id FROM entities WHERE slug = 'edesur'),
   (SELECT id FROM indicators WHERE slug = 'cri-porcentaje'), 35)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'CRI - Edeeste', 'cri-porcentaje-edeeste', '%', 'Índice de Recuperación de Cartera - Edeeste', 'line', true,
   (SELECT id FROM entities WHERE slug = 'edeeste'),
   (SELECT id FROM indicators WHERE slug = 'cri-porcentaje'), 35)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'CRI - Año Móvil (%)', 'cri-ano-movil-porcentaje', '%', 'Índice de Recuperación de Cartera en año móvil', 'line', false,
   (SELECT id FROM entities WHERE slug = 'edes-consolidado'), 36)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'CRI - Año Móvil - Edenorte', 'cri-ano-movil-porcentaje-edenorte', '%', 'Índice de Recuperación de Cartera en año móvil - Edenorte', 'line', true,
   (SELECT id FROM entities WHERE slug = 'edenorte'),
   (SELECT id FROM indicators WHERE slug = 'cri-ano-movil-porcentaje'), 36)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'CRI - Año Móvil - Edesur', 'cri-ano-movil-porcentaje-edesur', '%', 'Índice de Recuperación de Cartera en año móvil - Edesur', 'line', true,
   (SELECT id FROM entities WHERE slug = 'edesur'),
   (SELECT id FROM indicators WHERE slug = 'cri-ano-movil-porcentaje'), 36)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'CRI - Año Móvil - Edeeste', 'cri-ano-movil-porcentaje-edeeste', '%', 'Índice de Recuperación de Cartera en año móvil - Edeeste', 'line', true,
   (SELECT id FROM entities WHERE slug = 'edeeste'),
   (SELECT id FROM indicators WHERE slug = 'cri-ano-movil-porcentaje'), 36)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Índice de Recuperación de Energía (%)', 'ire-porcentaje', '%', 'Proporción de energía cobrada vs facturada', 'line', false,
   (SELECT id FROM entities WHERE slug = 'edes-consolidado'), 37)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Índice de Recuperación de Energía - Edenorte', 'ire-porcentaje-edenorte', '%', 'Proporción de energía cobrada vs facturada - Edenorte', 'line', true,
   (SELECT id FROM entities WHERE slug = 'edenorte'),
   (SELECT id FROM indicators WHERE slug = 'ire-porcentaje'), 37)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Índice de Recuperación de Energía - Edesur', 'ire-porcentaje-edesur', '%', 'Proporción de energía cobrada vs facturada - Edesur', 'line', true,
   (SELECT id FROM entities WHERE slug = 'edesur'),
   (SELECT id FROM indicators WHERE slug = 'ire-porcentaje'), 37)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Índice de Recuperación de Energía - Edeeste', 'ire-porcentaje-edeeste', '%', 'Proporción de energía cobrada vs facturada - Edeeste', 'line', true,
   (SELECT id FROM entities WHERE slug = 'edeeste'),
   (SELECT id FROM indicators WHERE slug = 'ire-porcentaje'), 37)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Índice de Recuperación de Energía - Año Móvil (%)', 'ire-ano-movil-porcentaje', '%', 'IRE en año móvil', 'line', false,
   (SELECT id FROM entities WHERE slug = 'edes-consolidado'), 38)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Índice de Recuperación de Energía - Año Móvil - Edenorte', 'ire-ano-movil-porcentaje-edenorte', '%', 'IRE en año móvil - Edenorte', 'line', true,
   (SELECT id FROM entities WHERE slug = 'edenorte'),
   (SELECT id FROM indicators WHERE slug = 'ire-ano-movil-porcentaje'), 38)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Índice de Recuperación de Energía - Año Móvil - Edesur', 'ire-ano-movil-porcentaje-edesur', '%', 'IRE en año móvil - Edesur', 'line', true,
   (SELECT id FROM entities WHERE slug = 'edesur'),
   (SELECT id FROM indicators WHERE slug = 'ire-ano-movil-porcentaje'), 38)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Índice de Recuperación de Energía - Año Móvil - Edeeste', 'ire-ano-movil-porcentaje-edeeste', '%', 'IRE en año móvil - Edeeste', 'line', true,
   (SELECT id FROM entities WHERE slug = 'edeeste'),
   (SELECT id FROM indicators WHERE slug = 'ire-ano-movil-porcentaje'), 38)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Cantidad de Clientes Facturados', 'clientes-facturados', 'clientes', 'Número de clientes con factura emitida', 'bar', false,
   (SELECT id FROM entities WHERE slug = 'edes-consolidado'), 39)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Cantidad de Clientes Facturados - Edenorte', 'clientes-facturados-edenorte', 'clientes', 'Número de clientes con factura emitida - Edenorte', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edenorte'),
   (SELECT id FROM indicators WHERE slug = 'clientes-facturados'), 39)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Cantidad de Clientes Facturados - Edesur', 'clientes-facturados-edesur', 'clientes', 'Número de clientes con factura emitida - Edesur', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edesur'),
   (SELECT id FROM indicators WHERE slug = 'clientes-facturados'), 39)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Cantidad de Clientes Facturados - Edeeste', 'clientes-facturados-edeeste', 'clientes', 'Número de clientes con factura emitida - Edeeste', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edeeste'),
   (SELECT id FROM indicators WHERE slug = 'clientes-facturados'), 39)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Cantidad de Clientes Bonoluz', 'clientes-bonoluz', 'clientes', 'Número de clientes en el programa Bonoluz', 'bar', false,
   (SELECT id FROM entities WHERE slug = 'edes-consolidado'), 40)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Cantidad de Clientes Bonoluz - Edenorte', 'clientes-bonoluz-edenorte', 'clientes', 'Número de clientes en el programa Bonoluz - Edenorte', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edenorte'),
   (SELECT id FROM indicators WHERE slug = 'clientes-bonoluz'), 40)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Cantidad de Clientes Bonoluz - Edesur', 'clientes-bonoluz-edesur', 'clientes', 'Número de clientes en el programa Bonoluz - Edesur', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edesur'),
   (SELECT id FROM indicators WHERE slug = 'clientes-bonoluz'), 40)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Cantidad de Clientes Bonoluz - Edeeste', 'clientes-bonoluz-edeeste', 'clientes', 'Número de clientes en el programa Bonoluz - Edeeste', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edeeste'),
   (SELECT id FROM indicators WHERE slug = 'clientes-bonoluz'), 40)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Disponibilidad', 'disponibilidad-edes', 'ratio', 'Índice de disponibilidad del servicio eléctrico', 'gauge', false,
   (SELECT id FROM entities WHERE slug = 'edes-consolidado'), 41)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Disponibilidad - Edenorte', 'disponibilidad-edes-edenorte', 'ratio', 'Índice de disponibilidad del servicio eléctrico - Edenorte', 'gauge', true,
   (SELECT id FROM entities WHERE slug = 'edenorte'),
   (SELECT id FROM indicators WHERE slug = 'disponibilidad-edes'), 41)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Disponibilidad - Edesur', 'disponibilidad-edes-edesur', 'ratio', 'Índice de disponibilidad del servicio eléctrico - Edesur', 'gauge', true,
   (SELECT id FROM entities WHERE slug = 'edesur'),
   (SELECT id FROM indicators WHERE slug = 'disponibilidad-edes'), 41)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Disponibilidad - Edeeste', 'disponibilidad-edes-edeeste', 'ratio', 'Índice de disponibilidad del servicio eléctrico - Edeeste', 'gauge', true,
   (SELECT id FROM entities WHERE slug = 'edeeste'),
   (SELECT id FROM indicators WHERE slug = 'disponibilidad-edes'), 41)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Cantidad de Empleados EDE''s', 'empleados-edes', 'empleados', 'Total de empleados de las EDEs', 'bar', false,
   (SELECT id FROM entities WHERE slug = 'edes-consolidado'), 42)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Cantidad de Empleados EDE''s - Edenorte', 'empleados-edes-edenorte', 'empleados', 'Total de empleados de las EDEs - Edenorte', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edenorte'),
   (SELECT id FROM indicators WHERE slug = 'empleados-edes'), 42)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Cantidad de Empleados EDE''s - Edesur', 'empleados-edes-edesur', 'empleados', 'Total de empleados de las EDEs - Edesur', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edesur'),
   (SELECT id FROM indicators WHERE slug = 'empleados-edes'), 42)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'empresas-distribuidoras'),
   'Cantidad de Empleados EDE''s - Edeeste', 'empleados-edes-edeeste', 'empleados', 'Total de empleados de las EDEs - Edeeste', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edeeste'),
   (SELECT id FROM indicators WHERE slug = 'empleados-edes'), 42)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- CDEEE: Indicadores principales y desgloses
-- ============================================================
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'cdeee'),
   'Energía Comprada (GWh)', 'cdeee-energia-comprada-gwh', 'GWh', 'Energía total comprada por CDEEE', 'area', false,
   (SELECT id FROM entities WHERE slug = 'cdeee'), 1)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'cdeee'),
   'Energía Comprada - GSF', 'cdeee-energia-comprada-gwh-gsf', 'GWh', 'Energía total comprada por CDEEE - GSF', 'area', true,
   (SELECT id FROM entities WHERE slug = 'gsf'),
   (SELECT id FROM indicators WHERE slug = 'cdeee-energia-comprada-gwh'), 1)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'cdeee'),
   'Energía Comprada - CESPM', 'cdeee-energia-comprada-gwh-cespm', 'GWh', 'Energía total comprada por CDEEE - CESPM', 'area', true,
   (SELECT id FROM entities WHERE slug = 'cespm'),
   (SELECT id FROM indicators WHERE slug = 'cdeee-energia-comprada-gwh'), 1)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'cdeee'),
   'Energía Comprada - DPP', 'cdeee-energia-comprada-gwh-dpp', 'GWh', 'Energía total comprada por CDEEE - DPP', 'area', true,
   (SELECT id FROM entities WHERE slug = 'dpp'),
   (SELECT id FROM indicators WHERE slug = 'cdeee-energia-comprada-gwh'), 1)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'cdeee'),
   'Energía Comprada - EgeHaina (Larimar) II', 'cdeee-energia-comprada-gwh-egehaina-larimar', 'GWh', 'Energía total comprada por CDEEE - EgeHaina (Larimar) II', 'area', true,
   (SELECT id FROM entities WHERE slug = 'egehaina-larimar'),
   (SELECT id FROM indicators WHERE slug = 'cdeee-energia-comprada-gwh'), 1)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'cdeee'),
   'Energía Comprada - Electronic JRC', 'cdeee-energia-comprada-gwh-electronic-jrc', 'GWh', 'Energía total comprada por CDEEE - Electronic JRC', 'area', true,
   (SELECT id FROM entities WHERE slug = 'electronic-jrc'),
   (SELECT id FROM indicators WHERE slug = 'cdeee-energia-comprada-gwh'), 1)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'cdeee'),
   'Energía Comprada - Montecristi Solar F.V.', 'cdeee-energia-comprada-gwh-montecristi-solar', 'GWh', 'Energía total comprada por CDEEE - Montecristi Solar F.V.', 'area', true,
   (SELECT id FROM entities WHERE slug = 'montecristi-solar'),
   (SELECT id FROM indicators WHERE slug = 'cdeee-energia-comprada-gwh'), 1)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'cdeee'),
   'Energía Comprada - C Power DR Operations', 'cdeee-energia-comprada-gwh-c-power', 'GWh', 'Energía total comprada por CDEEE - C Power DR Operations', 'area', true,
   (SELECT id FROM entities WHERE slug = 'c-power'),
   (SELECT id FROM indicators WHERE slug = 'cdeee-energia-comprada-gwh'), 1)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'cdeee'),
   'Energía Comprada - PECASA', 'cdeee-energia-comprada-gwh-pecasa', 'GWh', 'Energía total comprada por CDEEE - PECASA', 'area', true,
   (SELECT id FROM entities WHERE slug = 'pecasa'),
   (SELECT id FROM indicators WHERE slug = 'cdeee-energia-comprada-gwh'), 1)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'cdeee'),
   'Energía Comprada - Matafongo', 'cdeee-energia-comprada-gwh-matafongo', 'GWh', 'Energía total comprada por CDEEE - Matafongo', 'area', true,
   (SELECT id FROM entities WHERE slug = 'matafongo'),
   (SELECT id FROM indicators WHERE slug = 'cdeee-energia-comprada-gwh'), 1)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'cdeee'),
   'Energía Comprada - WCG Energy Ltd', 'cdeee-energia-comprada-gwh-wcg-energy', 'GWh', 'Energía total comprada por CDEEE - WCG Energy Ltd', 'area', true,
   (SELECT id FROM entities WHERE slug = 'wcg-energy'),
   (SELECT id FROM indicators WHERE slug = 'cdeee-energia-comprada-gwh'), 1)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'cdeee'),
   'Energía Comprada - Emerald Solar', 'cdeee-energia-comprada-gwh-emerald-solar', 'GWh', 'Energía total comprada por CDEEE - Emerald Solar', 'area', true,
   (SELECT id FROM entities WHERE slug = 'emerald-solar'),
   (SELECT id FROM indicators WHERE slug = 'cdeee-energia-comprada-gwh'), 1)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'cdeee'),
   'Energía Comprada - Poseidón', 'cdeee-energia-comprada-gwh-poseidon', 'GWh', 'Energía total comprada por CDEEE - Poseidón', 'area', true,
   (SELECT id FROM entities WHERE slug = 'poseidon'),
   (SELECT id FROM indicators WHERE slug = 'cdeee-energia-comprada-gwh'), 1)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'cdeee'),
   'Energía Comprada - Quisqueya II', 'cdeee-energia-comprada-gwh-quisqueya-ii', 'GWh', 'Energía total comprada por CDEEE - Quisqueya II', 'area', true,
   (SELECT id FROM entities WHERE slug = 'quisqueya-ii'),
   (SELECT id FROM indicators WHERE slug = 'cdeee-energia-comprada-gwh'), 1)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'cdeee'),
   'Energía Comprada - EGEHID', 'cdeee-energia-comprada-gwh-egehid', 'GWh', 'Energía total comprada por CDEEE - EGEHID', 'area', true,
   (SELECT id FROM entities WHERE slug = 'egehid'),
   (SELECT id FROM indicators WHERE slug = 'cdeee-energia-comprada-gwh'), 1)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'cdeee'),
   'Energía Comprada - FALCONDO', 'cdeee-energia-comprada-gwh-falcondo', 'GWh', 'Energía total comprada por CDEEE - FALCONDO', 'area', true,
   (SELECT id FROM entities WHERE slug = 'falcondo'),
   (SELECT id FROM indicators WHERE slug = 'cdeee-energia-comprada-gwh'), 1)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'cdeee'),
   'Energía Comprada - RSJ', 'cdeee-energia-comprada-gwh-rsj', 'GWh', 'Energía total comprada por CDEEE - RSJ', 'area', true,
   (SELECT id FROM entities WHERE slug = 'rsj'),
   (SELECT id FROM indicators WHERE slug = 'cdeee-energia-comprada-gwh'), 1)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'cdeee'),
   'Energía Comprada - Mercado Spot', 'cdeee-energia-comprada-gwh-mercado-spot', 'GWh', 'Energía total comprada por CDEEE - Mercado Spot', 'area', true,
   (SELECT id FROM entities WHERE slug = 'mercado-spot'),
   (SELECT id FROM indicators WHERE slug = 'cdeee-energia-comprada-gwh'), 1)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'cdeee'),
   'Precio Medio de Compra (USCents/KWh)', 'cdeee-precio-medio-compra', 'USCents/KWh', 'Precio medio ponderado de compra de energía CDEEE', 'line', false,
   (SELECT id FROM entities WHERE slug = 'cdeee'), 2)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'cdeee'),
   'Factura por Compra de Energía (US$ MM)', 'cdeee-factura-compra-energia', 'US$ MM', 'Monto facturado por compra de energía CDEEE', 'bar', false,
   (SELECT id FROM entities WHERE slug = 'cdeee'), 3)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'cdeee'),
   'Factura por Compra de Energía - GSF', 'cdeee-factura-compra-energia-gsf', 'US$ MM', 'Monto facturado por compra de energía CDEEE - GSF', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'gsf'),
   (SELECT id FROM indicators WHERE slug = 'cdeee-factura-compra-energia'), 3)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'cdeee'),
   'Factura por Compra de Energía - CESPM', 'cdeee-factura-compra-energia-cespm', 'US$ MM', 'Monto facturado por compra de energía CDEEE - CESPM', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'cespm'),
   (SELECT id FROM indicators WHERE slug = 'cdeee-factura-compra-energia'), 3)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'cdeee'),
   'Factura por Compra de Energía - DPP', 'cdeee-factura-compra-energia-dpp', 'US$ MM', 'Monto facturado por compra de energía CDEEE - DPP', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'dpp'),
   (SELECT id FROM indicators WHERE slug = 'cdeee-factura-compra-energia'), 3)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'cdeee'),
   'Factura por Compra de Energía - EgeHaina (Larimar) II', 'cdeee-factura-compra-energia-egehaina-larimar', 'US$ MM', 'Monto facturado por compra de energía CDEEE - EgeHaina (Larimar) II', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'egehaina-larimar'),
   (SELECT id FROM indicators WHERE slug = 'cdeee-factura-compra-energia'), 3)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'cdeee'),
   'Factura por Compra de Energía - Electronic JRC', 'cdeee-factura-compra-energia-electronic-jrc', 'US$ MM', 'Monto facturado por compra de energía CDEEE - Electronic JRC', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'electronic-jrc'),
   (SELECT id FROM indicators WHERE slug = 'cdeee-factura-compra-energia'), 3)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'cdeee'),
   'Factura por Compra de Energía - Montecristi Solar F.V.', 'cdeee-factura-compra-energia-montecristi-solar', 'US$ MM', 'Monto facturado por compra de energía CDEEE - Montecristi Solar F.V.', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'montecristi-solar'),
   (SELECT id FROM indicators WHERE slug = 'cdeee-factura-compra-energia'), 3)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'cdeee'),
   'Factura por Compra de Energía - C Power DR Operations', 'cdeee-factura-compra-energia-c-power', 'US$ MM', 'Monto facturado por compra de energía CDEEE - C Power DR Operations', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'c-power'),
   (SELECT id FROM indicators WHERE slug = 'cdeee-factura-compra-energia'), 3)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'cdeee'),
   'Factura por Compra de Energía - PECASA', 'cdeee-factura-compra-energia-pecasa', 'US$ MM', 'Monto facturado por compra de energía CDEEE - PECASA', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'pecasa'),
   (SELECT id FROM indicators WHERE slug = 'cdeee-factura-compra-energia'), 3)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'cdeee'),
   'Factura por Compra de Energía - Matafongo', 'cdeee-factura-compra-energia-matafongo', 'US$ MM', 'Monto facturado por compra de energía CDEEE - Matafongo', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'matafongo'),
   (SELECT id FROM indicators WHERE slug = 'cdeee-factura-compra-energia'), 3)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'cdeee'),
   'Factura por Compra de Energía - WCG Energy Ltd', 'cdeee-factura-compra-energia-wcg-energy', 'US$ MM', 'Monto facturado por compra de energía CDEEE - WCG Energy Ltd', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'wcg-energy'),
   (SELECT id FROM indicators WHERE slug = 'cdeee-factura-compra-energia'), 3)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'cdeee'),
   'Factura por Compra de Energía - Emerald Solar', 'cdeee-factura-compra-energia-emerald-solar', 'US$ MM', 'Monto facturado por compra de energía CDEEE - Emerald Solar', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'emerald-solar'),
   (SELECT id FROM indicators WHERE slug = 'cdeee-factura-compra-energia'), 3)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'cdeee'),
   'Factura por Compra de Energía - Poseidón', 'cdeee-factura-compra-energia-poseidon', 'US$ MM', 'Monto facturado por compra de energía CDEEE - Poseidón', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'poseidon'),
   (SELECT id FROM indicators WHERE slug = 'cdeee-factura-compra-energia'), 3)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'cdeee'),
   'Factura por Compra de Energía - Quisqueya II', 'cdeee-factura-compra-energia-quisqueya-ii', 'US$ MM', 'Monto facturado por compra de energía CDEEE - Quisqueya II', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'quisqueya-ii'),
   (SELECT id FROM indicators WHERE slug = 'cdeee-factura-compra-energia'), 3)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'cdeee'),
   'Factura por Compra de Energía - EGEHID', 'cdeee-factura-compra-energia-egehid', 'US$ MM', 'Monto facturado por compra de energía CDEEE - EGEHID', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'egehid'),
   (SELECT id FROM indicators WHERE slug = 'cdeee-factura-compra-energia'), 3)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'cdeee'),
   'Factura por Compra de Energía - FALCONDO', 'cdeee-factura-compra-energia-falcondo', 'US$ MM', 'Monto facturado por compra de energía CDEEE - FALCONDO', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'falcondo'),
   (SELECT id FROM indicators WHERE slug = 'cdeee-factura-compra-energia'), 3)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'cdeee'),
   'Factura por Compra de Energía - RSJ', 'cdeee-factura-compra-energia-rsj', 'US$ MM', 'Monto facturado por compra de energía CDEEE - RSJ', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'rsj'),
   (SELECT id FROM indicators WHERE slug = 'cdeee-factura-compra-energia'), 3)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'cdeee'),
   'Factura por Compra de Energía - Mercado Spot', 'cdeee-factura-compra-energia-mercado-spot', 'US$ MM', 'Monto facturado por compra de energía CDEEE - Mercado Spot', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'mercado-spot'),
   (SELECT id FROM indicators WHERE slug = 'cdeee-factura-compra-energia'), 3)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'cdeee'),
   'Total de Energía Facturada (GWh)', 'cdeee-energia-facturada-gwh', 'GWh', 'Energía facturada por CDEEE a sus clientes', 'area', false,
   (SELECT id FROM entities WHERE slug = 'cdeee'), 4)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'cdeee'),
   'Total de Energía Facturada - Edenorte', 'cdeee-energia-facturada-gwh-edenorte', 'GWh', 'Energía facturada por CDEEE a sus clientes - Edenorte', 'area', true,
   (SELECT id FROM entities WHERE slug = 'edenorte'),
   (SELECT id FROM indicators WHERE slug = 'cdeee-energia-facturada-gwh'), 4)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'cdeee'),
   'Total de Energía Facturada - Edesur', 'cdeee-energia-facturada-gwh-edesur', 'GWh', 'Energía facturada por CDEEE a sus clientes - Edesur', 'area', true,
   (SELECT id FROM entities WHERE slug = 'edesur'),
   (SELECT id FROM indicators WHERE slug = 'cdeee-energia-facturada-gwh'), 4)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'cdeee'),
   'Total de Energía Facturada - Edeeste', 'cdeee-energia-facturada-gwh-edeeste', 'GWh', 'Energía facturada por CDEEE a sus clientes - Edeeste', 'area', true,
   (SELECT id FROM entities WHERE slug = 'edeeste'),
   (SELECT id FROM indicators WHERE slug = 'cdeee-energia-facturada-gwh'), 4)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'cdeee'),
   'Total de Energía Facturada - Mercado Spot', 'cdeee-energia-facturada-gwh-mercado-spot', 'GWh', 'Energía facturada por CDEEE a sus clientes - Mercado Spot', 'area', true,
   (SELECT id FROM entities WHERE slug = 'mercado-spot'),
   (SELECT id FROM indicators WHERE slug = 'cdeee-energia-facturada-gwh'), 4)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'cdeee'),
   'Precio Medio de Venta (USCents/KWh)', 'cdeee-precio-medio-venta', 'USCents/KWh', 'Precio medio de venta de energía CDEEE', 'line', false,
   (SELECT id FROM entities WHERE slug = 'cdeee'), 5)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'cdeee'),
   'Total Facturado (US$ MM)', 'cdeee-total-facturado-usd-mm', 'US$ MM', 'Total facturado por CDEEE', 'bar', false,
   (SELECT id FROM entities WHERE slug = 'cdeee'), 6)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'cdeee'),
   'Total Facturado - Edenorte', 'cdeee-total-facturado-usd-mm-edenorte', 'US$ MM', 'Total facturado por CDEEE - Edenorte', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edenorte'),
   (SELECT id FROM indicators WHERE slug = 'cdeee-total-facturado-usd-mm'), 6)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'cdeee'),
   'Total Facturado - Edesur', 'cdeee-total-facturado-usd-mm-edesur', 'US$ MM', 'Total facturado por CDEEE - Edesur', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edesur'),
   (SELECT id FROM indicators WHERE slug = 'cdeee-total-facturado-usd-mm'), 6)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'cdeee'),
   'Total Facturado - Edeeste', 'cdeee-total-facturado-usd-mm-edeeste', 'US$ MM', 'Total facturado por CDEEE - Edeeste', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edeeste'),
   (SELECT id FROM indicators WHERE slug = 'cdeee-total-facturado-usd-mm'), 6)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'cdeee'),
   'Total Facturado - Mercado Spot', 'cdeee-total-facturado-usd-mm-mercado-spot', 'US$ MM', 'Total facturado por CDEEE - Mercado Spot', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'mercado-spot'),
   (SELECT id FROM indicators WHERE slug = 'cdeee-total-facturado-usd-mm'), 6)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'cdeee'),
   'Otros Ingresos (US$ MM)', 'cdeee-otros-ingresos-usd-mm', 'US$ MM', 'Otros ingresos de CDEEE', 'bar', false,
   (SELECT id FROM entities WHERE slug = 'cdeee'), 7)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'cdeee'),
   'Gastos Operativos (US$ MM)', 'cdeee-gastos-operativos-usd-mm', 'US$ MM', 'Total gastos operativos de CDEEE', 'bar', false,
   (SELECT id FROM entities WHERE slug = 'cdeee'), 8)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'cdeee'),
   'Egresos Financieros (US$ MM)', 'cdeee-egresos-financieros-usd-mm', 'US$ MM', 'Egresos financieros de CDEEE', 'bar', false,
   (SELECT id FROM entities WHERE slug = 'cdeee'), 9)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'cdeee'),
   'Inversiones (US$ MM)', 'cdeee-inversiones-usd-mm', 'US$ MM', 'Total inversiones de CDEEE', 'bar', false,
   (SELECT id FROM entities WHERE slug = 'cdeee'), 10)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'cdeee'),
   'Cantidad de Empleados CDEEE', 'cdeee-empleados', 'empleados', 'Total empleados de CDEEE y sus unidades', 'bar', false,
   (SELECT id FROM entities WHERE slug = 'cdeee'), 11)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'cdeee'),
   'Gastos de Personal', 'cdeee-gastos-personal', 'US$ MM', 'Desglose de gastos operativos CDEEE', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'cdeee-gastos-operativos-usd-mm'), 8)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'cdeee'),
   'Servicios No Personales', 'cdeee-servicios-no-personales', 'US$ MM', 'Desglose de gastos operativos CDEEE', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'cdeee-gastos-operativos-usd-mm'), 8)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'cdeee'),
   'Materiales y Suministros', 'cdeee-materiales-suministros', 'US$ MM', 'Desglose de gastos operativos CDEEE', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'cdeee-gastos-operativos-usd-mm'), 8)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'cdeee'),
   'Otros Gastos (Incluye Pagos a Instituciones Regulatorias)', 'cdeee-otros-gastos', 'US$ MM', 'Desglose de gastos operativos CDEEE', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'cdeee-gastos-operativos-usd-mm'), 8)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'cdeee'),
   'CDEEE-Punta Catalina', 'cdeee-empleados-punta-catalina', 'empleados', 'Desglose de empleados CDEEE', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'cdeee-empleados'), 11)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'cdeee'),
   'UERS', 'cdeee-empleados-uers', 'empleados', 'Desglose de empleados CDEEE', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'cdeee-empleados'), 11)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'cdeee'),
   'PSB', 'cdeee-empleados-psb', 'empleados', 'Desglose de empleados CDEEE', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'cdeee-empleados'), 11)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'cdeee'),
   'PRA', 'cdeee-empleados-pra', 'empleados', 'Desglose de empleados CDEEE', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'cdeee-empleados'), 11)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'cdeee'),
   'GPIP', 'cdeee-empleados-gpip', 'empleados', 'Desglose de empleados CDEEE', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'cdeee-empleados'), 11)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'cdeee'),
   'Dieta Militares', 'cdeee-empleados-dieta-militares', 'empleados', 'Desglose de empleados CDEEE', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'cdeee-empleados'), 11)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- EGEHID: Indicadores principales y desgloses
-- ============================================================
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'egehid'),
   'Energía Facturada (GWh)', 'egehid-energia-facturada-gwh', 'GWh', 'Energía facturada por EGEHID', 'area', false,
   (SELECT id FROM entities WHERE slug = 'egehid'), 1)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'egehid'),
   'Precio Medio de Venta de Energía (cUSD/kWh)', 'egehid-precio-medio-venta', 'cUSD/kWh', 'Precio medio de venta de energía de EGEHID', 'line', false,
   (SELECT id FROM entities WHERE slug = 'egehid'), 2)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'egehid'),
   'Factura por Venta de Energía (USD MM)', 'egehid-factura-venta-energia', 'USD MM', 'Monto facturado por venta de energía de EGEHID', 'bar', false,
   (SELECT id FROM entities WHERE slug = 'egehid'), 3)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'egehid'),
   'Otros Ingresos (USD MM)', 'egehid-otros-ingresos', 'USD MM', 'Otros ingresos de EGEHID', 'bar', false,
   (SELECT id FROM entities WHERE slug = 'egehid'), 4)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'egehid'),
   'Gastos Operativos (USD MM)', 'egehid-gastos-operativos', 'USD MM', 'Total gastos operativos de EGEHID', 'bar', false,
   (SELECT id FROM entities WHERE slug = 'egehid'), 5)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'egehid'),
   'Egresos Financieros (USD MM)', 'egehid-egresos-financieros', 'USD MM', 'Egresos financieros de EGEHID', 'bar', false,
   (SELECT id FROM entities WHERE slug = 'egehid'), 6)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'egehid'),
   'Inversiones (USD MM)', 'egehid-inversiones', 'USD MM', 'Total inversiones de EGEHID', 'bar', false,
   (SELECT id FROM entities WHERE slug = 'egehid'), 7)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'egehid'),
   'Cantidad de Empleados EGEHID', 'egehid-empleados', 'empleados', 'Total empleados de EGEHID', 'bar', false,
   (SELECT id FROM entities WHERE slug = 'egehid'), 8)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'egehid'),
   'Mercado de Contratos', 'egehid-energia-mercado-contratos', 'GWh', 'Desglose de energía facturada EGEHID', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'egehid-energia-facturada-gwh'), 1)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'egehid'),
   'CDEEE', 'egehid-energia-cdeee', 'GWh', 'Desglose de energía facturada EGEHID', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'egehid-energia-facturada-gwh'), 1)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'egehid'),
   'EDE''s', 'egehid-energia-edes', 'GWh', 'Desglose de energía facturada EGEHID', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'egehid-energia-facturada-gwh'), 1)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'egehid'),
   'GenCo''s', 'egehid-energia-gencos', 'GWh', 'Desglose de energía facturada EGEHID', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'egehid-energia-facturada-gwh'), 1)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'egehid'),
   'UNR', 'egehid-energia-unr', 'GWh', 'Desglose de energía facturada EGEHID', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'egehid-energia-facturada-gwh'), 1)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'egehid'),
   'Mercado Spot', 'egehid-energia-mercado-spot', 'GWh', 'Desglose de energía facturada EGEHID', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'egehid-energia-facturada-gwh'), 1)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'egehid'),
   'Mercado de Contratos', 'egehid-factura-mercado-contratos', 'USD MM', 'Desglose de factura por venta EGEHID', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'egehid-factura-venta-energia'), 3)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'egehid'),
   'CDEEE', 'egehid-factura-cdeee', 'USD MM', 'Desglose de factura por venta EGEHID', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'egehid-factura-venta-energia'), 3)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'egehid'),
   'EDE''s', 'egehid-factura-edes', 'USD MM', 'Desglose de factura por venta EGEHID', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'egehid-factura-venta-energia'), 3)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'egehid'),
   'GenCo''s', 'egehid-factura-gencos', 'USD MM', 'Desglose de factura por venta EGEHID', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'egehid-factura-venta-energia'), 3)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'egehid'),
   'UNR', 'egehid-factura-unr', 'USD MM', 'Desglose de factura por venta EGEHID', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'egehid-factura-venta-energia'), 3)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'egehid'),
   'Mercado Spot', 'egehid-factura-mercado-spot', 'USD MM', 'Desglose de factura por venta EGEHID', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'egehid-factura-venta-energia'), 3)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'egehid'),
   'Gastos de Personal', 'egehid-gastos-personal', 'USD MM', 'Desglose de gastos operativos EGEHID', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'egehid-gastos-operativos'), 5)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'egehid'),
   'Servicios No Personales', 'egehid-servicios-no-personales', 'USD MM', 'Desglose de gastos operativos EGEHID', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'egehid-gastos-operativos'), 5)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'egehid'),
   'Materiales y Suministros', 'egehid-materiales-suministros', 'USD MM', 'Desglose de gastos operativos EGEHID', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'egehid-gastos-operativos'), 5)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'egehid'),
   'Otros Gastos', 'egehid-otros-gastos', 'USD MM', 'Desglose de gastos operativos EGEHID', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'egehid-gastos-operativos'), 5)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- ETED: Indicadores principales y desgloses
-- ============================================================
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'eted'),
   'Peaje Total (USD MM)', 'eted-peaje-total-usd-mm', 'USD MM', 'Total peaje de transmisión de ETED', 'bar', false,
   (SELECT id FROM entities WHERE slug = 'eted'), 1)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'eted'),
   'Otros Ingresos (USD MM)', 'eted-otros-ingresos', 'USD MM', 'Otros ingresos de ETED', 'bar', false,
   (SELECT id FROM entities WHERE slug = 'eted'), 2)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'eted'),
   'Gastos Operativos (US$ MM)', 'eted-gastos-operativos', 'US$ MM', 'Total gastos operativos de ETED', 'bar', false,
   (SELECT id FROM entities WHERE slug = 'eted'), 3)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'eted'),
   'Egresos Financieros (USD MM)', 'eted-egresos-financieros', 'USD MM', 'Egresos financieros de ETED', 'bar', false,
   (SELECT id FROM entities WHERE slug = 'eted'), 4)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'eted'),
   'Inversiones (USD MM)', 'eted-inversiones', 'USD MM', 'Total inversiones de ETED', 'bar', false,
   (SELECT id FROM entities WHERE slug = 'eted'), 5)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'eted'),
   'Total Empleados ETED', 'eted-empleados', 'empleados', 'Total empleados de ETED', 'bar', false,
   (SELECT id FROM entities WHERE slug = 'eted'), 6)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'eted'),
   'Derecho de Uso', 'eted-derecho-uso', 'USD MM', 'Desglose del peaje total ETED', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'eted-peaje-total-usd-mm'), 1)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'eted'),
   'Derecho de Conexión', 'eted-derecho-conexion', 'USD MM', 'Desglose del peaje total ETED', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'eted-peaje-total-usd-mm'), 1)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'eted'),
   'Gastos de Personal', 'eted-gastos-personal', 'US$ MM', 'Desglose de gastos operativos ETED', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'eted-gastos-operativos'), 3)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'eted'),
   'Servicios No Personales', 'eted-servicios-no-personales', 'US$ MM', 'Desglose de gastos operativos ETED', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'eted-gastos-operativos'), 3)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'eted'),
   'Materiales y Suministros', 'eted-materiales-suministros', 'US$ MM', 'Desglose de gastos operativos ETED', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'eted-gastos-operativos'), 3)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'eted'),
   'Otros Gastos', 'eted-otros-gastos', 'US$ MM', 'Desglose de gastos operativos ETED', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'eted-gastos-operativos'), 3)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- EGPC / Punta Catalina: Indicadores principales y desgloses
-- ============================================================
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'egpc-punta-catalina'),
   'Total de Energía Facturada (GWh)', 'egpc-energia-facturada-gwh', 'GWh', 'Energía facturada por EGPC Punta Catalina', 'area', false,
   (SELECT id FROM entities WHERE slug = 'egpc'), 1)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'egpc-punta-catalina'),
   'Precio Medio de Venta (cUSD/KWh)', 'egpc-precio-medio-venta', 'cUSD/KWh', 'Precio medio de venta de energía de EGPC', 'line', false,
   (SELECT id FROM entities WHERE slug = 'egpc'), 2)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'egpc-punta-catalina'),
   'Total Facturado (USD MM)', 'egpc-total-facturado', 'USD MM', 'Total facturado por EGPC Punta Catalina', 'bar', false,
   (SELECT id FROM entities WHERE slug = 'egpc'), 3)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'egpc-punta-catalina'),
   'Total Costos de Producción (USD MM)', 'egpc-costos-produccion', 'USD MM', 'Total costos de producción de EGPC', 'bar', false,
   (SELECT id FROM entities WHERE slug = 'egpc'), 4)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'egpc-punta-catalina'),
   'Total Gastos Operativos (USD MM)', 'egpc-gastos-operativos', 'USD MM', 'Total gastos operativos de EGPC', 'bar', false,
   (SELECT id FROM entities WHERE slug = 'egpc'), 5)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'egpc-punta-catalina'),
   'Gastos de Depreciación y Amortización (USD MM)', 'egpc-depreciacion-amortizacion', 'USD MM', 'Gastos de depreciación y amortización de EGPC', 'bar', false,
   (SELECT id FROM entities WHERE slug = 'egpc'), 6)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'egpc-punta-catalina'),
   'Total Gastos Financieros (USD MM)', 'egpc-gastos-financieros', 'USD MM', 'Total gastos financieros de EGPC', 'bar', false,
   (SELECT id FROM entities WHERE slug = 'egpc'), 7)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'egpc-punta-catalina'),
   'Total Otros Ingresos (USD MM)', 'egpc-otros-ingresos', 'USD MM', 'Total otros ingresos de EGPC', 'bar', false,
   (SELECT id FROM entities WHERE slug = 'egpc'), 8)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'egpc-punta-catalina'),
   'Total Otros Gastos (USD MM)', 'egpc-otros-gastos', 'USD MM', 'Total otros gastos de EGPC', 'bar', false,
   (SELECT id FROM entities WHERE slug = 'egpc'), 9)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'egpc-punta-catalina'),
   'Total Inversiones (USD MM)', 'egpc-inversiones', 'USD MM', 'Total inversiones de EGPC', 'bar', false,
   (SELECT id FROM entities WHERE slug = 'egpc'), 10)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'egpc-punta-catalina'),
   'Cantidad de Empleados EGEPC', 'egpc-empleados', 'empleados', 'Total empleados de EGPC Punta Catalina', 'bar', false,
   (SELECT id FROM entities WHERE slug = 'egpc'), 11)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'egpc-punta-catalina'),
   'Mercado de Contratos', 'egpc-energia-mercado-contratos', 'GWh', 'Desglose de energía facturada EGPC', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'egpc-energia-facturada-gwh'), 1)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'egpc-punta-catalina'),
   'Edenorte', 'egpc-energia-edenorte', 'GWh', 'Desglose de energía facturada EGPC', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'egpc-energia-facturada-gwh'), 1)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'egpc-punta-catalina'),
   'Edesur', 'egpc-energia-edesur', 'GWh', 'Desglose de energía facturada EGPC', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'egpc-energia-facturada-gwh'), 1)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'egpc-punta-catalina'),
   'Edeeste', 'egpc-energia-edeeste', 'GWh', 'Desglose de energía facturada EGPC', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'egpc-energia-facturada-gwh'), 1)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'egpc-punta-catalina'),
   'Mercado Spot', 'egpc-energia-mercado-spot', 'GWh', 'Desglose de energía facturada EGPC', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'egpc-energia-facturada-gwh'), 1)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'egpc-punta-catalina'),
   'Mercado de Contratos', 'egpc-facturado-mercado-contratos', 'USD MM', 'Desglose de facturación EGPC', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'egpc-total-facturado'), 3)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'egpc-punta-catalina'),
   'Edenorte', 'egpc-facturado-edenorte', 'USD MM', 'Desglose de facturación EGPC', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'egpc-total-facturado'), 3)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'egpc-punta-catalina'),
   'Edesur', 'egpc-facturado-edesur', 'USD MM', 'Desglose de facturación EGPC', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'egpc-total-facturado'), 3)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'egpc-punta-catalina'),
   'Edeeste', 'egpc-facturado-edeeste', 'USD MM', 'Desglose de facturación EGPC', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'egpc-total-facturado'), 3)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'egpc-punta-catalina'),
   'Mercado Spot', 'egpc-facturado-mercado-spot', 'USD MM', 'Desglose de facturación EGPC', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'egpc-total-facturado'), 3)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'egpc-punta-catalina'),
   'Costos Directos', 'egpc-costos-directos', 'USD MM', 'Desglose de costos de producción EGPC', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'egpc-costos-produccion'), 4)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'egpc-punta-catalina'),
   'Cargos del Mercado Eléctrico Mayorista', 'egpc-cargos-mem', 'USD MM', 'Desglose de costos de producción EGPC', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'egpc-costos-produccion'), 4)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'egpc-punta-catalina'),
   'Costos Personal Producción', 'egpc-costos-personal-produccion', 'USD MM', 'Desglose de costos de producción EGPC', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'egpc-costos-produccion'), 4)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'egpc-punta-catalina'),
   'Otros Costos Operativos de Producción', 'egpc-otros-costos-produccion', 'USD MM', 'Desglose de costos de producción EGPC', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'egpc-costos-produccion'), 4)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'egpc-punta-catalina'),
   'Gastos de Personal', 'egpc-gastos-personal', 'USD MM', 'Desglose de gastos operativos EGPC', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'egpc-gastos-operativos'), 5)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'egpc-punta-catalina'),
   'Servicios No Personales', 'egpc-servicios-no-personales', 'USD MM', 'Desglose de gastos operativos EGPC', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'egpc-gastos-operativos'), 5)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'egpc-punta-catalina'),
   'Materiales y Suministros', 'egpc-materiales-suministros', 'USD MM', 'Desglose de gastos operativos EGPC', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'egpc-gastos-operativos'), 5)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'egpc-punta-catalina'),
   'Gastos por Aporte Sector Eléctrico', 'egpc-gastos-aporte-sector', 'USD MM', 'Desglose de gastos operativos EGPC', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'egpc-gastos-operativos'), 5)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'egpc-punta-catalina'),
   'Empleados Fijos', 'egpc-empleados-fijos', 'empleados', 'Desglose de empleados EGPC', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'egpc-empleados'), 11)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'egpc-punta-catalina'),
   'Dieta Militares', 'egpc-empleados-dieta-militares', 'empleados', 'Desglose de empleados EGPC', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'egpc-empleados'), 11)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- RESULTADOS FINANCIEROS: Indicadores clave por entidad
-- (Versión simplificada: indicadores principales, no las 57 filas completas)
-- ============================================================
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'resultados-financieros'),
   'Total Ingresos', 'rf-total-ingresos', 'USD MM',
   'Total Ingresos — Resultados Financieros', 'bar', false,
   (SELECT id FROM entities WHERE slug = 'edes-consolidado'), 1)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'resultados-financieros'),
   'Total Ingresos - Edenorte', 'rf-total-ingresos-edenorte', 'USD MM',
   'Total Ingresos - Edenorte', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edenorte'),
   (SELECT id FROM indicators WHERE slug = 'rf-total-ingresos'), 1)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'resultados-financieros'),
   'Total Ingresos - Edesur', 'rf-total-ingresos-edesur', 'USD MM',
   'Total Ingresos - Edesur', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edesur'),
   (SELECT id FROM indicators WHERE slug = 'rf-total-ingresos'), 1)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'resultados-financieros'),
   'Total Ingresos - Edeeste', 'rf-total-ingresos-edeeste', 'USD MM',
   'Total Ingresos - Edeeste', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edeeste'),
   (SELECT id FROM indicators WHERE slug = 'rf-total-ingresos'), 1)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'resultados-financieros'),
   'Total Ingresos - EGEHID', 'rf-total-ingresos-egehid', 'USD MM',
   'Total Ingresos - EGEHID', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'egehid'),
   (SELECT id FROM indicators WHERE slug = 'rf-total-ingresos'), 1)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'resultados-financieros'),
   'Total Ingresos - ETED', 'rf-total-ingresos-eted', 'USD MM',
   'Total Ingresos - ETED', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'eted'),
   (SELECT id FROM indicators WHERE slug = 'rf-total-ingresos'), 1)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'resultados-financieros'),
   'Total Ingresos - EGEPC', 'rf-total-ingresos-egpc', 'USD MM',
   'Total Ingresos - EGEPC', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'egpc'),
   (SELECT id FROM indicators WHERE slug = 'rf-total-ingresos'), 1)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'resultados-financieros'),
   'Ingresos por Venta de Energía', 'rf-ingresos-por-venta-de-energia', 'USD MM',
   'Ingresos por Venta de Energía — Resultados Financieros', 'bar', false,
   (SELECT id FROM entities WHERE slug = 'edes-consolidado'), 2)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'resultados-financieros'),
   'Ingresos por Venta de Energía - Edenorte', 'rf-ingresos-por-venta-de-energia-edenorte', 'USD MM',
   'Ingresos por Venta de Energía - Edenorte', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edenorte'),
   (SELECT id FROM indicators WHERE slug = 'rf-ingresos-por-venta-de-energia'), 2)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'resultados-financieros'),
   'Ingresos por Venta de Energía - Edesur', 'rf-ingresos-por-venta-de-energia-edesur', 'USD MM',
   'Ingresos por Venta de Energía - Edesur', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edesur'),
   (SELECT id FROM indicators WHERE slug = 'rf-ingresos-por-venta-de-energia'), 2)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'resultados-financieros'),
   'Ingresos por Venta de Energía - Edeeste', 'rf-ingresos-por-venta-de-energia-edeeste', 'USD MM',
   'Ingresos por Venta de Energía - Edeeste', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edeeste'),
   (SELECT id FROM indicators WHERE slug = 'rf-ingresos-por-venta-de-energia'), 2)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'resultados-financieros'),
   'Ingresos por Venta de Energía - EGEHID', 'rf-ingresos-por-venta-de-energia-egehid', 'USD MM',
   'Ingresos por Venta de Energía - EGEHID', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'egehid'),
   (SELECT id FROM indicators WHERE slug = 'rf-ingresos-por-venta-de-energia'), 2)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'resultados-financieros'),
   'Ingresos por Venta de Energía - ETED', 'rf-ingresos-por-venta-de-energia-eted', 'USD MM',
   'Ingresos por Venta de Energía - ETED', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'eted'),
   (SELECT id FROM indicators WHERE slug = 'rf-ingresos-por-venta-de-energia'), 2)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'resultados-financieros'),
   'Ingresos por Venta de Energía - EGEPC', 'rf-ingresos-por-venta-de-energia-egpc', 'USD MM',
   'Ingresos por Venta de Energía - EGEPC', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'egpc'),
   (SELECT id FROM indicators WHERE slug = 'rf-ingresos-por-venta-de-energia'), 2)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'resultados-financieros'),
   'Total Gastos', 'rf-total-gastos', 'USD MM',
   'Total Gastos — Resultados Financieros', 'bar', false,
   (SELECT id FROM entities WHERE slug = 'edes-consolidado'), 3)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'resultados-financieros'),
   'Total Gastos - Edenorte', 'rf-total-gastos-edenorte', 'USD MM',
   'Total Gastos - Edenorte', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edenorte'),
   (SELECT id FROM indicators WHERE slug = 'rf-total-gastos'), 3)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'resultados-financieros'),
   'Total Gastos - Edesur', 'rf-total-gastos-edesur', 'USD MM',
   'Total Gastos - Edesur', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edesur'),
   (SELECT id FROM indicators WHERE slug = 'rf-total-gastos'), 3)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'resultados-financieros'),
   'Total Gastos - Edeeste', 'rf-total-gastos-edeeste', 'USD MM',
   'Total Gastos - Edeeste', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edeeste'),
   (SELECT id FROM indicators WHERE slug = 'rf-total-gastos'), 3)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'resultados-financieros'),
   'Total Gastos - EGEHID', 'rf-total-gastos-egehid', 'USD MM',
   'Total Gastos - EGEHID', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'egehid'),
   (SELECT id FROM indicators WHERE slug = 'rf-total-gastos'), 3)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'resultados-financieros'),
   'Total Gastos - ETED', 'rf-total-gastos-eted', 'USD MM',
   'Total Gastos - ETED', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'eted'),
   (SELECT id FROM indicators WHERE slug = 'rf-total-gastos'), 3)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'resultados-financieros'),
   'Total Gastos - EGEPC', 'rf-total-gastos-egpc', 'USD MM',
   'Total Gastos - EGEPC', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'egpc'),
   (SELECT id FROM indicators WHERE slug = 'rf-total-gastos'), 3)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'resultados-financieros'),
   'Compra de Energía', 'rf-compra-de-energia', 'USD MM',
   'Compra de Energía — Resultados Financieros', 'bar', false,
   (SELECT id FROM entities WHERE slug = 'edes-consolidado'), 4)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'resultados-financieros'),
   'Compra de Energía - Edenorte', 'rf-compra-de-energia-edenorte', 'USD MM',
   'Compra de Energía - Edenorte', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edenorte'),
   (SELECT id FROM indicators WHERE slug = 'rf-compra-de-energia'), 4)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'resultados-financieros'),
   'Compra de Energía - Edesur', 'rf-compra-de-energia-edesur', 'USD MM',
   'Compra de Energía - Edesur', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edesur'),
   (SELECT id FROM indicators WHERE slug = 'rf-compra-de-energia'), 4)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'resultados-financieros'),
   'Compra de Energía - Edeeste', 'rf-compra-de-energia-edeeste', 'USD MM',
   'Compra de Energía - Edeeste', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edeeste'),
   (SELECT id FROM indicators WHERE slug = 'rf-compra-de-energia'), 4)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'resultados-financieros'),
   'Compra de Energía - EGEHID', 'rf-compra-de-energia-egehid', 'USD MM',
   'Compra de Energía - EGEHID', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'egehid'),
   (SELECT id FROM indicators WHERE slug = 'rf-compra-de-energia'), 4)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'resultados-financieros'),
   'Compra de Energía - ETED', 'rf-compra-de-energia-eted', 'USD MM',
   'Compra de Energía - ETED', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'eted'),
   (SELECT id FROM indicators WHERE slug = 'rf-compra-de-energia'), 4)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'resultados-financieros'),
   'Compra de Energía - EGEPC', 'rf-compra-de-energia-egpc', 'USD MM',
   'Compra de Energía - EGEPC', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'egpc'),
   (SELECT id FROM indicators WHERE slug = 'rf-compra-de-energia'), 4)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'resultados-financieros'),
   'Gastos Operativos (OPEX)', 'rf-gastos-operativos', 'USD MM',
   'Gastos Operativos (OPEX) — Resultados Financieros', 'bar', false,
   (SELECT id FROM entities WHERE slug = 'edes-consolidado'), 5)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'resultados-financieros'),
   'Gastos Operativos (OPEX) - Edenorte', 'rf-gastos-operativos-edenorte', 'USD MM',
   'Gastos Operativos (OPEX) - Edenorte', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edenorte'),
   (SELECT id FROM indicators WHERE slug = 'rf-gastos-operativos'), 5)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'resultados-financieros'),
   'Gastos Operativos (OPEX) - Edesur', 'rf-gastos-operativos-edesur', 'USD MM',
   'Gastos Operativos (OPEX) - Edesur', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edesur'),
   (SELECT id FROM indicators WHERE slug = 'rf-gastos-operativos'), 5)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'resultados-financieros'),
   'Gastos Operativos (OPEX) - Edeeste', 'rf-gastos-operativos-edeeste', 'USD MM',
   'Gastos Operativos (OPEX) - Edeeste', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edeeste'),
   (SELECT id FROM indicators WHERE slug = 'rf-gastos-operativos'), 5)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'resultados-financieros'),
   'Gastos Operativos (OPEX) - EGEHID', 'rf-gastos-operativos-egehid', 'USD MM',
   'Gastos Operativos (OPEX) - EGEHID', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'egehid'),
   (SELECT id FROM indicators WHERE slug = 'rf-gastos-operativos'), 5)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'resultados-financieros'),
   'Gastos Operativos (OPEX) - ETED', 'rf-gastos-operativos-eted', 'USD MM',
   'Gastos Operativos (OPEX) - ETED', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'eted'),
   (SELECT id FROM indicators WHERE slug = 'rf-gastos-operativos'), 5)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'resultados-financieros'),
   'Gastos Operativos (OPEX) - EGEPC', 'rf-gastos-operativos-egpc', 'USD MM',
   'Gastos Operativos (OPEX) - EGEPC', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'egpc'),
   (SELECT id FROM indicators WHERE slug = 'rf-gastos-operativos'), 5)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'resultados-financieros'),
   'Gastos Financieros', 'rf-gastos-financieros', 'USD MM',
   'Gastos Financieros — Resultados Financieros', 'bar', false,
   (SELECT id FROM entities WHERE slug = 'edes-consolidado'), 6)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'resultados-financieros'),
   'Gastos Financieros - Edenorte', 'rf-gastos-financieros-edenorte', 'USD MM',
   'Gastos Financieros - Edenorte', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edenorte'),
   (SELECT id FROM indicators WHERE slug = 'rf-gastos-financieros'), 6)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'resultados-financieros'),
   'Gastos Financieros - Edesur', 'rf-gastos-financieros-edesur', 'USD MM',
   'Gastos Financieros - Edesur', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edesur'),
   (SELECT id FROM indicators WHERE slug = 'rf-gastos-financieros'), 6)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'resultados-financieros'),
   'Gastos Financieros - Edeeste', 'rf-gastos-financieros-edeeste', 'USD MM',
   'Gastos Financieros - Edeeste', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edeeste'),
   (SELECT id FROM indicators WHERE slug = 'rf-gastos-financieros'), 6)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'resultados-financieros'),
   'Gastos Financieros - EGEHID', 'rf-gastos-financieros-egehid', 'USD MM',
   'Gastos Financieros - EGEHID', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'egehid'),
   (SELECT id FROM indicators WHERE slug = 'rf-gastos-financieros'), 6)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'resultados-financieros'),
   'Gastos Financieros - ETED', 'rf-gastos-financieros-eted', 'USD MM',
   'Gastos Financieros - ETED', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'eted'),
   (SELECT id FROM indicators WHERE slug = 'rf-gastos-financieros'), 6)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'resultados-financieros'),
   'Gastos Financieros - EGEPC', 'rf-gastos-financieros-egpc', 'USD MM',
   'Gastos Financieros - EGEPC', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'egpc'),
   (SELECT id FROM indicators WHERE slug = 'rf-gastos-financieros'), 6)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'resultados-financieros'),
   'Balance Operacional', 'rf-balance-operacional', 'USD MM',
   'Balance Operacional — Resultados Financieros', 'bar', false,
   (SELECT id FROM entities WHERE slug = 'edes-consolidado'), 7)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'resultados-financieros'),
   'Balance Operacional - Edenorte', 'rf-balance-operacional-edenorte', 'USD MM',
   'Balance Operacional - Edenorte', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edenorte'),
   (SELECT id FROM indicators WHERE slug = 'rf-balance-operacional'), 7)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'resultados-financieros'),
   'Balance Operacional - Edesur', 'rf-balance-operacional-edesur', 'USD MM',
   'Balance Operacional - Edesur', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edesur'),
   (SELECT id FROM indicators WHERE slug = 'rf-balance-operacional'), 7)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'resultados-financieros'),
   'Balance Operacional - Edeeste', 'rf-balance-operacional-edeeste', 'USD MM',
   'Balance Operacional - Edeeste', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edeeste'),
   (SELECT id FROM indicators WHERE slug = 'rf-balance-operacional'), 7)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'resultados-financieros'),
   'Balance Operacional - EGEHID', 'rf-balance-operacional-egehid', 'USD MM',
   'Balance Operacional - EGEHID', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'egehid'),
   (SELECT id FROM indicators WHERE slug = 'rf-balance-operacional'), 7)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'resultados-financieros'),
   'Balance Operacional - ETED', 'rf-balance-operacional-eted', 'USD MM',
   'Balance Operacional - ETED', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'eted'),
   (SELECT id FROM indicators WHERE slug = 'rf-balance-operacional'), 7)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'resultados-financieros'),
   'Balance Operacional - EGEPC', 'rf-balance-operacional-egpc', 'USD MM',
   'Balance Operacional - EGEPC', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'egpc'),
   (SELECT id FROM indicators WHERE slug = 'rf-balance-operacional'), 7)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'resultados-financieros'),
   'Inversiones (CAPEX)', 'rf-inversiones', 'USD MM',
   'Inversiones (CAPEX) — Resultados Financieros', 'bar', false,
   (SELECT id FROM entities WHERE slug = 'edes-consolidado'), 8)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'resultados-financieros'),
   'Inversiones (CAPEX) - Edenorte', 'rf-inversiones-edenorte', 'USD MM',
   'Inversiones (CAPEX) - Edenorte', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edenorte'),
   (SELECT id FROM indicators WHERE slug = 'rf-inversiones'), 8)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'resultados-financieros'),
   'Inversiones (CAPEX) - Edesur', 'rf-inversiones-edesur', 'USD MM',
   'Inversiones (CAPEX) - Edesur', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edesur'),
   (SELECT id FROM indicators WHERE slug = 'rf-inversiones'), 8)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'resultados-financieros'),
   'Inversiones (CAPEX) - Edeeste', 'rf-inversiones-edeeste', 'USD MM',
   'Inversiones (CAPEX) - Edeeste', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edeeste'),
   (SELECT id FROM indicators WHERE slug = 'rf-inversiones'), 8)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'resultados-financieros'),
   'Inversiones (CAPEX) - EGEHID', 'rf-inversiones-egehid', 'USD MM',
   'Inversiones (CAPEX) - EGEHID', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'egehid'),
   (SELECT id FROM indicators WHERE slug = 'rf-inversiones'), 8)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'resultados-financieros'),
   'Inversiones (CAPEX) - ETED', 'rf-inversiones-eted', 'USD MM',
   'Inversiones (CAPEX) - ETED', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'eted'),
   (SELECT id FROM indicators WHERE slug = 'rf-inversiones'), 8)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'resultados-financieros'),
   'Inversiones (CAPEX) - EGEPC', 'rf-inversiones-egpc', 'USD MM',
   'Inversiones (CAPEX) - EGEPC', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'egpc'),
   (SELECT id FROM indicators WHERE slug = 'rf-inversiones'), 8)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'resultados-financieros'),
   'Balance con Inversiones', 'rf-balance-con-inversiones', 'USD MM',
   'Balance con Inversiones — Resultados Financieros', 'bar', false,
   (SELECT id FROM entities WHERE slug = 'edes-consolidado'), 9)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'resultados-financieros'),
   'Balance con Inversiones - Edenorte', 'rf-balance-con-inversiones-edenorte', 'USD MM',
   'Balance con Inversiones - Edenorte', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edenorte'),
   (SELECT id FROM indicators WHERE slug = 'rf-balance-con-inversiones'), 9)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'resultados-financieros'),
   'Balance con Inversiones - Edesur', 'rf-balance-con-inversiones-edesur', 'USD MM',
   'Balance con Inversiones - Edesur', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edesur'),
   (SELECT id FROM indicators WHERE slug = 'rf-balance-con-inversiones'), 9)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'resultados-financieros'),
   'Balance con Inversiones - Edeeste', 'rf-balance-con-inversiones-edeeste', 'USD MM',
   'Balance con Inversiones - Edeeste', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edeeste'),
   (SELECT id FROM indicators WHERE slug = 'rf-balance-con-inversiones'), 9)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'resultados-financieros'),
   'Balance con Inversiones - EGEHID', 'rf-balance-con-inversiones-egehid', 'USD MM',
   'Balance con Inversiones - EGEHID', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'egehid'),
   (SELECT id FROM indicators WHERE slug = 'rf-balance-con-inversiones'), 9)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'resultados-financieros'),
   'Balance con Inversiones - ETED', 'rf-balance-con-inversiones-eted', 'USD MM',
   'Balance con Inversiones - ETED', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'eted'),
   (SELECT id FROM indicators WHERE slug = 'rf-balance-con-inversiones'), 9)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'resultados-financieros'),
   'Balance con Inversiones - EGEPC', 'rf-balance-con-inversiones-egpc', 'USD MM',
   'Balance con Inversiones - EGEPC', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'egpc'),
   (SELECT id FROM indicators WHERE slug = 'rf-balance-con-inversiones'), 9)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'resultados-financieros'),
   'Financiamiento', 'rf-financiamiento', 'USD MM',
   'Financiamiento — Resultados Financieros', 'bar', false,
   (SELECT id FROM entities WHERE slug = 'edes-consolidado'), 10)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'resultados-financieros'),
   'Financiamiento - Edenorte', 'rf-financiamiento-edenorte', 'USD MM',
   'Financiamiento - Edenorte', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edenorte'),
   (SELECT id FROM indicators WHERE slug = 'rf-financiamiento'), 10)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'resultados-financieros'),
   'Financiamiento - Edesur', 'rf-financiamiento-edesur', 'USD MM',
   'Financiamiento - Edesur', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edesur'),
   (SELECT id FROM indicators WHERE slug = 'rf-financiamiento'), 10)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'resultados-financieros'),
   'Financiamiento - Edeeste', 'rf-financiamiento-edeeste', 'USD MM',
   'Financiamiento - Edeeste', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edeeste'),
   (SELECT id FROM indicators WHERE slug = 'rf-financiamiento'), 10)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'resultados-financieros'),
   'Financiamiento - EGEHID', 'rf-financiamiento-egehid', 'USD MM',
   'Financiamiento - EGEHID', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'egehid'),
   (SELECT id FROM indicators WHERE slug = 'rf-financiamiento'), 10)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'resultados-financieros'),
   'Financiamiento - ETED', 'rf-financiamiento-eted', 'USD MM',
   'Financiamiento - ETED', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'eted'),
   (SELECT id FROM indicators WHERE slug = 'rf-financiamiento'), 10)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'resultados-financieros'),
   'Financiamiento - EGEPC', 'rf-financiamiento-egpc', 'USD MM',
   'Financiamiento - EGEPC', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'egpc'),
   (SELECT id FROM indicators WHERE slug = 'rf-financiamiento'), 10)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'resultados-financieros'),
   'Balance luego de Financiamiento', 'rf-balance-luego-de-financiamiento', 'USD MM',
   'Balance luego de Financiamiento — Resultados Financieros', 'bar', false,
   (SELECT id FROM entities WHERE slug = 'edes-consolidado'), 11)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'resultados-financieros'),
   'Balance luego de Financiamiento - Edenorte', 'rf-balance-luego-de-financiamiento-edenorte', 'USD MM',
   'Balance luego de Financiamiento - Edenorte', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edenorte'),
   (SELECT id FROM indicators WHERE slug = 'rf-balance-luego-de-financiamiento'), 11)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'resultados-financieros'),
   'Balance luego de Financiamiento - Edesur', 'rf-balance-luego-de-financiamiento-edesur', 'USD MM',
   'Balance luego de Financiamiento - Edesur', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edesur'),
   (SELECT id FROM indicators WHERE slug = 'rf-balance-luego-de-financiamiento'), 11)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'resultados-financieros'),
   'Balance luego de Financiamiento - Edeeste', 'rf-balance-luego-de-financiamiento-edeeste', 'USD MM',
   'Balance luego de Financiamiento - Edeeste', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'edeeste'),
   (SELECT id FROM indicators WHERE slug = 'rf-balance-luego-de-financiamiento'), 11)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'resultados-financieros'),
   'Balance luego de Financiamiento - EGEHID', 'rf-balance-luego-de-financiamiento-egehid', 'USD MM',
   'Balance luego de Financiamiento - EGEHID', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'egehid'),
   (SELECT id FROM indicators WHERE slug = 'rf-balance-luego-de-financiamiento'), 11)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'resultados-financieros'),
   'Balance luego de Financiamiento - ETED', 'rf-balance-luego-de-financiamiento-eted', 'USD MM',
   'Balance luego de Financiamiento - ETED', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'eted'),
   (SELECT id FROM indicators WHERE slug = 'rf-balance-luego-de-financiamiento'), 11)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'resultados-financieros'),
   'Balance luego de Financiamiento - EGEPC', 'rf-balance-luego-de-financiamiento-egpc', 'USD MM',
   'Balance luego de Financiamiento - EGEPC', 'bar', true,
   (SELECT id FROM entities WHERE slug = 'egpc'),
   (SELECT id FROM indicators WHERE slug = 'rf-balance-luego-de-financiamiento'), 11)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- DEUDA CON GENERADORAS: Indicadores principales
-- (Versión simplificada: totales por entidad)
-- ============================================================
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'deuda-generadoras'),
   'Deuda Corriente Total EDEs (USD MM)', 'deuda-corriente-total-edes', 'USD MM',
   'Deuda Corriente Total EDEs (USD MM)', 'bar', false, (SELECT id FROM entities WHERE slug = 'edes-consolidado'), 1)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'deuda-generadoras'),
   'Deuda Corriente Edenorte (USD MM)', 'deuda-corriente-edenorte', 'USD MM',
   'Deuda Corriente Edenorte (USD MM)', 'bar', false, (SELECT id FROM entities WHERE slug = 'edenorte'), 2)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'deuda-generadoras'),
   'Deuda Corriente Edesur (USD MM)', 'deuda-corriente-edesur', 'USD MM',
   'Deuda Corriente Edesur (USD MM)', 'bar', false, (SELECT id FROM entities WHERE slug = 'edesur'), 3)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'deuda-generadoras'),
   'Deuda Corriente Edeeste (USD MM)', 'deuda-corriente-edeeste', 'USD MM',
   'Deuda Corriente Edeeste (USD MM)', 'bar', false, (SELECT id FROM entities WHERE slug = 'edeeste'), 4)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'deuda-generadoras'),
   'Deuda Corriente CDEEE (USD MM)', 'deuda-corriente-cdeee', 'USD MM',
   'Deuda Corriente CDEEE (USD MM)', 'bar', false, (SELECT id FROM entities WHERE slug = 'cdeee'), 5)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'deuda-generadoras'),
   'Deuda Congelada Total (USD MM)', 'deuda-congelada-total', 'USD MM',
   'Deuda Congelada Total (USD MM)', 'bar', false, NULL, 6)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'deuda-generadoras'),
   'Pagos por Compra de Energía - Generadores Privados (USD MM)', 'pagos-generadores-privados', 'USD MM',
   'Pagos por Compra de Energía - Generadores Privados (USD MM)', 'bar', false, NULL, 7)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, entity_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'deuda-generadoras'),
   'Pagos por Compra de Energía - CDEEE/EGEHID/ETED (USD MM)', 'pagos-cdeee-egehid-eted', 'USD MM',
   'Pagos por Compra de Energía - CDEEE/EGEHID/ETED (USD MM)', 'bar', false, NULL, 8)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- NUEVO RÉGIMEN TARIFARIO: Cargos por tarifa y concepto
-- ============================================================
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'regimen-tarifario'),
   'BTS1 - Baja Tensión Servicio 1 (Residencial)', 'nt-bts1', 'RD$',
   'Tarifa BTS1 — Nuevo Régimen Tarifario', 'bar', false, 1)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'regimen-tarifario'),
   'BTS1 - Cargo Fijo (0-100 kWh)', 'nt-bts1-cargo-fijo-0-100', 'RD$',
   'Cargo Fijo (0-100 kWh) - Tarifa BTS1', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'nt-bts1'), 1)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'regimen-tarifario'),
   'BTS1 - Cargo Fijo (101+ kWh)', 'nt-bts1-cargo-fijo-101-mas', 'RD$',
   'Cargo Fijo (101+ kWh) - Tarifa BTS1', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'nt-bts1'), 1)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'regimen-tarifario'),
   'BTS1 - Cargo por Energía (0-200 kWh)', 'nt-bts1-cargo-energia-0-200', 'RD$',
   'Cargo por Energía (0-200 kWh) - Tarifa BTS1', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'nt-bts1'), 1)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'regimen-tarifario'),
   'BTS1 - Cargo por Energía (201-300 kWh)', 'nt-bts1-cargo-energia-201-300', 'RD$',
   'Cargo por Energía (201-300 kWh) - Tarifa BTS1', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'nt-bts1'), 1)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'regimen-tarifario'),
   'BTS1 - Cargo por Energía (301-700 kWh)', 'nt-bts1-cargo-energia-301-700', 'RD$',
   'Cargo por Energía (301-700 kWh) - Tarifa BTS1', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'nt-bts1'), 1)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'regimen-tarifario'),
   'BTS1 - Cargo por Energía (701+ kWh)', 'nt-bts1-cargo-energia-701-mas', 'RD$',
   'Cargo por Energía (701+ kWh) - Tarifa BTS1', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'nt-bts1'), 1)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'regimen-tarifario'),
   'BTS2 - Baja Tensión Servicio 2 (Residencial)', 'nt-bts2', 'RD$',
   'Tarifa BTS2 — Nuevo Régimen Tarifario', 'bar', false, 2)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'regimen-tarifario'),
   'BTS2 - Cargo Fijo', 'nt-bts2-cargo-fijo', 'RD$',
   'Cargo Fijo - Tarifa BTS2', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'nt-bts2'), 2)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'regimen-tarifario'),
   'BTS2 - Cargo por Energía (0-200 kWh)', 'nt-bts2-cargo-energia-0-200', 'RD$',
   'Cargo por Energía (0-200 kWh) - Tarifa BTS2', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'nt-bts2'), 2)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'regimen-tarifario'),
   'BTS2 - Cargo por Energía (201-300 kWh)', 'nt-bts2-cargo-energia-201-300', 'RD$',
   'Cargo por Energía (201-300 kWh) - Tarifa BTS2', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'nt-bts2'), 2)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'regimen-tarifario'),
   'BTS2 - Cargo por Energía (301-700 kWh)', 'nt-bts2-cargo-energia-301-700', 'RD$',
   'Cargo por Energía (301-700 kWh) - Tarifa BTS2', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'nt-bts2'), 2)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'regimen-tarifario'),
   'BTS2 - Cargo por Energía (701+ kWh)', 'nt-bts2-cargo-energia-701-mas', 'RD$',
   'Cargo por Energía (701+ kWh) - Tarifa BTS2', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'nt-bts2'), 2)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'regimen-tarifario'),
   'BTD - Baja Tensión Demanda (Comercial)', 'nt-btd', 'RD$',
   'Tarifa BTD — Nuevo Régimen Tarifario', 'bar', false, 3)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'regimen-tarifario'),
   'BTD - Cargo Fijo', 'nt-btd-cargo-fijo', 'RD$',
   'Cargo Fijo - Tarifa BTD', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'nt-btd'), 3)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'regimen-tarifario'),
   'BTD - Energía', 'nt-btd-energia', 'RD$',
   'Energía - Tarifa BTD', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'nt-btd'), 3)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'regimen-tarifario'),
   'BTD - Potencia Máxima', 'nt-btd-potencia-maxima', 'RD$',
   'Potencia Máxima - Tarifa BTD', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'nt-btd'), 3)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'regimen-tarifario'),
   'BTH - Baja Tensión Horaria (Comercial)', 'nt-bth', 'RD$',
   'Tarifa BTH — Nuevo Régimen Tarifario', 'bar', false, 4)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'regimen-tarifario'),
   'BTH - Cargo Fijo', 'nt-bth-cargo-fijo', 'RD$',
   'Cargo Fijo - Tarifa BTH', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'nt-bth'), 4)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'regimen-tarifario'),
   'BTH - Energía', 'nt-bth-energia', 'RD$',
   'Energía - Tarifa BTH', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'nt-bth'), 4)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'regimen-tarifario'),
   'BTH - Potencia Máxima fuera de punta', 'nt-bth-potencia-maxima-fuera-punta', 'RD$',
   'Potencia Máxima fuera de punta - Tarifa BTH', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'nt-bth'), 4)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'regimen-tarifario'),
   'BTH - Potencia Máxima en horas de punta', 'nt-bth-potencia-maxima-horas-punta', 'RD$',
   'Potencia Máxima en horas de punta - Tarifa BTH', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'nt-bth'), 4)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'regimen-tarifario'),
   'MTD1 - Media Tensión Demanda 1 (Industrial)', 'nt-mtd1', 'RD$',
   'Tarifa MTD1 — Nuevo Régimen Tarifario', 'bar', false, 5)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'regimen-tarifario'),
   'MTD1 - Cargo Fijo', 'nt-mtd1-cargo-fijo', 'RD$',
   'Cargo Fijo - Tarifa MTD1', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'nt-mtd1'), 5)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'regimen-tarifario'),
   'MTD1 - Energía', 'nt-mtd1-energia', 'RD$',
   'Energía - Tarifa MTD1', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'nt-mtd1'), 5)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'regimen-tarifario'),
   'MTD1 - Potencia Máxima', 'nt-mtd1-potencia-maxima', 'RD$',
   'Potencia Máxima - Tarifa MTD1', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'nt-mtd1'), 5)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'regimen-tarifario'),
   'MTD2 - Media Tensión Demanda 2 (Industrial)', 'nt-mtd2', 'RD$',
   'Tarifa MTD2 — Nuevo Régimen Tarifario', 'bar', false, 6)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'regimen-tarifario'),
   'MTD2 - Cargo Fijo', 'nt-mtd2-cargo-fijo', 'RD$',
   'Cargo Fijo - Tarifa MTD2', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'nt-mtd2'), 6)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'regimen-tarifario'),
   'MTD2 - Energía', 'nt-mtd2-energia', 'RD$',
   'Energía - Tarifa MTD2', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'nt-mtd2'), 6)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'regimen-tarifario'),
   'MTD2 - Potencia Máxima', 'nt-mtd2-potencia-maxima', 'RD$',
   'Potencia Máxima - Tarifa MTD2', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'nt-mtd2'), 6)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'regimen-tarifario'),
   'MTH - Media Tensión Horaria (Industrial)', 'nt-mth', 'RD$',
   'Tarifa MTH — Nuevo Régimen Tarifario', 'bar', false, 7)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'regimen-tarifario'),
   'MTH - Cargo Fijo', 'nt-mth-cargo-fijo', 'RD$',
   'Cargo Fijo - Tarifa MTH', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'nt-mth'), 7)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'regimen-tarifario'),
   'MTH - Energía', 'nt-mth-energia', 'RD$',
   'Energía - Tarifa MTH', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'nt-mth'), 7)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'regimen-tarifario'),
   'MTH - Potencia Máxima fuera de punta', 'nt-mth-potencia-maxima-fuera-punta', 'RD$',
   'Potencia Máxima fuera de punta - Tarifa MTH', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'nt-mth'), 7)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'regimen-tarifario'),
   'MTH - Potencia Máxima en horas de punta', 'nt-mth-potencia-maxima-horas-punta', 'RD$',
   'Potencia Máxima en horas de punta - Tarifa MTH', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'nt-mth'), 7)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- RÉGIMEN TARIFARIO ANTERIOR: Cargos por tarifa y concepto
-- ============================================================
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'regimen-tarifario-anterior'),
   'BTS1 - Baja Tensión Servicio 1 (Residencial)', 'at-bts1', 'RD$',
   'Tarifa BTS1 — Régimen Tarifario Anterior', 'bar', false, 1)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'regimen-tarifario-anterior'),
   'BTS1 - Cargo Fijo (0-100 kWh)', 'at-bts1-cargo-fijo-0-100', 'RD$',
   'Cargo Fijo (0-100 kWh) - Tarifa BTS1 (Anterior)', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'at-bts1'), 1)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'regimen-tarifario-anterior'),
   'BTS1 - Cargo Fijo (101+ kWh)', 'at-bts1-cargo-fijo-101-mas', 'RD$',
   'Cargo Fijo (101+ kWh) - Tarifa BTS1 (Anterior)', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'at-bts1'), 1)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'regimen-tarifario-anterior'),
   'BTS1 - Cargo por Energía (0-200 kWh)', 'at-bts1-cargo-energia-0-200', 'RD$',
   'Cargo por Energía (0-200 kWh) - Tarifa BTS1 (Anterior)', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'at-bts1'), 1)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'regimen-tarifario-anterior'),
   'BTS1 - Cargo por Energía (201-300 kWh)', 'at-bts1-cargo-energia-201-300', 'RD$',
   'Cargo por Energía (201-300 kWh) - Tarifa BTS1 (Anterior)', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'at-bts1'), 1)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'regimen-tarifario-anterior'),
   'BTS1 - Cargo por Energía (301-700 kWh)', 'at-bts1-cargo-energia-301-700', 'RD$',
   'Cargo por Energía (301-700 kWh) - Tarifa BTS1 (Anterior)', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'at-bts1'), 1)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'regimen-tarifario-anterior'),
   'BTS1 - Cargo por Energía (701+ kWh)', 'at-bts1-cargo-energia-701-mas', 'RD$',
   'Cargo por Energía (701+ kWh) - Tarifa BTS1 (Anterior)', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'at-bts1'), 1)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'regimen-tarifario-anterior'),
   'BTS2 - Baja Tensión Servicio 2 (Residencial)', 'at-bts2', 'RD$',
   'Tarifa BTS2 — Régimen Tarifario Anterior', 'bar', false, 2)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'regimen-tarifario-anterior'),
   'BTS2 - Cargo Fijo', 'at-bts2-cargo-fijo', 'RD$',
   'Cargo Fijo - Tarifa BTS2 (Anterior)', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'at-bts2'), 2)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'regimen-tarifario-anterior'),
   'BTS2 - Cargo por Energía (0-200 kWh)', 'at-bts2-cargo-energia-0-200', 'RD$',
   'Cargo por Energía (0-200 kWh) - Tarifa BTS2 (Anterior)', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'at-bts2'), 2)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'regimen-tarifario-anterior'),
   'BTS2 - Cargo por Energía (201-300 kWh)', 'at-bts2-cargo-energia-201-300', 'RD$',
   'Cargo por Energía (201-300 kWh) - Tarifa BTS2 (Anterior)', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'at-bts2'), 2)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'regimen-tarifario-anterior'),
   'BTS2 - Cargo por Energía (301-700 kWh)', 'at-bts2-cargo-energia-301-700', 'RD$',
   'Cargo por Energía (301-700 kWh) - Tarifa BTS2 (Anterior)', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'at-bts2'), 2)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'regimen-tarifario-anterior'),
   'BTS2 - Cargo por Energía (701+ kWh)', 'at-bts2-cargo-energia-701-mas', 'RD$',
   'Cargo por Energía (701+ kWh) - Tarifa BTS2 (Anterior)', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'at-bts2'), 2)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'regimen-tarifario-anterior'),
   'BTD - Baja Tensión Demanda (Comercial)', 'at-btd', 'RD$',
   'Tarifa BTD — Régimen Tarifario Anterior', 'bar', false, 3)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'regimen-tarifario-anterior'),
   'BTD - Cargo Fijo', 'at-btd-cargo-fijo', 'RD$',
   'Cargo Fijo - Tarifa BTD (Anterior)', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'at-btd'), 3)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'regimen-tarifario-anterior'),
   'BTD - Energía', 'at-btd-energia', 'RD$',
   'Energía - Tarifa BTD (Anterior)', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'at-btd'), 3)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'regimen-tarifario-anterior'),
   'BTD - Potencia Máxima', 'at-btd-potencia-maxima', 'RD$',
   'Potencia Máxima - Tarifa BTD (Anterior)', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'at-btd'), 3)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'regimen-tarifario-anterior'),
   'BTH - Baja Tensión Horaria (Comercial)', 'at-bth', 'RD$',
   'Tarifa BTH — Régimen Tarifario Anterior', 'bar', false, 4)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'regimen-tarifario-anterior'),
   'BTH - Cargo Fijo', 'at-bth-cargo-fijo', 'RD$',
   'Cargo Fijo - Tarifa BTH (Anterior)', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'at-bth'), 4)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'regimen-tarifario-anterior'),
   'BTH - Energía', 'at-bth-energia', 'RD$',
   'Energía - Tarifa BTH (Anterior)', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'at-bth'), 4)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'regimen-tarifario-anterior'),
   'BTH - Potencia Máxima fuera de punta', 'at-bth-potencia-maxima-fuera-punta', 'RD$',
   'Potencia Máxima fuera de punta - Tarifa BTH (Anterior)', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'at-bth'), 4)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'regimen-tarifario-anterior'),
   'BTH - Potencia Máxima en horas de punta', 'at-bth-potencia-maxima-horas-punta', 'RD$',
   'Potencia Máxima en horas de punta - Tarifa BTH (Anterior)', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'at-bth'), 4)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'regimen-tarifario-anterior'),
   'MTD1 - Media Tensión Demanda 1 (Industrial)', 'at-mtd1', 'RD$',
   'Tarifa MTD1 — Régimen Tarifario Anterior', 'bar', false, 5)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'regimen-tarifario-anterior'),
   'MTD1 - Cargo Fijo', 'at-mtd1-cargo-fijo', 'RD$',
   'Cargo Fijo - Tarifa MTD1 (Anterior)', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'at-mtd1'), 5)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'regimen-tarifario-anterior'),
   'MTD1 - Energía', 'at-mtd1-energia', 'RD$',
   'Energía - Tarifa MTD1 (Anterior)', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'at-mtd1'), 5)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'regimen-tarifario-anterior'),
   'MTD1 - Potencia Máxima', 'at-mtd1-potencia-maxima', 'RD$',
   'Potencia Máxima - Tarifa MTD1 (Anterior)', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'at-mtd1'), 5)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'regimen-tarifario-anterior'),
   'MTD2 - Media Tensión Demanda 2 (Industrial)', 'at-mtd2', 'RD$',
   'Tarifa MTD2 — Régimen Tarifario Anterior', 'bar', false, 6)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'regimen-tarifario-anterior'),
   'MTD2 - Cargo Fijo', 'at-mtd2-cargo-fijo', 'RD$',
   'Cargo Fijo - Tarifa MTD2 (Anterior)', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'at-mtd2'), 6)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'regimen-tarifario-anterior'),
   'MTD2 - Energía', 'at-mtd2-energia', 'RD$',
   'Energía - Tarifa MTD2 (Anterior)', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'at-mtd2'), 6)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'regimen-tarifario-anterior'),
   'MTD2 - Potencia Máxima', 'at-mtd2-potencia-maxima', 'RD$',
   'Potencia Máxima - Tarifa MTD2 (Anterior)', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'at-mtd2'), 6)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'regimen-tarifario-anterior'),
   'MTH - Media Tensión Horaria (Industrial)', 'at-mth', 'RD$',
   'Tarifa MTH — Régimen Tarifario Anterior', 'bar', false, 7)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'regimen-tarifario-anterior'),
   'MTH - Cargo Fijo', 'at-mth-cargo-fijo', 'RD$',
   'Cargo Fijo - Tarifa MTH (Anterior)', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'at-mth'), 7)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'regimen-tarifario-anterior'),
   'MTH - Energía', 'at-mth-energia', 'RD$',
   'Energía - Tarifa MTH (Anterior)', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'at-mth'), 7)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'regimen-tarifario-anterior'),
   'MTH - Potencia Máxima fuera de punta', 'at-mth-potencia-maxima-fuera-punta', 'RD$',
   'Potencia Máxima fuera de punta - Tarifa MTH (Anterior)', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'at-mth'), 7)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, is_breakdown, parent_indicator_id, sort_order) VALUES
  ((SELECT id FROM indicator_categories WHERE slug = 'regimen-tarifario-anterior'),
   'MTH - Potencia Máxima en horas de punta', 'at-mth-potencia-maxima-horas-punta', 'RD$',
   'Potencia Máxima en horas de punta - Tarifa MTH (Anterior)', 'bar', true,
   (SELECT id FROM indicators WHERE slug = 'at-mth'), 7)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- FIN DEL SEED DE INDICADORES
-- ============================================================