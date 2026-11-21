'use server'

import { requireKitchenAccess } from '@/shared/api'

import { revalidatePath } from 'next/cache'
import type { Models } from 'node-appwrite'
import {
  tablesDB,
  DATABASE_ID,
  TABLE_RECETAS_ID,
  TABLE_PLATOS_ID,
  ID,
  Query,
} from '@/shared/api'
import {
  calculateGrossQuantity,
  normalizeRecipeQuantity,
  resolveEffectiveWastage,
  round2,
  round4,
} from '../model/escandallo-operations'
import type {
  RecipeItem,
  RecipeUnit,
  CreateRecipeItemInput,
  UpdateRecipeItemInput,
  DishRecipeIngredientInput,
  DishStockFeasibility,
  ActionResponse,
} from '../model/types'

type RecipeRow = Models.Row & {
  plato_id: string | (Models.Row & { nombre?: string; precio?: string; foto?: string | null; stock?: number })
  ingrediente_id:
    | string
    | (Models.Row & {
        nombre?: string
        descripcion?: string | null
        stock?: number
        unidad_de_masa?: string
        precio_compra?: number | null
        merma_habitual?: number | null
      })
  cantidad: number
  unidad: RecipeUnit
  merma_ingrediente_receta?: number | null
}

const VALID_UNITS: readonly RecipeUnit[] = ['G', 'KG', 'ML', 'L']

function isValidUnit(value: unknown): value is RecipeUnit {
  return typeof value === 'string' && VALID_UNITS.includes(value as RecipeUnit)
}

function isValidWastage(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value < 100
}

function parseRecipeRow(row: RecipeRow): RecipeItem {
  const platoId =
    typeof row.plato_id === 'string' ? row.plato_id : row.plato_id?.$id || ''

  const ingredienteId =
    typeof row.ingrediente_id === 'string'
      ? row.ingrediente_id
      : row.ingrediente_id?.$id || ''

  const plato =
    typeof row.plato_id === 'object' && row.plato_id !== null
      ? {
          $id: row.plato_id.$id,
          nombre: String(row.plato_id.nombre || ''),
          precio: row.plato_id.precio?.trim() || null,
          foto: row.plato_id.foto ? String(row.plato_id.foto) : null,
          stock: Number(row.plato_id.stock ?? 0),
        }
      : undefined

  const ingrediente =
    typeof row.ingrediente_id === 'object' && row.ingrediente_id !== null
      ? {
          $id: row.ingrediente_id.$id,
          nombre: String(row.ingrediente_id.nombre || ''),
          descripcion: row.ingrediente_id.descripcion
            ? String(row.ingrediente_id.descripcion)
            : null,
          stock: Number(row.ingrediente_id.stock ?? 0),
          unidad_de_masa: (String(row.ingrediente_id.unidad_de_masa || 'KG').toUpperCase() as RecipeUnit),
          precio_compra:
            row.ingrediente_id.precio_compra == null
              ? null
              : Number(row.ingrediente_id.precio_compra),
          merma_habitual:
            row.ingrediente_id.merma_habitual == null
              ? null
              : Number(row.ingrediente_id.merma_habitual),
        }
      : undefined

  return {
    $id: row.$id,
    $createdAt: row.$createdAt,
    $updatedAt: row.$updatedAt,
    plato_id: platoId,
    ingrediente_id: ingredienteId,
    cantidad: Number(row.cantidad),
    unidad: row.unidad,
    merma_ingrediente_receta:
      row.merma_ingrediente_receta == null ? null : Number(row.merma_ingrediente_receta),
    plato,
    ingrediente,
  }
}

export async function getRecipeItems(queries: string[] = []): Promise<ActionResponse<RecipeItem[]>> {
  try {
    await requireKitchenAccess()
    const defaultQueries = [
      Query.select(['*', 'ingrediente_id.*', 'plato_id.*']),
      Query.limit(200),
      Query.orderDesc('$createdAt'),
    ]

    const response = await tablesDB.listRows<RecipeRow>({
      databaseId: DATABASE_ID,
      tableId: TABLE_RECETAS_ID,
      queries: queries.length > 0 ? queries : defaultQueries,
    })

    const items = response.rows.map(parseRecipeRow)
    return { success: true, data: items }
  } catch (error: unknown) {
    console.error('Error fetching recipe items:', error)
    return { success: false, error: 'No se pudieron cargar las recetas.' }
  }
}

