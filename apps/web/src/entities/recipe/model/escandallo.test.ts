import { describe, expect, it } from 'vitest'
import {
  calculateGrossQuantity,
  calculateIngredientLineCost,
  calculateRecipeEscandallo,
  calculateRecommendedDishPrice,
  normalizeRecipeQuantity,
} from './escandallo-operations'
import type { EscandalloLineInput } from './escandallo'

describe('Cálculo de coste de receta por 1 ración', () => {
  const patata: EscandalloLineInput = {
    ingredienteId: 'patata',
    nombre: 'Patata',
    cantidadUtil: 200,
    unidadReceta: 'G',
    unidadCompra: 'KG',
    precioCompraUnitario: 1.4,
    mermaHabitualPct: 20,
    mermaRecetaPct: null,
    stockActual: 10,
  }

  it.each([-1, 100, NaN, Infinity])('rechaza la merma inválida %s sin perder el coste útil', (mermaRecetaPct) => {
    expect(calculateIngredientLineCost({ ...patata, mermaRecetaPct })).toMatchObject({
      costeUtil: 0.28,
      costeLinea: null,
      costeMerma: null,
      cantidadBrutaReceta: null,
      cantidadBrutaNormalizada: null,
      racionesPosiblesStock: null,
      warnings: ['MERMA_INVALIDA'],
    })
  })

  it('acepta precio cero y merma cero por receta aunque el ingrediente tenga merma', () => {
    expect(calculateIngredientLineCost({ ...patata, precioCompraUnitario: 0, mermaRecetaPct: 0 })).toMatchObject({
      precioCompraUnitario: 0,
      mermaAplicadaPct: 0,
      mermaOrigen: 'receta',
      costeUtil: 0,
      costeLinea: 0,
      costeMerma: 0,
      racionesPosiblesStock: 50,
      warnings: [],
    })
  })

  it.each([null, -1, NaN, Infinity])('rechaza el precio inválido %s sin perder el cálculo de stock', (precioCompraUnitario) => {
    expect(calculateIngredientLineCost({ ...patata, precioCompraUnitario })).toMatchObject({
      precioCompraUnitario: null,
      costeUtil: null,
      costeLinea: null,
      costeMerma: null,
      racionesPosiblesStock: 40,
      warnings: ['SIN_PRECIO'],
    })
  })

  it('conserva la cantidad bruta de receta cuando las unidades son incompatibles', () => {
    expect(calculateIngredientLineCost({ ...patata, unidadCompra: 'L' })).toMatchObject({
      cantidadBrutaReceta: 250,
      cantidadBrutaNormalizada: null,
      costeLinea: null,
      warnings: ['UNIDAD_INCOMPATIBLE'],
    })
  })

  it('devuelve coste cero y stock desconocido para una receta vacía', () => {
    expect(calculateRecipeEscandallo({ lines: [] })).toMatchObject({
      lines: [],
      costeTotalRacion: 0,
      racionesPosiblesStock: null,
      incompleto: false,
      warnings: ['PVP_NO_CALCULABLE'],
    })
  })

  it('suma solo las líneas calculables y reúne sus avisos sin duplicados', () => {
    const sinPrecio = { ...patata, precioCompraUnitario: null }
    expect(calculateRecipeEscandallo({ lines: [patata, sinPrecio, sinPrecio] })).toMatchObject({
      costeNetoUtilRacion: 0.28,
      costeMermaRacion: 0.07,
      costeTotalRacion: 0.35,
      racionesPosiblesStock: 40,
      incompleto: true,
      warnings: ['SIN_PRECIO', 'PVP_NO_CALCULABLE'],
    })
  })

  it.each([undefined, null, '', 'inválido', 0])('no calcula rentabilidad con PVP %s', (dishPriceGross) => {
    expect(calculateRecipeEscandallo({ lines: [patata], dishPriceGross })).toMatchObject({
      ingresoNetoSinIva: null,
      cuotaIva: null,
      margenBrutoRacion: null,
      foodCostPct: null,
      margenBrutoPct: null,
      warnings: ['PVP_NO_CALCULABLE'],
    })
  })

  it('evita dividir por cero cuando el ingreso neto positivo se redondea a cero', () => {
    expect(calculateRecipeEscandallo({ lines: [patata], dishPriceGross: 0.00001 })).toMatchObject({
      ingresoNetoSinIva: 0,
      cuotaIva: 0,
      margenBrutoRacion: -0.35,
      foodCostPct: null,
      margenBrutoPct: null,
      warnings: [],
    })
  })

  it('convierte unidades compatibles (G <-> KG, ML <-> L) y rechaza incompatibles', () => {
    expect(normalizeRecipeQuantity(250, 'G', 'KG')).toBe(0.25)
    expect(normalizeRecipeQuantity(1.5, 'KG', 'G')).toBe(1500)
    expect(normalizeRecipeQuantity(20, 'ML', 'L')).toBe(0.02)
    expect(normalizeRecipeQuantity(100, 'G', 'ML')).toBeNull()
  })

  it('calcula cantidad bruta con merma y coste exacto (200 g patata limpia al 20% merma = 250 g brutos y 0,35 €)', () => {
    expect(calculateGrossQuantity(200, 20)).toBeCloseTo(250, 4)

    const line = calculateIngredientLineCost({
      ingredienteId: 'patata-1',
      nombre: 'Patata',
      cantidadUtil: 200,
      unidadReceta: 'G',
      unidadCompra: 'KG',
      precioCompraUnitario: 1.4,
      mermaHabitualPct: 20,
      mermaRecetaPct: null,
      stockActual: 10,
    })

    expect(line.cantidadBrutaReceta).toBe(250)
    expect(line.cantidadBrutaNormalizada).toBe(0.25)
    expect(line.costeLinea).toBe(0.35)
    expect(line.racionesPosiblesStock).toBe(40)
  })

  it('calcula el coste total de la receta y el Food Cost % sobre PVP sin IVA', () => {
    const lines: EscandalloLineInput[] = [
      {
        ingredienteId: 'pollo',
        nombre: 'Pollo',
        cantidadUtil: 250,
        unidadReceta: 'G',
        unidadCompra: 'KG',
        precioCompraUnitario: 7.0,
        mermaHabitualPct: 0,
        mermaRecetaPct: null,
      },
      {
        ingredienteId: 'patatas',
        nombre: 'Patatas',
        cantidadUtil: 200,
        unidadReceta: 'G',
        unidadCompra: 'KG',
        precioCompraUnitario: 1.4,
        mermaHabitualPct: 20,
        mermaRecetaPct: null,
      },
    ]

    const result = calculateRecipeEscandallo({
      lines,
      dishPriceGross: '15,00 €',
      vatRatePct: 10,
    })

    expect(result.costeTotalRacion).toBe(2.1)
    expect(result.ingresoNetoSinIva).toBe(13.6364)
    expect(result.cuotaIva).toBe(1.3636)
    expect(result.foodCostPct).toBe(15.4)
  })

  it('calcula correctamente el IVA para los tipos 21 %, 10 % y 4 %', () => {
    const lines: EscandalloLineInput[] = [
      {
        ingredienteId: 'pollo',
        nombre: 'Pollo',
        cantidadUtil: 250,
        unidadReceta: 'G',
        unidadCompra: 'KG',
        precioCompraUnitario: 7.0,
        mermaHabitualPct: 0,
        mermaRecetaPct: null,
      },
    ]

    // IVA 21 % (Bebidas alcohólicas, general)
    const res21 = calculateRecipeEscandallo({
      lines,
      dishPriceGross: '12,10 €',
      vatRatePct: 21,
    })
    expect(res21.ivaPct).toBe(21)
    expect(res21.ingresoNetoSinIva).toBe(10)
    expect(res21.cuotaIva).toBe(2.1)

    // IVA 10 % (Hostelería estándar)
    const res10 = calculateRecipeEscandallo({
      lines,
      dishPriceGross: '11,00 €',
      vatRatePct: 10,
    })
    expect(res10.ivaPct).toBe(10)
    expect(res10.ingresoNetoSinIva).toBe(10)
    expect(res10.cuotaIva).toBe(1)

    // IVA 4 % (Superreducido)
    const res4 = calculateRecipeEscandallo({
      lines,
      dishPriceGross: '10,40 €',
      vatRatePct: 4,
    })
    expect(res4.ivaPct).toBe(4)
    expect(res4.ingresoNetoSinIva).toBe(10)
    expect(res4.cuotaIva).toBe(0.4)
  })

  it('recomienda el PVP con IVA para un Food Cost % objetivo', () => {
    const rec = calculateRecommendedDishPrice({
      costeTotalRacion: 2.9,
      targetFoodCostPct: 25,
      ivaPct: 10,
    })
    expect(rec).toEqual({
      precioNetoObjetivo: 11.6,
      pvpRecomendadoConIva: 12.76,
    })
  })
})
