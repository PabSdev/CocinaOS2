'use server'

import { requireKitchenAccess } from '@/shared/api'

import { revalidatePath } from 'next/cache'
import type { Models } from 'node-appwrite'
import { InputFile } from 'node-appwrite/file'
import {
  tablesDB,
  storage,
  DATABASE_ID,
  TABLE_PLATOS_ID,
  BUCKET_FOTOS_ID,
  ID,
  Query,
} from '@/shared/api'
import type { Dish, ActionResponse } from '../model/types'

type DishRow = Models.Row & {
  nombre: string
  precio?: number | null
  foto: string | null
  stock: number
}

function readPrice(value: FormDataEntryValue | null): number | null {
  const price = Number((value?.toString().trim() || '0').replace(',', '.'))
  return Number.isFinite(price) && price >= 0 ? price : null
}

function toDish(row: DishRow): Dish {
  return {
    $id: row.$id,
    $createdAt: row.$createdAt,
    $updatedAt: row.$updatedAt,
    nombre: row.nombre,
    precio: row.precio == null ? null : String(row.precio),
    foto: row.foto || null,
    stock: Number(row.stock),
  }
}

/**
 * Fetch all dishes from Appwrite TablesDB
 */
export async function getDishes(): Promise<ActionResponse<Dish[]>> {
  try {
    await requireKitchenAccess()
    const response = await tablesDB.listRows<DishRow>({
      databaseId: DATABASE_ID,
      tableId: TABLE_PLATOS_ID,
      queries: [Query.orderDesc('$createdAt'), Query.limit(100)],
    })

    const rows = response.rows.map(toDish)

    return {
      success: true,
      data: rows,
    }
  } catch (error: unknown) {
    console.error('Error fetching dishes:', error)
    return {
      success: false,
      error: 'No se pudo cargar la lista de platos.',
    }
  }
}

/**
 * Create a new dish with optional photo upload to Appwrite Storage
 */
export async function createDish(formData: FormData): Promise<ActionResponse<Dish>> {
  try {
    await requireKitchenAccess()
    const nombre = formData.get('nombre')?.toString().trim()
    if (!nombre) {
      return { success: false, error: 'El nombre del plato es obligatorio.' }
    }

    const precio = readPrice(formData.get('precio'))
    if (precio === null) {
      return { success: false, error: 'Introduce un precio válido igual o mayor a 0.' }
    }

    const rawStock = formData.get('stock')?.toString()
    const stock = Number(rawStock ?? 0)
    if (!Number.isFinite(stock) || stock < 0) {
      return { success: false, error: 'El stock debe ser un número igual o mayor a 0.' }
    }

    let fotoId: string | null = null
    const fotoFile = formData.get('foto') as File | null

    if (fotoFile && fotoFile.size > 0 && typeof fotoFile.arrayBuffer === 'function') {
      const buffer = Buffer.from(await fotoFile.arrayBuffer())
      const inputFile = InputFile.fromBuffer(buffer, fotoFile.name || 'dish-photo.jpg')
      const uploaded = await storage.createFile({
        bucketId: BUCKET_FOTOS_ID,
        fileId: ID.unique(),
        file: inputFile,
      })
      fotoId = uploaded.$id
    }

    const payload = {
      nombre,
      precio,
      stock: Math.floor(stock),
      foto: fotoId,
    }

    const created = await tablesDB.createRow<DishRow>({
      databaseId: DATABASE_ID,
      tableId: TABLE_PLATOS_ID,
      rowId: ID.unique(),
      data: payload,
    })

    const dish = toDish(created)

    revalidatePath('/platos')
    return { success: true, data: dish }
  } catch (error: unknown) {
    console.error('Error creating dish:', error)
    return {
      success: false,
      error: 'No se pudo crear el plato. Verifica los datos e inténtalo de nuevo.',
    }
  }
}

/**
 * Update an existing dish, replacing or removing photo if specified
 */
