'use server'

import { requireKitchenAccess } from '@/shared/api'

import { revalidatePath } from 'next/cache'
import type { SaveRecipeSheetInput } from '../model/recipe-sheet'
import { recipeSheetDb } from './recipe-sheet.repository'

export async function getRecipeSheetDishes() {
  await requireKitchenAccess()
  return recipeSheetDb.listDishes()
}

export async function getRecipeSheet(dishId: string) {
  await requireKitchenAccess()
  return recipeSheetDb.get(dishId)
}

export async function saveRecipeSheet(input: SaveRecipeSheetInput): Promise<{ error?: string }> {
  try {
    await requireKitchenAccess()
    const result = await recipeSheetDb.save(input)
    if (!result.error) {
      revalidatePath('/escandallos')
      revalidatePath('/platos')
    }
    return result
  } catch (error) {
    console.error('Error guardando el escandallo', error)
    return { error: 'No se pudo confirmar el guardado. El borrador sigue disponible.' }
  }
}
