import 'server-only'

import type { Models } from 'node-appwrite'
import { tablesDB, DATABASE_ID, TABLE_INGREDIENTES_ID, ID, Query } from './db'

// Storage contract, independent of feature and component code.
interface IngredientData {
  nombre: string
  descripcion: string | null
  stock: number
  unidad_de_masa: 'G' | 'KG' | 'ML' | 'L'
  precio_compra: number | null
  merma_habitual?: number | null
}

type IngredientRow = Models.Row & IngredientData

function serialize(row: IngredientRow) {
  return {
    $id: row.$id,
    $createdAt: row.$createdAt,
    $updatedAt: row.$updatedAt,
    nombre: row.nombre,
    descripcion: row.descripcion,
    stock: Number(row.stock),
    unidad_de_masa: row.unidad_de_masa,
    precio_compra: row.precio_compra == null ? null : Number(row.precio_compra),
    merma_habitual: row.merma_habitual == null ? null : Number(row.merma_habitual),
  }
}

export const ingredientDb = {
  async list() {
    const rows: IngredientRow[] = []
    const limit = 100

    for (let offset = 0; ; offset += limit) {
      const response = await tablesDB.listRows<IngredientRow>({
        databaseId: DATABASE_ID, tableId: TABLE_INGREDIENTES_ID,
        queries: [Query.orderDesc('$createdAt'), Query.limit(limit), Query.offset(offset)],
      })
      rows.push(...response.rows)
      if (response.rows.length < limit) break
    }

    return rows.map(serialize)
  },
  async create(data: IngredientData) {
    return serialize(await tablesDB.createRow<IngredientRow>({
      databaseId: DATABASE_ID, tableId: TABLE_INGREDIENTES_ID, rowId: ID.unique(), data,
    }))
  },
  async update(id: string, data: Partial<IngredientData>) {
    return serialize(await tablesDB.updateRow<IngredientRow>({
      databaseId: DATABASE_ID, tableId: TABLE_INGREDIENTES_ID, rowId: id, data,
    }))
  },
  async delete(id: string) {
    await tablesDB.deleteRow({ databaseId: DATABASE_ID, tableId: TABLE_INGREDIENTES_ID, rowId: id })
  },
}