export async function getRecipeByDish(dishId: string): Promise<ActionResponse<RecipeItem[]>> {
  try {
    await requireKitchenAccess()
    if (!dishId) {
      return { success: false, error: 'ID de plato no proporcionado.' }
    }

    const response = await tablesDB.listRows<RecipeRow>({
      databaseId: DATABASE_ID,
      tableId: TABLE_RECETAS_ID,
      queries: [
        Query.equal('plato_id', dishId),
        Query.select(['*', 'ingrediente_id.*']),
        Query.limit(100),
      ],
    })

    const items = response.rows.map(parseRecipeRow)
    return { success: true, data: items }
  } catch (error: unknown) {
    console.error(`Error fetching recipe for dish ${dishId}:`, error)
    return { success: false, error: 'No se pudo cargar la receta del plato.' }
  }
}

export async function getDishesByIngredient(ingredientId: string): Promise<ActionResponse<RecipeItem[]>> {
  try {
    await requireKitchenAccess()
    if (!ingredientId) {
      return { success: false, error: 'ID de ingrediente no proporcionado.' }
    }

    const response = await tablesDB.listRows<RecipeRow>({
      databaseId: DATABASE_ID,
      tableId: TABLE_RECETAS_ID,
      queries: [
        Query.equal('ingrediente_id', ingredientId),
        Query.select(['*', 'plato_id.*']),
        Query.limit(100),
      ],
    })

    const items = response.rows.map(parseRecipeRow)
    return { success: true, data: items }
  } catch (error: unknown) {
    console.error(`Error fetching dishes using ingredient ${ingredientId}:`, error)
    return { success: false, error: 'No se pudieron consultar los platos asociados al ingrediente.' }
  }
}

export async function getRecipeItemById(id: string): Promise<ActionResponse<RecipeItem>> {
  try {
    await requireKitchenAccess()
    if (!id) {
      return { success: false, error: 'ID de elemento de receta no proporcionado.' }
    }

    const row = await tablesDB.getRow<RecipeRow>({
      databaseId: DATABASE_ID,
      tableId: TABLE_RECETAS_ID,
      rowId: id,
      queries: [Query.select(['*', 'ingrediente_id.*', 'plato_id.*'])],
    })

    return { success: true, data: parseRecipeRow(row) }
  } catch (error: unknown) {
    console.error(`Error fetching recipe item ${id}:`, error)
    return { success: false, error: 'No se encontró el elemento de receta.' }
  }
}

export async function createRecipeItem(input: CreateRecipeItemInput): Promise<ActionResponse<RecipeItem>> {
  try {
    await requireKitchenAccess()
    const platoId = input.plato_id?.trim()
    const ingredienteId = input.ingrediente_id?.trim()

    if (!platoId) {
      return { success: false, error: 'El ID del plato es obligatorio.' }
    }

    if (!ingredienteId) {
      return { success: false, error: 'El ID del ingrediente es obligatorio.' }
    }

    const cantidad = Number(input.cantidad)
    if (!Number.isFinite(cantidad) || cantidad <= 0) {
      return { success: false, error: 'La cantidad debe ser un número mayor a 0.' }
    }

    if (!isValidUnit(input.unidad)) {
      return { success: false, error: 'La unidad de medida seleccionada no es válida (G, KG, ML, L).' }
    }

    if (input.merma_ingrediente_receta != null && !isValidWastage(input.merma_ingrediente_receta)) {
      return { success: false, error: 'La merma debe estar entre 0 % y 99,99 %.' }
    }

    const merma =
      input.merma_ingrediente_receta == null ? null : round2(input.merma_ingrediente_receta)

    const existing = await tablesDB.listRows<RecipeRow>({
      databaseId: DATABASE_ID,
      tableId: TABLE_RECETAS_ID,
      queries: [
        Query.equal('plato_id', platoId),
        Query.equal('ingrediente_id', ingredienteId),
        Query.limit(1),
      ],
    })

    if (existing.total > 0 && existing.rows[0]) {
      const existingRow = existing.rows[0]
      const updated = await tablesDB.updateRow<RecipeRow>({
        databaseId: DATABASE_ID,
        tableId: TABLE_RECETAS_ID,
        rowId: existingRow.$id,
        data: {
          cantidad: round4(cantidad),
          unidad: input.unidad,
          merma_ingrediente_receta: merma,
        },
      })

      revalidatePath('/platos')
      return { success: true, data: parseRecipeRow(updated) }
    }

    const created = await tablesDB.createRow<RecipeRow>({
      databaseId: DATABASE_ID,
      tableId: TABLE_RECETAS_ID,
      rowId: ID.unique(),
      data: {
        plato_id: platoId,
        ingrediente_id: ingredienteId,
        cantidad: round4(cantidad),
        unidad: input.unidad,
        merma_ingrediente_receta: merma,
      },
    })

    revalidatePath('/platos')
    return { success: true, data: parseRecipeRow(created) }
  } catch (error: unknown) {
    console.error('Error creating recipe item:', error)
    return { success: false, error: 'No se pudo añadir el ingrediente a la receta.' }
  }
}

