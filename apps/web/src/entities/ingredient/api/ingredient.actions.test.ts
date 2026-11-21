vi.mock('@/shared/api', () => ({ requireKitchenAccess: vi.fn().mockResolvedValue(undefined) }))
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { create, update, list, del } = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  list: vi.fn(),
  del: vi.fn(),
}))

const revalidatePath = vi.hoisted(() => vi.fn())

vi.mock('@/shared/api/ingredients', () => ({
  ingredientDb: {
    create,
    update,
    list,
    delete: del,
  },
}))
vi.mock('next/cache', () => ({ revalidatePath }))

import {
  createIngredient,
  deleteIngredient,
  getIngredients,
  updateIngredient,
} from './ingredient.actions'

describe('ingredient.actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getIngredients', () => {
    it('obtiene el listado de ingredientes con éxito', async () => {
      const data = [{ $id: 'ing-1', nombre: 'Ajo' }]
      list.mockResolvedValueOnce(data)

      const result = await getIngredients()

      expect(result.success).toBe(true)
      expect(result.data).toBe(data)
    })

    it('devuelve error si falla el repositorio', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      list.mockRejectedValueOnce(new Error('DB failure'))

      const result = await getIngredients()

      expect(result.success).toBe(false)
      expect(result.error).toBe('No se pudo cargar el inventario.')
      consoleSpy.mockRestore()
    })
  })

  describe('createIngredient', () => {
    it('crea el ingrediente y redondea el precio a 4 decimales', async () => {
      create.mockImplementationOnce(async (payload) => ({ $id: 'new-id', ...payload }))

      const result = await createIngredient({
        nombre: '  Romero Fresco  ',
        descripcion: '  Manojo  ',
        stock: 5,
        unidad_de_masa: 'KG',
        precio_compra: 3.123456,
      })

      expect(result.success).toBe(true)
      expect(create).toHaveBeenCalledWith({
        nombre: 'Romero Fresco',
        descripcion: 'Manojo',
        stock: 5,
        unidad_de_masa: 'KG',
        precio_compra: 3.1235,
      })
      expect(revalidatePath).toHaveBeenCalledWith('/ingredientes')
    })

    it('rechaza nombre vacío', async () => {
      const res = await createIngredient({
        nombre: '   ',
        stock: 1,
        unidad_de_masa: 'KG',
      })
      expect(res.success).toBe(false)
      expect(res.error).toBe('El nombre del ingrediente es obligatorio.')
      expect(create).not.toHaveBeenCalled()
    })

    it('rechaza unidad de medida no permitida', async () => {
      const res = await createIngredient({
        nombre: 'Sal',
        stock: 1,
        unidad_de_masa: 'ONZAS' as any,
      })
      expect(res.success).toBe(false)
      expect(res.error).toBe('La unidad de medida no es válida.')
      expect(create).not.toHaveBeenCalled()
    })

    it('rechaza precio de compra negativo', async () => {
      const res = await createIngredient({
        nombre: 'Sal',
        stock: 1,
        unidad_de_masa: 'KG',
        precio_compra: -2,
      })
      expect(res.success).toBe(false)
      expect(res.error).toBe('El precio de compra debe ser un número igual o mayor a 0.')
    })

    it.each([null, false, '', []])('rechaza stock inválido al crear: %s', async (stock) => {
      const result = await createIngredient({
        nombre: 'Harina',
        stock: stock as unknown as number,
        unidad_de_masa: 'KG',
      })

      expect(result.success).toBe(false)
      expect(create).not.toHaveBeenCalled()
    })
  })

  describe('updateIngredient', () => {
    it('rechaza id no proporcionado', async () => {
      const res = await updateIngredient('', { nombre: 'Nuevo' })
      expect(res.success).toBe(false)
      expect(res.error).toBe('ID de ingrediente no proporcionado.')
    })

    it('actualiza el ingrediente y revalida la ruta', async () => {
      update.mockResolvedValueOnce({ $id: 'ing-1', nombre: 'Ajo Morado' })

      const res = await updateIngredient('ing-1', {
        nombre: 'Ajo Morado',
        precio_compra: null,
      })

      expect(res.success).toBe(true)
      expect(update).toHaveBeenCalledWith('ing-1', {
        nombre: 'Ajo Morado',
        precio_compra: null,
      })
      expect(revalidatePath).toHaveBeenCalledWith('/ingredientes')
    })

    it.each([null, false, '', []])('rechaza stock inválido al actualizar: %s', async (stock) => {
      const result = await updateIngredient('ingredient-id', { stock: stock as unknown as number })

      expect(result.success).toBe(false)
      expect(update).not.toHaveBeenCalled()
    })
  })

  describe('deleteIngredient', () => {
    it('rechaza id vacío', async () => {
      const res = await deleteIngredient('')
      expect(res.success).toBe(false)
      expect(res.error).toBe('ID de ingrediente no proporcionado.')
    })

    it('elimina el ingrediente y revalida', async () => {
      del.mockResolvedValueOnce({})

      const res = await deleteIngredient('ing-123')

      expect(res.success).toBe(true)
      expect(del).toHaveBeenCalledWith('ing-123')
      expect(revalidatePath).toHaveBeenCalledWith('/ingredientes')
    })
  })
})
