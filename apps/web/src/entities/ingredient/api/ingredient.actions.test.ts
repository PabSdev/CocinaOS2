import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  ingredientesGetIngredientes,
  ingredientesCreateIngrediente,
  ingredientesUpdateIngrediente,
  ingredientesDeleteIngrediente,
} = vi.hoisted(() => ({
  ingredientesGetIngredientes: vi.fn(),
  ingredientesCreateIngrediente: vi.fn(),
  ingredientesUpdateIngrediente: vi.fn(),
  ingredientesDeleteIngrediente: vi.fn(),
}))

const revalidatePath = vi.hoisted(() => vi.fn())

vi.mock('@/shared/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/api')>()),
  requireKitchenAccess: vi.fn().mockResolvedValue(undefined),
  ingredientesGetIngredientes,
  ingredientesCreateIngrediente,
  ingredientesUpdateIngrediente,
  ingredientesDeleteIngrediente,
}))
vi.mock('next/cache', () => ({ revalidatePath }))

import {
  createIngredient,
  deleteIngredient,
  getIngredients,
  updateIngredient,
} from './ingredient.actions'

const ING_ID = '11111111-1111-4111-8111-111111111111'

describe('ingredient.actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getIngredients', () => {
    it('obtiene el listado de ingredientes y mapea los DTOs con éxito', async () => {
      ingredientesGetIngredientes.mockResolvedValueOnce({
        status: 200,
        data: [
          {
            id: ING_ID,
            nombre: 'Ajo',
            descripcion: null,
            stock: '2.5000',
            unidad_de_masa: 'KG',
            precio_compra: '4.1250',
            merma_habitual: '10.00',
            created_at: '2026-11-22T10:00:00Z',
            updated_at: '2026-11-22T11:00:00Z',
          },
        ],
      })

      const result = await getIngredients()

      expect(result.success).toBe(true)
      expect(result.data).toEqual([
        {
          $id: ING_ID,
          $createdAt: '2026-11-22T10:00:00Z',
          $updatedAt: '2026-11-22T11:00:00Z',
          nombre: 'Ajo',
          descripcion: null,
          stock: 2.5,
          unidad_de_masa: 'KG',
          precio_compra: 4.125,
          merma_habitual: 10,
        },
      ])
    })

    it('devuelve error si falla el cliente de API', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      ingredientesGetIngredientes.mockRejectedValueOnce(new Error('API failure'))

      const result = await getIngredients()

      expect(result.success).toBe(false)
      expect(result.error).toBe('No se pudo cargar el inventario.')
      consoleSpy.mockRestore()
    })
  })

  describe('createIngredient', () => {
    it('crea el ingrediente y redondea el precio a 4 decimales', async () => {
      ingredientesCreateIngrediente.mockImplementationOnce(async (payload) => ({
        status: 201,
        data: {
          id: ING_ID,
          ...payload,
          stock: String(payload.stock),
          precio_compra: String(payload.precio_compra),
          merma_habitual: null,
          created_at: '2026-11-22T10:00:00Z',
          updated_at: '2026-11-22T10:00:00Z',
        },
      }))

      const result = await createIngredient({
        nombre: '  Romero Fresco  ',
        descripcion: '  Manojo  ',
        stock: 5,
        unidad_de_masa: 'KG',
        precio_compra: 3.123456,
      })

      expect(result.success).toBe(true)
      expect(result.data?.$id).toBe(ING_ID)
      expect(result.data?.precio_compra).toBe(3.1235)
      expect(ingredientesCreateIngrediente).toHaveBeenCalledWith({
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
      expect(ingredientesCreateIngrediente).not.toHaveBeenCalled()
    })

    it('rechaza unidad de medida no permitida', async () => {
      const res = await createIngredient({
        nombre: 'Sal',
        stock: 1,
        unidad_de_masa: 'ONZAS' as never,
      })
      expect(res.success).toBe(false)
      expect(res.error).toBe('La unidad de medida no es válida.')
      expect(ingredientesCreateIngrediente).not.toHaveBeenCalled()
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
      expect(ingredientesCreateIngrediente).not.toHaveBeenCalled()
    })

    it.each([null, false, '', []])('rechaza stock inválido al crear: %s', async (stock) => {
      const result = await createIngredient({
        nombre: 'Harina',
        stock: stock as unknown as number,
        unidad_de_masa: 'KG',
      })

      expect(result.success).toBe(false)
      expect(ingredientesCreateIngrediente).not.toHaveBeenCalled()
    })
  })

  describe('updateIngredient', () => {
    it('rechaza id no proporcionado', async () => {
      const res = await updateIngredient('', { nombre: 'Nuevo' })
      expect(res.success).toBe(false)
      expect(res.error).toBe('ID de ingrediente no proporcionado.')
      expect(ingredientesUpdateIngrediente).not.toHaveBeenCalled()
    })

    it('rechaza id que no es UUID válido', async () => {
      const res = await updateIngredient('not-a-uuid', { nombre: 'Nuevo' })
      expect(res.success).toBe(false)
      expect(res.error).toBe('ID de ingrediente no válido.')
      expect(ingredientesUpdateIngrediente).not.toHaveBeenCalled()
    })

    it('actualiza parcialmente el ingrediente y revalida la ruta', async () => {
      ingredientesUpdateIngrediente.mockResolvedValueOnce({
        status: 200,
        data: {
          id: ING_ID,
          nombre: 'Ajo Morado',
          descripcion: null,
          stock: '10.0000',
          unidad_de_masa: 'KG',
          precio_compra: null,
          merma_habitual: null,
          created_at: '2026-11-22T10:00:00Z',
          updated_at: '2026-11-22T12:00:00Z',
        },
      })

      const res = await updateIngredient(ING_ID, {
        nombre: 'Ajo Morado',
        precio_compra: null,
      })

      expect(res.success).toBe(true)
      expect(res.data?.$id).toBe(ING_ID)
      expect(res.data?.precio_compra).toBeNull()
      expect(ingredientesUpdateIngrediente).toHaveBeenCalledWith(ING_ID, {
        nombre: 'Ajo Morado',
        precio_compra: null,
      })
      expect(revalidatePath).toHaveBeenCalledWith('/ingredientes')
    })

    it.each([null, false, '', []])('rechaza stock inválido al actualizar: %s', async (stock) => {
      const result = await updateIngredient(ING_ID, { stock: stock as unknown as number })

      expect(result.success).toBe(false)
      expect(ingredientesUpdateIngrediente).not.toHaveBeenCalled()
    })
  })

  describe('deleteIngredient', () => {
    it('rechaza id vacío', async () => {
      const res = await deleteIngredient('')
      expect(res.success).toBe(false)
      expect(res.error).toBe('ID de ingrediente no proporcionado.')
      expect(ingredientesDeleteIngrediente).not.toHaveBeenCalled()
    })

    it('rechaza id no válido', async () => {
      const res = await deleteIngredient('123')
      expect(res.success).toBe(false)
      expect(res.error).toBe('ID de ingrediente no válido.')
      expect(ingredientesDeleteIngrediente).not.toHaveBeenCalled()
    })

    it('elimina el ingrediente y revalida', async () => {
      ingredientesDeleteIngrediente.mockResolvedValueOnce({ status: 204, data: undefined })

      const res = await deleteIngredient(ING_ID)

      expect(res.success).toBe(true)
      expect(ingredientesDeleteIngrediente).toHaveBeenCalledWith(ING_ID)
      expect(revalidatePath).toHaveBeenCalledWith('/ingredientes')
    })
  })
})