export async function updateRecipeItem(
  id: string,
  input: UpdateRecipeItemInput
): Promise<ActionResponse<RecipeItem>> {
  try {
    await requireKitchenAccess()
    if (!id) {
      return { success: false, error: 'ID de elemento de receta no proporcionado.' }
    }

    const updateData: Partial<
      Pick<RecipeRow, 'cantidad' | 'unidad' | 'ingrediente_id' | 'merma_ingrediente_receta'>
    > = {}

    if (input.cantidad !== undefined) {
      const cantidad = Number(input.cantidad)
      if (!Number.isFinite(cantidad) || cantidad <= 0) {
        return { success: false, error: 'La cantidad debe ser un número mayor a 0.' }
      }
      updateData.cantidad = round4(cantidad)
    }

    if (input.unidad !== undefined) {
      if (!isValidUnit(input.unidad)) {
        return { success: false, error: 'Unidad de medida no válida.' }
      }
      updateData.unidad = input.unidad
    }

    if (input.ingrediente_id !== undefined) {
      const ingId = input.ingrediente_id.trim()
      if (!ingId) {
        return { success: false, error: 'ID de ingrediente inválido.' }
      }
      updateData.ingrediente_id = ingId
    }

    if (input.merma_ingrediente_receta !== undefined) {
      if (input.merma_ingrediente_receta !== null && !isValidWastage(input.merma_ingrediente_receta)) {
        return { success: false, error: 'La merma debe estar entre 0 % y 99,99 %.' }
      }
      updateData.merma_ingrediente_receta =
        input.merma_ingrediente_receta === null ? null : round2(input.merma_ingrediente_receta)
    }

    const updated = await tablesDB.updateRow<RecipeRow>({
      databaseId: DATABASE_ID,
      tableId: TABLE_RECETAS_ID,
      rowId: id,
      data: updateData,
    })

    revalidatePath('/platos')
    return { success: true, data: parseRecipeRow(updated) }
  } catch (error: unknown) {
    console.error(`Error updating recipe item ${id}:`, error)
    return { success: false, error: 'No se pudo actualizar el elemento de la receta.' }
  }
}

export async function deleteRecipeItem(id: string): Promise<ActionResponse<boolean>> {
  try {
    await requireKitchenAccess()
    if (!id) {
      return { success: false, error: 'ID de elemento de receta no proporcionado.' }
    }

    await tablesDB.deleteRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_RECETAS_ID,
      rowId: id,
    })

    revalidatePath('/platos')
    return { success: true, data: true }
  } catch (error: unknown) {
    console.error(`Error deleting recipe item ${id}:`, error)
    return { success: false, error: 'No se pudo eliminar el ingrediente de la receta.' }
  }
}

export async function setDishRecipe(
  dishId: string,
  ingredients: DishRecipeIngredientInput[]
): Promise<ActionResponse<RecipeItem[]>> {
  try {
    await requireKitchenAccess()
    if (!dishId) {
      return { success: false, error: 'ID de plato no proporcionado.' }
    }

    for (const item of ingredients) {
      const cantidad = Number(item.cantidad)
      if (!Number.isFinite(cantidad) || cantidad <= 0) {
        return { success: false, error: 'Todas las cantidades útiles deben ser mayores a 0.' }
      }
      if (!isValidUnit(item.unidad)) {
        return { success: false, error: 'Unidad de medida no válida en la receta.' }
      }
      if (item.merma_ingrediente_receta != null && !isValidWastage(item.merma_ingrediente_receta)) {
        return { success: false, error: 'El porcentaje de merma debe estar entre 0 % y 99,99 %.' }
      }
    }

    const current = await tablesDB.listRows<RecipeRow>({
      databaseId: DATABASE_ID,
      tableId: TABLE_RECETAS_ID,
      queries: [Query.equal('plato_id', dishId), Query.limit(100)],
    })

    await Promise.all(
      current.rows.map((row) =>
        tablesDB.deleteRow({
          databaseId: DATABASE_ID,
          tableId: TABLE_RECETAS_ID,
          rowId: row.$id,
        })
      )
    )

    for (const item of ingredients) {
      await tablesDB.createRow<RecipeRow>({
        databaseId: DATABASE_ID,
        tableId: TABLE_RECETAS_ID,
        rowId: ID.unique(),
        data: {
          plato_id: dishId,
          ingrediente_id: item.ingrediente_id,
          cantidad: round4(Number(item.cantidad)),
          unidad: item.unidad,
          merma_ingrediente_receta:
            item.merma_ingrediente_receta == null ? null : round2(item.merma_ingrediente_receta),
        },
      })
    }

    // Fetch created items with expanded ingredient_id.* so client immediately receives prices/wastage
    const refreshed = await tablesDB.listRows<RecipeRow>({
      databaseId: DATABASE_ID,
      tableId: TABLE_RECETAS_ID,
      queries: [
        Query.equal('plato_id', dishId),
        Query.select(['*', 'ingrediente_id.*']),
        Query.limit(100),
      ],
    })

    revalidatePath('/platos')
    return { success: true, data: refreshed.rows.map(parseRecipeRow) }
  } catch (error: unknown) {
    console.error(`Error syncing recipe for dish ${dishId}:`, error)
    return { success: false, error: 'No se pudo sincronizar la receta completa del plato.' }
  }
}

