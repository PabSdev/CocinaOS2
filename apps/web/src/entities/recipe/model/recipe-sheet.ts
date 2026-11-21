import type { DishRecipeIngredientInput, RecipeItem } from './types'

export type RecipeSheetDish = Required<NonNullable<RecipeItem['plato']>> & {
  $createdAt: string
  $updatedAt: string
}

export interface RecipeSheet {
  dish: RecipeSheetDish
  lines: RecipeItem[]
  version: string
}

export interface SaveRecipeSheetInput {
  dishId: string
  price?: string | null
  version: string
  lines: (DishRecipeIngredientInput & { id?: string })[]
}
