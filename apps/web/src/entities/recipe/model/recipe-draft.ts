import { calculateRecipeEscandallo } from './escandallo-operations'
import type { EscandalloLineInput, RecipeEscandalloResult } from './escandallo'
import type { DishRecipeIngredientInput, RecipeItem, RecipeUnit } from './types'

export type RecipeIngredient = NonNullable<RecipeItem['ingrediente']>

export interface DraftDishRecipeLine {
  localId: string
  ingrediente_id: string
  cantidad: string
  unidad: RecipeUnit
  merma_override: string
}

export function recipeItemsToDraftLines(items: RecipeItem[]): DraftDishRecipeLine[] {
  return items.map((item) => ({
    localId: item.$id,
    ingrediente_id: item.ingrediente_id,
    cantidad: String(item.cantidad),
    unidad: item.unidad,
    merma_override:
      item.merma_ingrediente_receta != null ? String(item.merma_ingrediente_receta) : '',
  }))
}

export function validateAndBuildRecipePayload(lines: DraftDishRecipeLine[]): {
  valid: boolean
  error?: string
  payload: DishRecipeIngredientInput[]
} {
  const payload: DishRecipeIngredientInput[] = []

  for (const line of lines) {
    const cantidad = Number(line.cantidad.replace(',', '.'))
    if (!Number.isFinite(cantidad) || cantidad <= 0) {
      return {
        valid: false,
        error: 'Todas las cantidades útiles de la receta deben ser mayores que 0.',
        payload: [],
      }
    }

    const trimmedMerma = line.merma_override.trim().replace(',', '.')
    let merma: number | null = null
    if (trimmedMerma !== '') {
      const parsedMerma = Number(trimmedMerma)
      if (!Number.isFinite(parsedMerma) || parsedMerma < 0 || parsedMerma >= 100) {
        return {
          valid: false,
          error: 'El porcentaje de merma en la receta debe estar entre 0 % y 99,99 %.',
          payload: [],
        }
      }
      merma = parsedMerma
    }

    payload.push({
      ingrediente_id: line.ingrediente_id,
      cantidad,
      unidad: line.unidad,
      merma_ingrediente_receta: merma,
    })
  }

  return { valid: true, payload }
}

export function computeDraftEscandallo(
  lines: DraftDishRecipeLine[],
  ingredients: RecipeIngredient[],
  dishPriceGross = '',
  vatRatePct = 10
): RecipeEscandalloResult {
  const ingredientMap = new Map<string, RecipeIngredient>()
  for (const ing of ingredients) ingredientMap.set(ing.$id, ing)

  const escandalloInputs: EscandalloLineInput[] = lines.map((line) => {
    const ing = ingredientMap.get(line.ingrediente_id)
    const rawQty = Number(line.cantidad.replace(',', '.'))
    const cantidadUtil = Number.isFinite(rawQty) && rawQty >= 0 ? rawQty : 0

    const trimmedMerma = line.merma_override.trim().replace(',', '.')
    const mermaRecetaPct =
      trimmedMerma === ''
        ? null
        : Number.isFinite(Number(trimmedMerma))
          ? Number(trimmedMerma)
          : -1

    return {
      id: line.localId,
      ingredienteId: line.ingrediente_id,
      nombre: ing?.nombre ?? 'Ingrediente',
      cantidadUtil,
      unidadReceta: line.unidad,
      unidadCompra: ing?.unidad_de_masa ?? line.unidad,
      precioCompraUnitario: ing?.precio_compra ?? null,
      mermaHabitualPct: ing?.merma_habitual ?? null,
      mermaRecetaPct,
      stockActual: ing?.stock ?? 0,
    }
  })

  return calculateRecipeEscandallo({
    lines: escandalloInputs,
    dishPriceGross,
    vatRatePct,
  })
}

