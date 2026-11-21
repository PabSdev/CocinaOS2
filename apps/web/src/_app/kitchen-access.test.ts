import { describe, expect, it, vi } from 'vitest'

vi.mock('@/shared/api', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/shared/api')>(),
  requireKitchenAccess: vi.fn().mockRejectedValue(new Error('Acceso restringido')),
  tablesDB: new Proxy({}, { get: () => vi.fn(() => { throw new Error('No debe acceder a datos') }) }),
}))

import { getDishes, createDish, updateDish, deleteDish } from '@/entities/dish'
import { getIngredients, createIngredient, updateIngredient, deleteIngredient } from '@/entities/ingredient'
import { getProducts, createProduct, updateProduct, deleteProduct } from '@/entities/product'
import * as recipes from '@/entities/recipe/api/recipe.actions'
import * as sheets from '@/entities/recipe/api/recipe-sheet.actions'

describe('Acceso directo a operaciones de cocina', () => {
  it('rechaza lecturas y mutaciones sin autorización', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const operations = [getDishes, createDish, updateDish, deleteDish,
      getIngredients, createIngredient, updateIngredient, deleteIngredient,
      getProducts, createProduct, updateProduct, deleteProduct,
      ...Object.values(recipes), ...Object.values(sheets)]
    for (const operation of operations) {
      // Sin argumentos: la autorización debe preceder a cualquier lectura del input.
      try {
        const result = await (operation as () => Promise<{ success?: boolean; error?: string }>)()
        expect(result.success === false || Boolean(result.error)).toBe(true)
      } catch (error) {
        expect((error as Error).message).toBe('Acceso restringido')
      }
    }
    vi.restoreAllMocks()
  })
})
