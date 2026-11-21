import { beforeEach, describe, expect, it, vi } from 'vitest'

const db = vi.hoisted(() => ({
  listRows: vi.fn(),
  getRow: vi.fn(),
  createRow: vi.fn(),
  updateRow: vi.fn(),
  deleteRow: vi.fn(),
}))

const revalidatePath = vi.hoisted(() => vi.fn())

vi.mock('next/cache', () => ({ revalidatePath }))
vi.mock('@/shared/api', () => ({
  requireKitchenAccess: vi.fn().mockResolvedValue(undefined),
  tablesDB: db,
  DATABASE_ID: 'test-db',
  TABLE_RECETAS_ID: 'test-recetas',
  TABLE_PLATOS_ID: 'test-platos',
  ID: { unique: () => 'generated-recipe-id' },
  Query: {
    select: vi.fn((fields) => `select(${fields.join(',')})`),
    limit: vi.fn((lim) => `limit(${lim})`),
    orderDesc: vi.fn((f) => `orderDesc(${f})`),
    equal: vi.fn((attr, val) => `equal(${attr},${val})`),
  },
}))

import {
  checkDishPortionsFeasibility,
  createRecipeItem,
  deleteRecipeItem,
  getDishesByIngredient,
  getRecipeByDish,
  getRecipeItemById,
  getRecipeItems,
  setDishRecipe,
  updateRecipeItem,
} from './recipe.actions'

