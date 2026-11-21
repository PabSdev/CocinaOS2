import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createDish, deleteDish, getDishes, updateDish } from './dish.actions'

const db = vi.hoisted(() => ({
  createRow: vi.fn(),
  updateRow: vi.fn(),
  getRow: vi.fn(),
  listRows: vi.fn(),
  deleteRow: vi.fn(),
}))

const mockStorage = vi.hoisted(() => ({
  createFile: vi.fn(),
  deleteFile: vi.fn(),
}))

const revalidatePath = vi.hoisted(() => vi.fn())

vi.mock('next/cache', () => ({ revalidatePath }))
vi.mock('@/shared/api', () => ({
  requireKitchenAccess: vi.fn().mockResolvedValue(undefined),
  tablesDB: db,
  storage: mockStorage,
  DATABASE_ID: 'db',
  TABLE_PLATOS_ID: 'dishes',
  BUCKET_FOTOS_ID: 'photos',
  ID: { unique: () => 'dish' },
  Query: { orderDesc: vi.fn(), limit: vi.fn() },
}))

const dish = { $id: 'dish', nombre: 'Sopa', precio: 8, stock: 0, foto: null }

describe('dish.actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    db.getRow.mockResolvedValue(dish)
    db.createRow.mockImplementation(async ({ data }) => ({ ...dish, ...data }))
    db.updateRow.mockImplementation(async ({ data }) => ({ ...dish, ...data }))
    mockStorage.deleteFile.mockResolvedValue({})
  })

  describe('getDishes', () => {
    it('recupera platos y formatea las propiedades', async () => {
      db.listRows.mockResolvedValueOnce({
        rows: [
          { $id: 'd1', $createdAt: '2026-01-01', $updatedAt: '2026-01-01', nombre: 'Paella', precio: 14.50, foto: 'f1', stock: 5 },
        ],
      })

      const res = await getDishes()

      expect(res.success).toBe(true)
      expect(res.data).toHaveLength(1)
      expect(res.data![0].nombre).toBe('Paella')
      expect(res.data![0].stock).toBe(5)
      expect(res.data![0].precio).toBe('14.5')
    })

    it('devuelve error controlado si falla la conexión con Appwrite', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      db.listRows.mockRejectedValueOnce(new Error('Network error'))

      const res = await getDishes()

      expect(res.success).toBe(false)
      expect(res.error).toBe('No se pudo cargar la lista de platos.')
      consoleSpy.mockRestore()
    })
  })

  describe('validaciones al crear platos', () => {
    it('rechaza plato con nombre vacío', async () => {
      const form = new FormData()
      form.set('nombre', '   ')
      const result = await createDish(form)

      expect(result.success).toBe(false)
      expect(result.error).toBe('El nombre del plato es obligatorio.')
      expect(db.createRow).not.toHaveBeenCalled()
    })

    it('rechaza plato con stock no numérico o negativo', async () => {
      const form = new FormData()
      form.set('nombre', 'Gazpacho')
      form.set('stock', '-5')
      const result = await createDish(form)

      expect(result.success).toBe(false)
      expect(result.error).toBe('El stock debe ser un número igual o mayor a 0.')
      expect(db.createRow).not.toHaveBeenCalled()
    })
  })

  describe('precio al guardar platos', () => {
    it.each(['-1', 'abc', 'Infinity', 'NaN'])('rechaza el precio inválido %s antes de escribir', async (price) => {
      const form = new FormData()
      form.set('nombre', 'Sopa')
      form.set('precio', price)
      expect((await createDish(form)).success).toBe(false)
      expect((await updateDish('dish', form)).success).toBe(false)
      expect(db.createRow).not.toHaveBeenCalled()
      expect(db.updateRow).not.toHaveBeenCalled()
    })

    it('mantiene el precio ausente como null al leer', async () => {
      db.listRows.mockResolvedValueOnce({ rows: [{ ...dish, precio: null }] })
      expect((await getDishes()).data?.[0].precio).toBeNull()
    })

    it.each([[undefined, 0], ['', 0], ['   ', 0], ['7,50', 7.5], ['7.50', 7.5]] as const)('crea el plato con precio %s', async (price, expected) => {
      const form = new FormData()
      form.set('nombre', 'Sopa')
      if (price !== undefined) form.set('precio', price)
      const result = await createDish(form)
      expect(result.success).toBe(true)
      expect(result.data?.precio).toBe(String(expected))
      expect(db.createRow).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ precio: expected }),
      }))
      expect(revalidatePath).toHaveBeenCalledWith('/platos')
    })

    it.each([['', 0], ['   ', 0], ['7,50', 7.5], ['7.50', 7.5]] as const)('actualiza el plato con precio %s', async (price, expected) => {
      const form = new FormData()
      form.set('precio', price)
      const result = await updateDish('dish', form)
      expect(result.success).toBe(true)
      expect(result.data?.precio).toBe(String(expected))
      expect(db.updateRow).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ precio: expected }),
      }))
      expect(revalidatePath).toHaveBeenCalledWith('/platos')
    })

    it('conserva el precio si una actualización no incluye ese campo', async () => {
      const result = await updateDish('dish', new FormData())
      expect(result.data?.precio).toBe('8')
      expect(db.updateRow).toHaveBeenCalledWith(expect.objectContaining({ data: {} }))
    })
  })

  describe('deleteDish', () => {
    it('rechaza id vacío', async () => {
      const res = await deleteDish('')
      expect(res.success).toBe(false)
      expect(res.error).toBe('ID de plato no proporcionado.')
    })

    it('elimina la foto de almacenamiento si el plato tiene foto vinculada', async () => {
      db.getRow.mockResolvedValueOnce({
        $id: 'dish-with-photo',
        foto: 'file-foto-123',
      })
      db.deleteRow.mockResolvedValueOnce({})

      const res = await deleteDish('dish-with-photo')

      expect(res.success).toBe(true)
      expect(mockStorage.deleteFile).toHaveBeenCalledWith({
        bucketId: 'photos',
        fileId: 'file-foto-123',
      })
      expect(db.deleteRow).toHaveBeenCalledWith({
        databaseId: 'db',
        tableId: 'dishes',
        rowId: 'dish-with-photo',
      })
      expect(revalidatePath).toHaveBeenCalledWith('/platos')
    })

    it('no intenta borrar foto si el plato no tiene foto', async () => {
      db.getRow.mockResolvedValueOnce({
        $id: 'dish-no-photo',
        foto: null,
      })
      db.deleteRow.mockResolvedValueOnce({})

      const res = await deleteDish('dish-no-photo')

      expect(res.success).toBe(true)
      expect(mockStorage.deleteFile).not.toHaveBeenCalled()
      expect(db.deleteRow).toHaveBeenCalledOnce()
    })
  })
})
