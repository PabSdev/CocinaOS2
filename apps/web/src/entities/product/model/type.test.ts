import { describe, expect, it } from 'vitest'
import { DEFAULT_PRODUCT_CATEGORIES, formatProductPrice } from './type'

describe('product model utilities', () => {
  it('contiene las 6 categorías predeterminadas de cocina', () => {
    expect(DEFAULT_PRODUCT_CATEGORIES).toEqual([
      'Bebidas',
      'Salsas',
      'Conservas',
      'Lácteos',
      'Postres',
      'Envases',
    ])
  })

  it('formatea precios finitos con dos decimales en EUR', () => {
    const formatted = formatProductPrice(12.5)
    expect(formatted).toContain('12,50')
    expect(formatted).toContain('€')
  })

  it('devuelve "0,00 €" para precios no finitos o inválidos (NaN, Infinity)', () => {
    expect(formatProductPrice(NaN)).toBe('0,00 €')
    expect(formatProductPrice(Infinity)).toBe('0,00 €')
    expect(formatProductPrice(-Infinity)).toBe('0,00 €')
  })

  it('formatea precio de cero correctamente', () => {
    const formatted = formatProductPrice(0)
    expect(formatted).toContain('0,00')
    expect(formatted).toContain('€')
  })
})
