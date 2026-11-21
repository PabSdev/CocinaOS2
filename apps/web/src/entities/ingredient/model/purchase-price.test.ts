import { describe, expect, it } from 'vitest'
import { formatPurchasePrice, isPurchasePrice, parsePurchasePrice, purchasePriceWithoutVat } from './purchase-price'

describe('precio de compra sin IVA', () => {
  it.each([
    [121, 21, 100],
    [110, 10, 100],
    [12.3456, 0, 12.34],
    [0, 21, 0],
    [0.00121, 21, 0],
    [1, 21, 0.82],
    [4.1, 0, 4.1],
    [1.2399, 0, 1.23],
  ])('trunca %s con IVA del %s %% a %s neto con dos decimales', (gross, vat, expected) => {
    expect(purchasePriceWithoutVat(gross, vat)).toBe(expected)
  })

  it('distingue un precio ausente de un precio de cero', () => {
    expect(parsePurchasePrice('')).toBeNull()
    expect(parsePurchasePrice('  ')).toBeNull()
    expect(parsePurchasePrice('0')).toBe(0)
    expect(formatPurchasePrice(null, 'KG')).toBe('Sin precio')
    expect(formatPurchasePrice(0, 'KG')).toContain('0,00')
  })

  it('admite la coma decimal y conserva precios pequeños por gramo', () => {
    expect(parsePurchasePrice(' 2,50 ')).toBe(2.5)
    expect(formatPurchasePrice(0.001, 'G')).toContain('0,001')
    expect(formatPurchasePrice(0.001, 'G')).toContain('/G')
  })

  it.each(['-1', '1abc', 'Infinity', '1e309', '2,5,0'])('rechaza el texto inválido %s', (value) => {
    expect(Number.isNaN(parsePurchasePrice(value))).toBe(true)
  })

  it.each([-1, NaN, Infinity, '2', false])('rechaza importes que no sean números finitos positivos o cero: %s', (value) => {
    expect(isPurchasePrice(value)).toBe(false)
  })

  it('no calcula con importes o porcentajes inválidos', () => {
    expect(purchasePriceWithoutVat(121, -21)).toBeNull()
    expect(purchasePriceWithoutVat(-121, 21)).toBeNull()
    expect(purchasePriceWithoutVat(Infinity, 21)).toBeNull()
    expect(purchasePriceWithoutVat(121, NaN)).toBeNull()
  })
})
