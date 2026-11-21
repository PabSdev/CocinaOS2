export type RecipeUnit = 'G' | 'KG' | 'ML' | 'L'

export interface RecipeItem {
  $id: string
  $createdAt: string
  $updatedAt: string
  plato_id: string
  ingrediente_id: string
  cantidad: number
  unidad: RecipeUnit
  merma_ingrediente_receta?: number | null
  // Expanded relation data when fetched with select queries
  plato?: {
    $id: string
    nombre: string
    precio: string | null
    foto?: string | null
    stock: number
  }
  ingrediente?: {
    $id: string
    nombre: string
    descripcion?: string | null
    stock: number
    unidad_de_masa: RecipeUnit
    precio_compra?: number | null
    merma_habitual?: number | null
  }
}

export interface CreateRecipeItemInput {
  plato_id: string
  ingrediente_id: string
  cantidad: number
  unidad: RecipeUnit
  merma_ingrediente_receta?: number | null
}

export interface UpdateRecipeItemInput {
  cantidad?: number
  unidad?: RecipeUnit
  ingrediente_id?: string
  merma_ingrediente_receta?: number | null
}

export interface DishRecipeIngredientInput {
  ingrediente_id: string
  cantidad: number
  unidad: RecipeUnit
  merma_ingrediente_receta?: number | null
}

export interface DishStockFeasibility {
  platoId: string
  platoNombre: string
  maxPortionsPossible: number
  ingredientsRequirement: Array<{
    ingredienteId: string
    nombre: string
    currentStock: number
    stockUnit: string
    requiredPerPortion: number
    grossRequiredPerPortion: number
    wastagePct: number
    recipeUnit: RecipeUnit
    normalizedRequiredPerPortion: number // gross amount normalized to stock unit
    portionsCanMake: number
    hasSufficientStock: boolean
  }>
}

export interface ActionResponse<T> {
  success: boolean
  data?: T
  error?: string
}