describe('recipe.actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getRecipeItems y consultas', () => {
    it('obtiene items de recetas y parsea las relaciones con éxito', async () => {
      const mockRow = {
        $id: 'rec-1',
        $createdAt: '2026-01-01',
        $updatedAt: '2026-01-01',
        plato_id: { $id: 'dish-1', nombre: 'Tortilla', precio: '6.50', stock: 10, foto: null },
        ingrediente_id: {
          $id: 'ing-1',
          nombre: 'Huevo',
          stock: 60,
          unidad_de_masa: 'KG',
          precio_compra: 3.0,
          merma_habitual: 5,
        },
        cantidad: 200,
        unidad: 'G',
        merma_ingrediente_receta: null,
      }

      db.listRows.mockResolvedValueOnce({ rows: [mockRow] })

      const res = await getRecipeItems()

      expect(res.success).toBe(true)
      expect(res.data).toHaveLength(1)
      expect(res.data![0].plato_id).toBe('dish-1')
      expect(res.data![0].plato?.nombre).toBe('Tortilla')
      expect(res.data![0].ingrediente?.nombre).toBe('Huevo')
    })

    it('devuelve error si getRecipeByDish no recibe dishId', async () => {
      const res = await getRecipeByDish('')
      expect(res.success).toBe(false)
      expect(res.error).toBe('ID de plato no proporcionado.')
      expect(db.listRows).not.toHaveBeenCalled()
    })

    it('devuelve error si getDishesByIngredient no recibe ingredientId', async () => {
      const res = await getDishesByIngredient('')
      expect(res.success).toBe(false)
      expect(res.error).toBe('ID de ingrediente no proporcionado.')
    })

    it('devuelve error si getRecipeItemById no recibe id', async () => {
      const res = await getRecipeItemById('')
      expect(res.success).toBe(false)
      expect(res.error).toBe('ID de elemento de receta no proporcionado.')
    })
  })

  describe('createRecipeItem', () => {
    it('rechaza inputs inválidos (plato vacío, cantidad <= 0, unidad inválida o merma >= 100)', async () => {
      expect((await createRecipeItem({ plato_id: '', ingrediente_id: 'i1', cantidad: 10, unidad: 'G' })).success).toBe(false)
      expect((await createRecipeItem({ plato_id: 'p1', ingrediente_id: '', cantidad: 10, unidad: 'G' })).success).toBe(false)
      expect((await createRecipeItem({ plato_id: 'p1', ingrediente_id: 'i1', cantidad: 0, unidad: 'G' })).success).toBe(false)
      expect((await createRecipeItem({ plato_id: 'p1', ingrediente_id: 'i1', cantidad: 10, unidad: 'PULGADAS' as any })).success).toBe(false)
      expect((await createRecipeItem({ plato_id: 'p1', ingrediente_id: 'i1', cantidad: 10, unidad: 'G', merma_ingrediente_receta: 100 })).success).toBe(false)
    })

    it('crea un nuevo registro si el ingrediente aún no formaba parte de la receta', async () => {
      db.listRows.mockResolvedValueOnce({ total: 0, rows: [] })
      db.createRow.mockResolvedValueOnce({
        $id: 'generated-recipe-id',
        plato_id: 'p1',
        ingrediente_id: 'i1',
        cantidad: 150,
        unidad: 'G',
        merma_ingrediente_receta: 10,
      })

      const res = await createRecipeItem({
        plato_id: 'p1',
        ingrediente_id: 'i1',
        cantidad: 150,
        unidad: 'G',
        merma_ingrediente_receta: 10,
      })

      expect(res.success).toBe(true)
      expect(db.createRow).toHaveBeenCalledWith(
        expect.objectContaining({
          rowId: 'generated-recipe-id',
          data: {
            plato_id: 'p1',
            ingrediente_id: 'i1',
            cantidad: 150,
            unidad: 'G',
            merma_ingrediente_receta: 10,
          },
        })
      )
      expect(revalidatePath).toHaveBeenCalledWith('/platos')
    })

    it('actualiza el registro existente (UPSERT) si el ingrediente ya estaba en la receta', async () => {
      db.listRows.mockResolvedValueOnce({
        total: 1,
        rows: [{ $id: 'existing-row-id', plato_id: 'p1', ingrediente_id: 'i1' }],
      })
      db.updateRow.mockResolvedValueOnce({
        $id: 'existing-row-id',
        plato_id: 'p1',
        ingrediente_id: 'i1',
        cantidad: 200,
        unidad: 'G',
        merma_ingrediente_receta: null,
      })

      const res = await createRecipeItem({
        plato_id: 'p1',
        ingrediente_id: 'i1',
        cantidad: 200,
        unidad: 'G',
      })

      expect(res.success).toBe(true)
      expect(db.updateRow).toHaveBeenCalledWith(
        expect.objectContaining({
          rowId: 'existing-row-id',
          data: {
            cantidad: 200,
            unidad: 'G',
            merma_ingrediente_receta: null,
          },
        })
      )
      expect(db.createRow).not.toHaveBeenCalled()
      expect(revalidatePath).toHaveBeenCalledWith('/platos')
    })
  })

  describe('updateRecipeItem y deleteRecipeItem', () => {
    it('valida ID y campos parciales en updateRecipeItem', async () => {
      expect((await updateRecipeItem('', {})).success).toBe(false)
      expect((await updateRecipeItem('rec-1', { cantidad: -5 })).success).toBe(false)
      expect((await updateRecipeItem('rec-1', { unidad: 'UNKNOWN' as any })).success).toBe(false)
      expect((await updateRecipeItem('rec-1', { merma_ingrediente_receta: 120 })).success).toBe(false)
    })

    it('elimina un elemento de receta y revalida /platos', async () => {
      db.deleteRow.mockResolvedValueOnce({})

      const res = await deleteRecipeItem('rec-to-delete')

      expect(res.success).toBe(true)
      expect(db.deleteRow).toHaveBeenCalledWith(
        expect.objectContaining({ rowId: 'rec-to-delete' })
      )
      expect(revalidatePath).toHaveBeenCalledWith('/platos')
    })
  })

  describe('setDishRecipe', () => {
    it('valida que todas las líneas tengan cantidad positiva y unidades válidas', async () => {
      const res = await setDishRecipe('dish-1', [
        { ingrediente_id: 'i1', cantidad: 0, unidad: 'G' },
      ])
      expect(res.success).toBe(false)
      expect(res.error).toBe('Todas las cantidades útiles deben ser mayores a 0.')
    })

    it('sincroniza en bloque: elimina líneas previas y crea las nuevas', async () => {
      // Líneas existentes a borrar
      db.listRows
        .mockResolvedValueOnce({
          total: 1,
          rows: [{ $id: 'old-line-1' }],
        })
        .mockResolvedValueOnce({
          // Refresco posterior
          total: 1,
          rows: [
            {
              $id: 'new-line-1',
              plato_id: 'dish-1',
              ingrediente_id: 'i1',
              cantidad: 100,
              unidad: 'G',
              merma_ingrediente_receta: null,
            },
          ],
        })

      db.deleteRow.mockResolvedValue({})
      db.createRow.mockResolvedValue({})

      const res = await setDishRecipe('dish-1', [
        { ingrediente_id: 'i1', cantidad: 100, unidad: 'G' },
      ])

      expect(res.success).toBe(true)
      expect(db.deleteRow).toHaveBeenCalledWith(
        expect.objectContaining({ rowId: 'old-line-1' })
      )
      expect(db.createRow).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            plato_id: 'dish-1',
            ingrediente_id: 'i1',
            cantidad: 100,
            unidad: 'G',
            merma_ingrediente_receta: null,
          },
        })
      )
      expect(revalidatePath).toHaveBeenCalledWith('/platos')
    })
  })

  describe('checkDishPortionsFeasibility (viabilidad de stock y raciones posibles)', () => {
    it('devuelve 0 raciones posibles si el plato no tiene receta', async () => {
      db.getRow.mockResolvedValueOnce({ $id: 'dish-empty', nombre: 'Plato Vacío' })
      db.listRows.mockResolvedValueOnce({ total: 0, rows: [] })

      const res = await checkDishPortionsFeasibility('dish-empty')

      expect(res.success).toBe(true)
      expect(res.data?.maxPortionsPossible).toBe(0)
      expect(res.data?.ingredientsRequirement).toEqual([])
    })

    it('calcula las raciones posibles con merma y conversión de unidades (G <-> KG)', async () => {
      db.getRow.mockResolvedValueOnce({ $id: 'dish-1', nombre: 'Hamburguesa' })

      // Receta:
      // 1. Carne: 200g por ración (almacén en KG, stock: 1 KG = 1000g -> da para 5 raciones)
      // 2. Pan: 1 UD/G (almacén en G, stock: 3 -> da para 3 raciones, ES EL CUELLO DE BOTELLA)
      const mockRows = [
        {
          $id: 'line-1',
          plato_id: 'dish-1',
          ingrediente_id: {
            $id: 'ing-carne',
            nombre: 'Carne Picada',
            stock: 1, // 1 KG
            unidad_de_masa: 'KG',
            merma_habitual: 0,
          },
          cantidad: 200,
          unidad: 'G',
          merma_ingrediente_receta: null,
        },
        {
          $id: 'line-2',
          plato_id: 'dish-1',
          ingrediente_id: {
            $id: 'ing-pan',
            nombre: 'Pan Brioche',
            stock: 3, // 3 G
            unidad_de_masa: 'G',
            merma_habitual: 0,
          },
          cantidad: 1,
          unidad: 'G',
          merma_ingrediente_receta: null,
        },
      ]

      db.listRows.mockResolvedValueOnce({ total: 2, rows: mockRows })

      const res = await checkDishPortionsFeasibility('dish-1')

      expect(res.success).toBe(true)
      expect(res.data?.platoNombre).toBe('Hamburguesa')
      // El pan limita a 3 raciones
      expect(res.data?.maxPortionsPossible).toBe(3)
      expect(res.data?.ingredientsRequirement).toHaveLength(2)
      expect(res.data?.ingredientsRequirement[0].portionsCanMake).toBe(5)
      expect(res.data?.ingredientsRequirement[1].portionsCanMake).toBe(3)
      expect(res.data?.ingredientsRequirement[1].hasSufficientStock).toBe(true)
    })
  })
})
