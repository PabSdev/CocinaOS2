import 'server-only'

import type { Models } from 'node-appwrite'
import type { RecipeSheet, RecipeSheetDish, SaveRecipeSheetInput } from '../model/recipe-sheet'
import type { RecipeItem } from '../model/types'
import { getCompatibleUnits, parseDishPrice, round2, round4 } from '../model/escandallo-operations'
import { DATABASE_ID, ID, Query, TABLE_PLATOS_ID, TABLE_RECETAS_ID, tablesDB, ingredientesGetIngredientes } from '@/shared/api'

type DishRow = Models.Row & Omit<RecipeSheetDish, 'precio'> & { precio?: number | null; receta_id?: string | null }
type RecipeRow = Models.Row & RecipeItem

const dishes = { databaseId: DATABASE_ID, tableId: TABLE_PLATOS_ID }
const recipes = { databaseId: DATABASE_ID, tableId: TABLE_RECETAS_ID }
const conflict = 'El plato o la receta han cambiado. Recarga la página antes de volver a guardar.'

async function listRows<T extends Models.Row>(table: typeof dishes, filters: string[] = []) {
  const rows: T[] = []
  const limit = 100
  let cursor: string | undefined

  for (;;) {
    const page = await tablesDB.listRows<T>({
      ...table,
      queries: [...filters, Query.orderAsc('$id'), Query.limit(limit), ...(cursor ? [Query.cursorAfter(cursor)] : [])],
      total: false,
    })
    rows.push(...page.rows)
    if (page.rows.length < limit) return rows
    cursor = page.rows.at(-1)!.$id
  }
}

function serializeDish({ $id, $createdAt, $updatedAt, nombre, precio, foto, stock }: DishRow): RecipeSheetDish {
  return { $id, $createdAt, $updatedAt, nombre, precio: precio == null ? null : String(precio), foto: foto ?? null, stock }
}

async function loadRows(dishId: string) {
  const [dish, lines] = await Promise.all([
    tablesDB.getRow<DishRow>({ ...dishes, rowId: dishId }),
    listRows<RecipeRow>(recipes, [Query.equal('plato_id', dishId)]),
  ])
  const version = JSON.stringify([dish.$updatedAt, lines.map((row) => [row.$id, row.$updatedAt])])
  return { dish, lines, version }
}

export const recipeSheetDb = {
  async listDishes() {
    const rows = await listRows<DishRow>(dishes)
    return rows.map(serializeDish).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
  },

  async get(dishId: string): Promise<RecipeSheet> {
    const { dish, lines, version } = await loadRows(dishId)
    return {
      dish: serializeDish(dish),
      lines: lines.map(({ $id, $createdAt, $updatedAt, plato_id, ingrediente_id, cantidad, unidad, merma_ingrediente_receta }) => ({
        $id, $createdAt, $updatedAt, plato_id, ingrediente_id, cantidad, unidad, merma_ingrediente_receta,
      })),
      version,
    }
  },

  async save(input: SaveRecipeSheetInput): Promise<{ error?: string }> {
    const normalizedPrice = (typeof input?.price === 'string' ? input.price.trim() : '') || '0'
    const price = parseDishPrice(normalizedPrice)
    if (!input?.dishId || typeof input.version !== 'string' || !Array.isArray(input.lines) || price === null) {
      return { error: 'Introduce un PVP válido, igual o mayor que cero.' }
    }

    const [current, ingredientsResponse] = await Promise.all([loadRows(input.dishId), ingredientesGetIngredientes()])
    if (ingredientsResponse.status !== 200) {
      throw new Error('No se pudieron cargar los ingredientes.')
    }
    if (current.version !== input.version) return { error: conflict }

    const currentById = new Map(current.lines.map((row) => [row.$id, row]))
    const ingredientsById = new Map(ingredientsResponse.data.map((row) => [row.id, row]))
    const retained = new Set<string>()
    const ingredientIds = new Set<string>()

    for (const line of input.lines) {
      const ingredient = ingredientsById.get(line?.ingrediente_id)
      if (!ingredient || ingredientIds.has(ingredient.id)) {
        return { error: 'Selecciona un ingrediente existente y distinto en cada línea.' }
      }
      ingredientIds.add(ingredient.id)
      if (line.id !== undefined) {
        if (!currentById.has(line.id) || retained.has(line.id)) return { error: conflict }
        retained.add(line.id)
      }
      if (!Number.isFinite(line.cantidad) || !Number.isFinite(round4(line.cantidad)) || round4(line.cantidad) <= 0) {
        return { error: 'Introduce una cantidad útil mayor que cero, con hasta cuatro decimales.' }
      }
      if (!getCompatibleUnits(ingredient.unidad_de_masa).includes(line.unidad)) {
        return { error: 'La unidad de la receta debe ser compatible con la unidad de compra.' }
      }
      const loss = line.merma_ingrediente_receta
      if (loss != null && (!Number.isFinite(loss) || loss < 0 || round2(loss) >= 100)) {
        return { error: 'La merma debe estar entre 0 % y 99,99 %.' }
      }
    }

    const removed = current.lines.filter((line) => !retained.has(line.$id))
    const { $id: transactionId } = await tablesDB.createTransaction()
    try {
      await tablesDB.updateRow({
        ...dishes, rowId: input.dishId, transactionId,
        data: {
          precio: price,
          // Break the legacy cascade link before deleting the line it points to.
          ...(removed.some((line) => line.$id === current.dish.receta_id) ? { receta_id: null } : {}),
        },
      })
      for (const line of input.lines) {
        const data = {
          ingrediente_id: line.ingrediente_id,
          cantidad: round4(line.cantidad),
          unidad: line.unidad,
          merma_ingrediente_receta: line.merma_ingrediente_receta == null ? null : round2(line.merma_ingrediente_receta),
        }
        if (line.id) {
          const previous = currentById.get(line.id)!
          if (previous.ingrediente_id === data.ingrediente_id && previous.cantidad === data.cantidad &&
              previous.unidad === data.unidad && (previous.merma_ingrediente_receta ?? null) === data.merma_ingrediente_receta) continue
          await tablesDB.updateRow({ ...recipes, rowId: line.id, transactionId, data })
        } else {
          await tablesDB.createRow({
            ...recipes, rowId: ID.unique(), transactionId, data: { ...data, plato_id: input.dishId },
          })
        }
      }
      for (const line of removed) {
        await tablesDB.deleteRow({ ...recipes, rowId: line.$id, transactionId })
      }

      if ((await loadRows(input.dishId)).version !== input.version) {
        await tablesDB.updateTransaction({ transactionId, rollback: true })
        return { error: conflict }
      }
      await tablesDB.updateTransaction({ transactionId, commit: true })
      return {}
    } catch (error) {
      try {
        const transaction = await tablesDB.getTransaction({ transactionId })
        if (transaction.status === 'committed') return {}
        if (transaction.status === 'pending') await tablesDB.updateTransaction({ transactionId, rollback: true })
      } catch (cleanupError) {
        console.error('Error comprobando la transacción de escandallo', cleanupError)
      }
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 409) {
        return { error: conflict }
      }
      throw error
    }
  },
}
