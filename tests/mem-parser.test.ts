/// <reference types="bun-types" />
/**
 * Pruebas del parser del Informe de Desempeño (MEM) contra archivos reales.
 * Ejecutar: bun test
 */
import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { slugify, splitUnit, type CatalogEntry } from '../src/lib/mem/catalog'
import { compareCatalog, editionFromFilename, extractWorkbook, runChecks, toPoints, type KnownAnomaly } from '../src/lib/mem/pipeline'

const ROOT = resolve(import.meta.dir, '..')
const JULIO = resolve(ROOT, 'data/mem/Informe-de-Desempeno-Anexos._-julio-2026.xlsx')
const ABRIL = resolve(ROOT, 'data/mem/Informe-de-Desempeno-Anexos._-abril-2026.xlsx')
const catalog: CatalogEntry[] = JSON.parse(readFileSync(resolve(ROOT, 'data/mem/catalogo.json'), 'utf-8'))
const known: KnownAnomaly[] = JSON.parse(readFileSync(resolve(ROOT, 'data/mem/anomalias-conocidas.json'), 'utf-8'))

const julio = extractWorkbook(readFileSync(JULIO))
const points = toPoints(julio.rows)
const value = (slug: string, date: string) => points.find(p => p.slug === slug && p.date === date)?.value
const sumYtd = (slug: string, year: number, lastMonth: number) =>
  points
    .filter(p => p.slug === slug && p.date >= `${year}-01-01` && p.date <= `${year}-${String(lastMonth).padStart(2, '0')}-01`)
    .reduce((s, p) => s + p.value, 0)

describe('utilidades', () => {
  test('edición desde el nombre del archivo', () => {
    expect(editionFromFilename('Informe-de-Desempeno-Anexos._-julio-2026.xlsx')).toBe('2026-07-01')
    expect(editionFromFilename('Informe-de-Desempeno-Anexos._-Febrero-2026.xlsx')).toBe('2026-02-01')
    expect(editionFromFilename('Informe-de-Desempeno-Anexos._-junio-2026-vf.xlsx')).toBe('2026-06-01')
  })

  test('unidades reconocidas en la etiqueta', () => {
    expect(splitUnit('Pérdidas (%)')).toEqual({ base: 'Pérdidas', unit: '%' })
    expect(splitUnit('Factura por Compra de Energía (USD MM)')).toEqual({ base: 'Factura por Compra de Energía', unit: 'US$ MM' })
    // Paréntesis que no son unidad
    expect(splitUnit('Electronic JRC (Solar Fotovoltaica 30 MWp)').unit).toBeNull()
  })

  test('slugs sin acentos ni símbolos', () => {
    expect(slugify('Pérdidas - Año Móvil')).toBe('perdidas-ano-movil')
    expect(slugify("Ede's")).toBe('ede-s')
  })
})

describe('edición julio 2026', () => {
  test('la estructura coincide con el catálogo versionado', () => {
    expect(compareCatalog(julio.rows.map(r => r.entry), catalog)).toEqual([])
  })

  test('meses de enero 2009 a julio 2026 en las hojas vigentes', () => {
    const edes = julio.sheets.find(s => s.sheet === "EDE's")!
    expect(edes.firstMonth).toBe('2009-01-01')
    expect(edes.lastMonth).toBe('2026-07-01')
  })

  test('verificaciones de conciliación sin diferencias inesperadas', () => {
    const { ok, outcomes } = runChecks(julio, known)
    expect(ok).toBe(true)
    expect(outcomes.find(o => o.result.check === 'edes_suman_total')!.result.mismatches).toBe(0)
  })

  test('cada valor guarda su celda de origen', () => {
    const p = points.find(x => x.slug === 'edes-perdidas-ano-movil' && x.date === '2026-07-01')!
    expect(p.cell).toBe("EDE's!HN157")
  })

  // Cifras del resumen ejecutivo del PDF de julio 2026
  test.each([
    ['edes-compra-de-energia', 12072.1, 1],
    ['edes-energia-facturada', 7257.2, 1],
    ['edes-factura-por-compra-de-energia', 1925.6, 1],
    ['edes-factura-por-venta-de-energia-us-mm', 1229.9, 1],
    ['edes-cobros-por-energia-us-mm', 1156.6, 1],
    ['edes-gastos-operativos', 266.8, 1],
    ['edes-inversiones-total', 133.2, 1],
    ['egehid-energia-facturada', 885.0, 1],
  ])('acumulado ene–jul de %s = %d (PDF)', (slug, expected, decimals) => {
    expect(Number(sumYtd(slug, 2026, 7).toFixed(decimals))).toBe(expected)
  })

  test.each([
    ['edes-perdidas-ano-movil', 39.2],
    ['edes-cobranzas-ano-movil', 95.4],
    ['edes-cri-ano-movil', 58.0],
    ['edes-indice-de-recuperacion-de-energia-ano-movil', 57.7],
  ])('%s en julio 2026 = %d %% (PDF)', (slug, expected) => {
    expect(Number(value(slug, '2026-07-01')!.toFixed(1))).toBe(expected)
  })

  test('tasa de cambio de julio 2026 = 58.88 (PDF)', () => {
    expect(Number(value('tasa-de-cambio', '2026-07-01')!.toFixed(2))).toBe(58.88)
  })

  test('los porcentajes se guardan en escala 0–100', () => {
    const v = value('participacion-gas-natural-en-la-generacion', '2026-07-01')!
    expect(v).toBeGreaterThan(1)
    expect(v).toBeLessThan(100)
  })
})

