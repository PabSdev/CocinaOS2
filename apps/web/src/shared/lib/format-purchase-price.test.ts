import { describe, expect, it } from 'vitest'
import { formatPurchasePrice } from './format-purchase-price'

describe('formatPurchasePrice', () => {
  it('devuelve "Sin precio" cuando el precio es null o undefined', () => {
    expect(formatPurchasePrice(null, 'KG')).toBe('Sin precio')
    expect(formatPurchasePrice(undefined as unknown as null, 'L')).toBe('Sin precio')
  })

  it('formatea precio de cero con la unidad indicada', () => {
    const formatted = formatPurchasePrice(0, 'KG')
    expect(formatted).toContain('0,00')
    expect(formatted).toContain('€/KG')
  })

  it('formatea precios estándar con dos decimales y moneda EUR', () => {
    const formatted = formatPurchasePrice(4.5, 'L')
    expect(formatted).toContain('4,50')
    expect(formatted).toContain('€/L')
  })

  it('conserva hasta 4 decimales para precios fraccionarios pequeños', () => {
    const formatted = formatPurchasePrice(0.0025, 'G')
    expect(formatted).toContain('0,0025')
    expect(formatted).toContain('€/G')
  })

  it('funciona con unidades de volumen y peso variadas', () => {
    expect(formatPurchasePrice(12.34, 'ML')).toContain('12,34')
    expect(formatPurchasePrice(12.34, 'ML')).toContain('/ML')
    expect(formatPurchasePrice(1200.5, 'UD')).toContain('1200,50')
    expect(formatPurchasePrice(1200.5, 'UD')).toContain('/UD')
  })
})
