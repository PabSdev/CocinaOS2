import type { RecipeUnit } from '@/entities/recipe'

const currency = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 4,
})
const summaryCurrency = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' })
const decimal = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 4 })

export const summaryMoney = (value: number | null) =>
  value === null ? '—' : summaryCurrency.format(value)
export const money = (value: number | null) => (value === null ? '—' : currency.format(value))
export const percent = (value: number | null) =>
  value === null ? '—' : `${decimal.format(value)} %`
export const amount = (value: number | null, unit: RecipeUnit) =>
  value === null ? '—' : `${decimal.format(value)} ${unit === 'L' ? 'L' : unit.toLowerCase()}`

export const warningText = {
  SIN_PRECIO: 'Falta el precio de compra en almacén',
  MERMA_INVALIDA: 'Merma no válida',
  UNIDAD_INCOMPATIBLE: 'Unidad incompatible',
  PVP_NO_CALCULABLE: 'Introduce un PVP mayor que cero para ver la rentabilidad',
}

export const impactColors = ['bg-[#112747]', 'bg-[#6488b2]', 'bg-[#2e567f]', 'bg-[#9bb6d1]']

export const recipeColumns =
  '@min-[36rem]/receta:grid-cols-[minmax(0,1fr)_8rem_6rem_minmax(5rem,auto)]'
export const cellLabel = 'block text-xs font-medium text-[#55667e] @min-[36rem]/receta:sr-only'