export async function checkDishPortionsFeasibility(dishId: string): Promise<ActionResponse<DishStockFeasibility>> {
  try {
    await requireKitchenAccess()
    if (!dishId) {
      return { success: false, error: 'ID de plato no proporcionado.' }
    }

    const dishRow = await tablesDB.getRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_PLATOS_ID,
      rowId: dishId,
    })

    const recipeRows = await tablesDB.listRows<RecipeRow>({
      databaseId: DATABASE_ID,
      tableId: TABLE_RECETAS_ID,
      queries: [
        Query.equal('plato_id', dishId),
        Query.select(['*', 'ingrediente_id.*']),
        Query.limit(100),
      ],
    })

    if (recipeRows.total === 0) {
      return {
        success: true,
        data: {
          platoId: dishId,
          platoNombre: String((dishRow as Record<string, unknown>).nombre || 'Plato'),
          maxPortionsPossible: 0,
          ingredientsRequirement: [],
        },
      }
    }

    let minPortions = Infinity
    const requirements: DishStockFeasibility['ingredientsRequirement'] = []

    for (const row of recipeRows.rows) {
      const parsed = parseRecipeRow(row)
      const ing = parsed.ingrediente

      const currentStock = ing ? ing.stock : 0
      const stockUnit = ing ? ing.unidad_de_masa : parsed.unidad
      const ingNombre = ing ? ing.nombre : parsed.ingrediente_id

      const wastage = resolveEffectiveWastage(
        parsed.merma_ingrediente_receta,
        ing?.merma_habitual ?? null
      )
      const grossInRecipeUnit =
        calculateGrossQuantity(parsed.cantidad, wastage.valid ? wastage.pct : 0) ?? parsed.cantidad

      const normalizedRequired = normalizeRecipeQuantity(grossInRecipeUnit, parsed.unidad, stockUnit)
      const effectiveRequired = normalizedRequired !== null ? normalizedRequired : grossInRecipeUnit

      const portionsCanMake =
        effectiveRequired > 0 ? Math.floor(currentStock / effectiveRequired) : 0

      if (portionsCanMake < minPortions) {
        minPortions = portionsCanMake
      }

      requirements.push({
        ingredienteId: parsed.ingrediente_id,
        nombre: ingNombre,
        currentStock,
        stockUnit,
        requiredPerPortion: parsed.cantidad,
        grossRequiredPerPortion: round4(grossInRecipeUnit),
        wastagePct: wastage.valid ? round2(wastage.pct) : 0,
        recipeUnit: parsed.unidad,
        normalizedRequiredPerPortion: round4(effectiveRequired),
        portionsCanMake,
        hasSufficientStock: portionsCanMake > 0,
      })
    }

    return {
      success: true,
      data: {
        platoId: dishId,
        platoNombre: String((dishRow as Record<string, unknown>).nombre || 'Plato'),
        maxPortionsPossible: Number.isFinite(minPortions) ? Math.max(0, minPortions) : 0,
        ingredientsRequirement: requirements,
      },
    }
  } catch (error: unknown) {
    console.error(`Error checking feasibility for dish ${dishId}:`, error)
    return {
      success: false,
      error: 'No se pudo calcular la disponibilidad de ingredientes para este plato.',
    }
  }
}