describe('edición abril 2026 (hoja "EDE" en lugar de "EDE\'s")', () => {
  test('se reconoce el alias y el catálogo es el mismo', () => {
    const abril = extractWorkbook(readFileSync(ABRIL))
    expect(abril.sheets.find(s => s.sheet === "EDE's")!.actualName).toBe('EDE')
    expect(compareCatalog(abril.rows.map(r => r.entry), catalog)).toEqual([])
  })
})

describe('anexo de resultados financieros (julio 2026)', () => {
  test('solo trae los meses ejecutados (enero a julio)', () => {
    const annex = julio.sheets.find(s => s.sheet === 'Anexo Res Financieros')!
    expect(annex.firstMonth).toBe('2026-01-01')
    expect(annex.lastMonth).toBe('2026-07-01')
  })

  test('aportes del Gobierno a las EDEs, enero–julio 2026', () => {
    // Celdas del Excel: 113, 156.75, 186.876, 161, 181.833, 160.9, 166.5
    expect(Number(sumYtd('rf-edes-financiamiento-aportes-del-gobierno', 2026, 7).toFixed(3))).toBe(1126.859)
  })

  test('las partidas cuadran: totales, balances y EDEs vs total', () => {
    const { outcomes } = runChecks(julio, known)
    const relations = outcomes.find(o => o.result.check === 'partidas_cuadran')!
    expect(relations.result.compared).toBeGreaterThan(1000)
    expect(relations.result.mismatches).toBe(0)
    expect(outcomes.find(o => o.result.check === 'acumulado_anual')!.result.mismatches).toBe(0)
  })
})

describe('anexo de deuda (julio 2026)', () => {
  test('la foto de deuda es del mes de la edición', () => {
    expect(julio.snapshotMonth).toBe('2026-07-01')
  })

  test('deuda corriente de las EDEs con generadoras al cierre de julio', () => {
    expect(Number(value('deuda-edes-corriente', '2026-07-01')!.toFixed(3))).toBe(179.039)
    // "Grupo AES" es subtotal de AES Andrés + AES DPP + EGE Itabo
    expect(Number(value('deuda-edes-corriente-grupo-aes', '2026-07-01')!.toFixed(3))).toBe(56.811)
  })

  test('pagos de las EDEs por compra de energía, enero–julio = fila Total del Excel', () => {
    expect(Number(sumYtd('pagos-edes-compra-energia', 2026, 7).toFixed(3))).toBe(1928.181)
  })
})

describe('tarifas (régimen anterior + nuevo)', () => {
  const tariffs = julio.rows.filter(r => r.entry.slug.startsWith('tarifa-'))

  test('168 series continuas de julio 2013 a julio 2026, sin huecos', () => {
    expect(tariffs.length).toBe(168)
    expect(tariffs.every(r => r.source.monthly.size === 157)).toBe(true)
  })

  test('BTS1 primer bloque: aplicada congelada en 4.44 hasta oct-2021, 5.97 en jul-2026; referencia 16.80', () => {
    expect(value('tarifa-bts1-energia-0-200-aplicada-edenorte', '2013-07-01')).toBe(4.44)
    expect(value('tarifa-bts1-energia-0-200-aplicada-edenorte', '2021-10-01')).toBe(4.44)
    expect(value('tarifa-bts1-energia-0-200-aplicada-edenorte', '2026-07-01')).toBe(5.97)
    expect(value('tarifa-bts1-energia-0-200-referencia-edenorte', '2026-07-01')).toBe(16.8)
  })

  test('el período duplicado abr–may / abr–jun 2026 se verifica idéntico', () => {
    expect(julio.notes.some(n => n.includes('abr - may 26'))).toBe(true)
  })
})

describe('formatos anteriores del anexo financiero', () => {
  test('marzo 2026: EGPC sin "Gastos Totales" se reconoce con la variante y cuadra', () => {
    const marzo = extractWorkbook(readFileSync(resolve(ROOT, 'data/mem/Informe-de-Desempeno-Anexos._-marzo-2026.xlsx')))
    expect(compareCatalog(marzo.rows.map(r => r.entry), catalog)).toEqual([])
    const absent = marzo.rows.filter(r => r.absent).map(r => r.entry.slug)
    // También faltan las dos generadoras que el MEM agregó desde mayo 2026
    expect(absent).toEqual([
      'rf-egpc-gastos-totales',
      'deuda-edes-corriente-la-reina-s-a-s',
      'deuda-edes-corriente-materias-primas-sas-maprica',
    ])
    expect(runChecks(marzo, known).ok).toBe(true)
  })
})

describe('detección de cambios de estructura', () => {
  test('una etiqueta renombrada en el Excel se detecta', () => {
    const altered = julio.rows.map(r => r.entry).map(e =>
      e.slug === 'edes-perdidas-ano-movil' ? { ...e, label: 'Pérdidas Año Móvil (%)' } : e)
    expect(compareCatalog(altered, catalog).length).toBeGreaterThan(0)
  })

  test('una fila nueva se detecta', () => {
    const current = julio.rows.map(r => r.entry)
    const extra = { ...current[0], slug: 'fila-nueva', label: 'Fila nueva' }
    expect(compareCatalog([...current, extra], catalog)).toContain('+ nuevo: fila-nueva (Variables Relevantes!B9 "Fila nueva")')
  })
})
