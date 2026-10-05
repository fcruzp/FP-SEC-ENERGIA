-- ============================================================
-- 006: Resumen por indicador calculado en la base de datos (vista materializada)
--
-- Sustituye el cálculo en la API sobre "las últimas N filas" (que
-- truncaba por el tope de 1000 filas de PostgREST) por una vista con,
-- para cada indicador: último valor, anterior, mismo mes del año previo,
-- cantidad de datos y los últimos 12 meses para los sparklines.
-- ============================================================
DROP VIEW IF EXISTS indicator_stats;
DROP MATERIALIZED VIEW IF EXISTS indicator_stats;
CREATE MATERIALIZED VIEW indicator_stats AS
WITH ranked AS (
  SELECT
    dp.indicator_id,
    dp.date,
    dp.value::float8 AS value,
    row_number() OVER (PARTITION BY dp.indicator_id ORDER BY dp.date DESC) AS rn
  FROM data_points dp
  WHERE dp.period_type = 'monthly'
)
SELECT
  r.indicator_id,
  max(r.date) FILTER (WHERE r.rn = 1)            AS latest_date,
  max(r.value) FILTER (WHERE r.rn = 1)           AS latest_value,
  max(r.date) FILTER (WHERE r.rn = 2)            AS previous_date,
  max(r.value) FILTER (WHERE r.rn = 2)           AS previous_value,
  max(r.value) FILTER (WHERE r.rn = 13)          AS year_ago_value,
  min(r.date)                                    AS first_date,
  count(*)                                       AS point_count,
  jsonb_agg(jsonb_build_object('date', r.date, 'value', r.value) ORDER BY r.date)
    FILTER (WHERE r.rn <= 12)                    AS sparkline
FROM ranked r
GROUP BY r.indicator_id;

CREATE UNIQUE INDEX IF NOT EXISTS uq_indicator_stats ON indicator_stats (indicator_id);
COMMENT ON MATERIALIZED VIEW indicator_stats IS 'Resumen por indicador: último/anterior valor, valor de hace 12 meses y sparkline de 12 meses. Se refresca al cargar cada edición (scripts/mem-load.ts).';
GRANT SELECT ON indicator_stats TO anon, authenticated;
