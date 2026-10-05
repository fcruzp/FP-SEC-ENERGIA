/// <reference types="bun-types" />
import { describe, expect, test } from 'bun:test'
import { toCsv } from '../src/lib/csv'

describe('exportación CSV', () => {
  test('incluye BOM para Excel, escapa comas y comillas', () => {
    const csv = toCsv(['fecha', 'indicador', 'valor'], [['2026-07', 'Pérdidas, año móvil', 39.19], ['2026-06', 'Hoja "EDE\'s"', 38.9]])
    expect(csv.startsWith('﻿')).toBe(true)
    expect(csv).toContain('"Pérdidas, año móvil"')
    expect(csv).toContain('"Hoja ""EDE\'s"""')
    expect(csv.split('\r\n').length).toBe(4)
  })
})
