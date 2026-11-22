import { beforeEach, describe, expect, it, vi } from 'vitest'

const db = vi.hoisted(() => ({
  getRow: vi.fn(), listRows: vi.fn(), createTransaction: vi.fn(), updateTransaction: vi.fn(),
  getTransaction: vi.fn(), updateRow: vi.fn(), createRow: vi.fn(), deleteRow: vi.fn(),
}))
vi.mock('server-only', () => ({}))
vi.mock('@/shared/api', async () => {
  const { Query } = await import('node-appwrite')
  return {
    tablesDB: db, DATABASE_ID: 'db', TABLE_PLATOS_ID: 'dishes', TABLE_RECETAS_ID: 'recipes', Query,
    ID: { unique: () => 'new-line' },
    ingredientesGetIngredientes: async () => ({
      status: 200,
      data: [
        { id: 'flour', unidad_de_masa: 'KG' },
        { id: 'oil', unidad_de_masa: 'L' },
      ],
    }),
  }
})

import { recipeSheetDb } from './recipe-sheet.repository'

const dish = { $id: 'dish', $updatedAt: 'v1', nombre: 'Sopa', precio: 5, receta_id: 'removed' }
const stored = [
  { $id: 'kept', $updatedAt: 'v1', ingrediente_id: 'flour', cantidad: 100, unidad: 'G' },
  { $id: 'removed', $updatedAt: 'v1', ingrediente_id: 'oil', cantidad: 10, unidad: 'ML' },
]
const flour = { id: 'kept', ingrediente_id: 'flour', cantidad: 150, unidad: 'G' } as const
const input = { dishId: 'dish', price: '6,50', version: JSON.stringify(['v1', [['kept', 'v1'], ['removed', 'v1']]]), lines: [flour] }

describe('guardado del escandallo', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    db.getRow.mockResolvedValue(dish)
    db.listRows.mockResolvedValue({ rows: stored })
    db.createTransaction.mockResolvedValue({ $id: 'tx' })
    db.getTransaction.mockResolvedValue({ status: 'pending' })
  })

  it('lee el precio numérico sin cambiar el formato de la ficha', async () => {
    expect((await recipeSheetDb.get('dish')).dish.precio).toBe('5')
    db.listRows.mockResolvedValueOnce({ rows: [dish] })
    expect((await recipeSheetDb.listDishes())[0].precio).toBe('5')
  })

  it.each(['-1', 'abc', 'Infinity'])('rechaza PVP inválido %s antes de escribir', async (price) => {
    expect(await recipeSheetDb.save({ ...input, price })).toHaveProperty('error')
    expect(db.createTransaction).not.toHaveBeenCalled()
  })

  it('conserva las líneas existentes, desvincula la relación antigua y confirma los cambios juntos', async () => {
    expect(await recipeSheetDb.save(input)).toEqual({})
    expect(db.updateRow).toHaveBeenNthCalledWith(1, expect.objectContaining({
      tableId: 'dishes', rowId: 'dish', transactionId: 'tx', data: { precio: 6.5, receta_id: null },
    }))
    expect(db.updateRow).toHaveBeenNthCalledWith(2, expect.objectContaining({
      tableId: 'recipes', rowId: 'kept', transactionId: 'tx', data: expect.objectContaining({ cantidad: 150 }),
    }))
    expect(db.deleteRow).toHaveBeenCalledWith(expect.objectContaining({ rowId: 'removed', transactionId: 'tx' }))
    expect(db.updateTransaction).toHaveBeenCalledExactlyOnceWith({ transactionId: 'tx', commit: true })
  })

  it('guarda sin escribir receta_id cuando la relación heredada ya no existe', async () => {
    db.getRow.mockResolvedValue({ $id: 'dish', $updatedAt: 'v1', nombre: 'Sopa', precio: 5 })
    expect(await recipeSheetDb.save(input)).toEqual({})
    expect(db.updateRow).toHaveBeenNthCalledWith(1, expect.objectContaining({
      tableId: 'dishes', rowId: 'dish', transactionId: 'tx', data: { precio: 6.5 },
    }))
    expect(db.updateTransaction).toHaveBeenCalledExactlyOnceWith({ transactionId: 'tx', commit: true })
  })

  it('admite guardar PVP cero y una receta vacía', async () => {
    expect(await recipeSheetDb.save({ ...input, price: '0', lines: [] })).toEqual({})
    expect(db.deleteRow).toHaveBeenCalledTimes(2)
    expect(db.updateTransaction).toHaveBeenCalledWith({ transactionId: 'tx', commit: true })
  })

  it.each([undefined, null, '', '   '])('guarda PVP cero si el precio es %s', async (price) => {
    expect(await recipeSheetDb.save({ ...input, price })).toEqual({})
    expect(db.updateRow).toHaveBeenNthCalledWith(1, expect.objectContaining({
      data: expect.objectContaining({ precio: 0 }),
    }))
  })

  it('rechaza las unidades incompatibles antes de escribir', async () => {
    expect(await recipeSheetDb.save({ ...input, lines: [{ ...flour, unidad: 'ML' }] })).toHaveProperty('error')
    expect(db.createTransaction).not.toHaveBeenCalled()
  })

  it('descarta la transacción si otra edición cambia la receta durante el guardado', async () => {
    db.listRows.mockResolvedValueOnce({ rows: stored }).mockResolvedValueOnce({ rows: [] })
    expect(await recipeSheetDb.save(input)).toHaveProperty('error')
    expect(db.updateTransaction).toHaveBeenCalledExactlyOnceWith({ transactionId: 'tx', rollback: true })
  })

  it('descarta los cambios preparados si una operación falla', async () => {
    db.deleteRow.mockRejectedValue(new Error('write failed'))
    await expect(recipeSheetDb.save(input)).rejects.toThrow('write failed')
    expect(db.updateTransaction).toHaveBeenCalledExactlyOnceWith({ transactionId: 'tx', rollback: true })
  })
})
