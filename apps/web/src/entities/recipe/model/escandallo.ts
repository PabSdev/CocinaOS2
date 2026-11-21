import type { RecipeUnit } from './types'

export type EscandalloWarningCode =
  | 'SIN_PRECIO'
  | 'MERMA_INVALIDA'
  | 'UNIDAD_INCOMPATIBLE'
  | 'PVP_NO_CALCULABLE'

export interface EscandalloLineInput {
  id?: string
  ingredienteId: string
  nombre: string
  cantidadUtil: number // Cantidad útil para una ración.
  unidadReceta: RecipeUnit
  unidadCompra: RecipeUnit
  precioCompraUnitario: number | null // Precio neto por unidad de compra, sin IVA.
  mermaHabitualPct: number | null
  mermaRecetaPct: number | null // Si se indica, prevalece sobre la merma habitual, incluso si es cero.
  stockActual?: number
}

export interface EscandalloLineBreakdown {
  id?: string
  ingredienteId: string
  nombre: string
  cantidadUtil: number
  unidadReceta: RecipeUnit
  unidadCompra: RecipeUnit
  mermaAplicadaPct: number
  mermaOrigen: 'receta' | 'ingrediente' | 'ninguna'
  rendimientoPct: number
  cantidadUtilNormalizada: number | null
  cantidadBrutaReceta: number | null
  cantidadBrutaNormalizada: number | null
  precioCompraUnitario: number | null
  costeUtil: number | null
  costeMerma: number | null
  costeLinea: number | null
  pesoCostePct: number
  racionesPosiblesStock: number | null
  warnings: EscandalloWarningCode[]
}

export interface RecipeEscandalloResult {
  lines: EscandalloLineBreakdown[]
  costeNetoUtilRacion: number
  costeMermaRacion: number
  costeTotalRacion: number
  costeTotalRacionRedondeado: number
  pvpCartaConIva: number | null
  ivaPct: number
  ingresoNetoSinIva: number | null
  cuotaIva?: number | null
  margenBrutoRacion: number | null
  foodCostPct: number | null
  margenBrutoPct: number | null
  racionesPosiblesStock: number | null
  incompleto: boolean
  warnings: EscandalloWarningCode[]
}
