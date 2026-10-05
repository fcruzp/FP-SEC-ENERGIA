-- ============================================================
-- 004: Porcentajes expresados en % (no como fracción)
-- Las hojas del MEM guardan porcentajes como fracción (0.387 = 38.7 %).
-- El catálogo pasa a unidad '%' y full-load.cjs multiplica por 100 al cargar.
-- Idempotente: solo toca el catálogo, no los valores.
-- ============================================================
UPDATE indicators SET unit = '%' WHERE unit IN ('PP', 'ratio');
UPDATE indicators SET name = replace(name, '(PP)', '(%)') WHERE name LIKE '%(PP)%';