export async function updateDish(
  id: string,
  formData: FormData
): Promise<ActionResponse<Dish>> {
  try {
    await requireKitchenAccess()
    if (!id) {
      return { success: false, error: 'ID de plato no proporcionado.' }
    }

    let currentDish: DishRow | null = null
    try {
      currentDish = await tablesDB.getRow<DishRow>({
        databaseId: DATABASE_ID,
        tableId: TABLE_PLATOS_ID,
        rowId: id,
      })
    } catch {
      // not found
    }

    const updateData: Partial<Pick<DishRow, 'nombre' | 'precio' | 'stock' | 'foto'>> = {}

    const nombre = formData.get('nombre')?.toString().trim()
    if (nombre) {
      updateData.nombre = nombre
    }

    const rawPrecio = formData.get('precio')
    if (rawPrecio !== null) {
      const precio = readPrice(rawPrecio)
      if (precio === null) {
        return { success: false, error: 'Introduce un precio válido igual o mayor a 0.' }
      }
      updateData.precio = precio
    }

    const rawStock = formData.get('stock')?.toString()
    if (rawStock !== undefined && rawStock !== null && rawStock !== '') {
      const stock = Number(rawStock)
      if (!Number.isFinite(stock) || stock < 0) {
        return { success: false, error: 'El stock debe ser un número igual o mayor a 0.' }
      }
      updateData.stock = Math.floor(stock)
    }

    const removeFoto = formData.get('removeFoto') === 'true'
    const fotoFile = formData.get('foto') as File | null

    if (fotoFile && fotoFile.size > 0 && typeof fotoFile.arrayBuffer === 'function') {
      const buffer = Buffer.from(await fotoFile.arrayBuffer())
      const inputFile = InputFile.fromBuffer(buffer, fotoFile.name || 'dish-photo.jpg')
      const uploaded = await storage.createFile({
        bucketId: BUCKET_FOTOS_ID,
        fileId: ID.unique(),
        file: inputFile,
      })

      if (currentDish?.foto) {
        await storage.deleteFile({
          bucketId: BUCKET_FOTOS_ID,
          fileId: currentDish.foto,
        }).catch((err) => console.warn('Could not delete old photo from storage:', err))
      }

      updateData.foto = uploaded.$id
    } else if (removeFoto) {
      if (currentDish?.foto) {
        await storage.deleteFile({
          bucketId: BUCKET_FOTOS_ID,
          fileId: currentDish.foto,
        }).catch((err) => console.warn('Could not delete photo from storage:', err))
      }
      updateData.foto = null
    }

    const updated = await tablesDB.updateRow<DishRow>({
      databaseId: DATABASE_ID,
      tableId: TABLE_PLATOS_ID,
      rowId: id,
      data: updateData,
    })

    const dish = toDish(updated)

    revalidatePath('/platos')
    return { success: true, data: dish }
  } catch (error: unknown) {
    console.error('Error updating dish:', error)
    return {
      success: false,
      error: 'No se pudo actualizar el plato.',
    }
  }
}

/**
 * Delete a dish and remove its linked photo from Storage
 */
export async function deleteDish(id: string): Promise<ActionResponse<boolean>> {
  try {
    await requireKitchenAccess()
    if (!id) {
      return { success: false, error: 'ID de plato no proporcionado.' }
    }

    try {
      const row = await tablesDB.getRow<DishRow>({
        databaseId: DATABASE_ID,
        tableId: TABLE_PLATOS_ID,
        rowId: id,
      })

      if (row.foto) {
        await storage.deleteFile({
          bucketId: BUCKET_FOTOS_ID,
          fileId: row.foto,
        }).catch((err) => console.warn('Could not delete photo from storage during dish deletion:', err))
      }
    } catch (err) {
      console.warn('Could not fetch row before deletion:', err)
    }

    await tablesDB.deleteRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_PLATOS_ID,
      rowId: id,
    })

    revalidatePath('/platos')
    return { success: true, data: true }
  } catch (error: unknown) {
    console.error('Error deleting dish:', error)
    return {
      success: false,
      error: 'No se pudo eliminar el plato.',
    }
  }
}
