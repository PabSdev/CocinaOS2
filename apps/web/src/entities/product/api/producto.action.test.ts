import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createProduct, deleteProduct, getProducts, updateProduct } from './producto.action'

const db = vi.hoisted(() => ({
  listRows: vi.fn(),
  createRow: vi.fn(),
  updateRow: vi.fn(),
  getRow: vi.fn(),
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
  TABLE_PRODUCTOS_ID: 'products',
  BUCKET_FOTOS_ID: 'photos',
  ID: { unique: () => 'product' },
  Query: { orderDesc: vi.fn(), limit: vi.fn(), offset: vi.fn() },
}))

const product = {
  $id: 'product',
  Nombre: 'Agua',
  precio: 2.5,
  precio_compra: 0.5,
  Cantidad: 10,
  Categoria: 'Bebidas',
  fotos: null,
}

describe('producto.action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    db.listRows.mockResolvedValue({ rows: [product] })
    db.getRow.mockResolvedValue(product)
    db.createRow.mockImplementation(async ({ data }) => ({ ...product, ...data }))
    db.updateRow.mockImplementation(async ({ data }) => ({ ...product, ...data }))
    mockStorage.deleteFile.mockResolvedValue({})
  })

  describe('getProducts', () => {
    it('lee precio en minúsculas sin convertirlo silenciosamente a cero', async () => {
      const result = await getProducts()
      expect(result.success).toBe(true)
      expect(result.data?.[0].precio).toBe(2.5)
    })

    it('captura errores de base de datos con mensaje comprensible', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      db.listRows.mockRejectedValueOnce(new Error('Appwrite timeout'))

      const result = await getProducts()
      expect(result.success).toBe(false)
      expect(result.error).toBe('No se pudo cargar el catálogo de productos.')
      consoleSpy.mockRestore()
    })
  })

  describe('validaciones al crear productos', () => {
    it('rechaza producto con nombre vacío', async () => {
      const form = new FormData()
      form.set('nombre', '   ')
      const res = await createProduct(form)
      expect(res.success).toBe(false)
      expect(res.error).toBe('El nombre del producto es obligatorio.')
    })

    it('rechaza stock negativo', async () => {
      const form = new FormData()
      form.set('nombre', 'Refresco')
      form.set('categoria', 'Bebidas')
      form.set('precio', '2.50')
      form.set('precio_compra', '1.00')
      form.set('stock', '-3')
      const res = await createProduct(form)
      expect(res.success).toBe(false)
      expect(res.error).toBe('La cantidad en stock debe ser 0 o mayor.')
    })

    it('rechaza precio no válido o negativo', async () => {
      const form = new FormData()
      form.set('nombre', 'Refresco')
      form.set('categoria', 'Bebidas')
      form.set('precio', '-1.50')
      const res = await createProduct(form)
      expect(res.success).toBe(false)
      expect(res.error).toBe('Introduce el precio válido igual o mayor a 0.')
    })

    it('rechaza archivos de foto con formato no admitido', async () => {
      const form = new FormData()
      form.set('nombre', 'Refresco')
      form.set('categoria', 'Bebidas')
      form.set('precio', '2.50')
      form.set('precio_compra', '1.00')
      const fakePdf = new File(['%PDF'], 'documento.pdf', { type: 'application/pdf' })
      form.set('foto', fakePdf)

      const res = await createProduct(form)
      expect(res.success).toBe(false)
      expect(res.error).toBe('Formato no compatible. Usa JPG, PNG o WebP.')
    })

    it('soporta formatos de importe con coma o punto de miles ("1.234,50")', async () => {
      const form = new FormData()
      form.set('nombre', 'Barril Cerveza')
      form.set('categoria', 'Bebidas')
      form.set('precio', '1.234,50')
      form.set('precio_compra', '850,25')
      form.set('stock', '5')

      const res = await createProduct(form)
      expect(res.success).toBe(true)
      expect(res.data?.precio).toBe(1234.5)
      expect(res.data?.precio_compra).toBe(850.25)
    })
  })

  describe('columna de precio de productos en Appwrite', () => {
    it.each(['crear', 'editar'])('guarda en la columna existente al %s', async (operation) => {
      const form = new FormData()
      form.set('nombre', 'Agua')
      form.set('categoria', 'Bebidas')
      form.set('precio', '3,50')
      form.set('precio_compra', '0,50')
      const result = operation === 'crear' ? await createProduct(form) : await updateProduct('product', form)
      expect(result.success).toBe(true)
      expect(result.data?.precio).toBe(3.5)
      const mutation = operation === 'crear' ? db.createRow : db.updateRow
      const data = mutation.mock.calls[0][0].data
      expect(data.precio).toBe(3.5)
      expect(data).not.toHaveProperty('Precio')
      expect(revalidatePath).toHaveBeenCalledWith('/productos')
    })
  })

  describe('deleteProduct', () => {
    it('rechaza ID de producto no proporcionado', async () => {
      const res = await deleteProduct('')
      expect(res.success).toBe(false)
      expect(res.error).toBe('ID de producto no proporcionado.')
    })

    it('elimina la foto de almacenamiento si existe', async () => {
      db.getRow.mockResolvedValueOnce({
        $id: 'prod-with-photo',
        fotos: 'photo-file-456',
      })
      db.deleteRow.mockResolvedValueOnce({})

      const res = await deleteProduct('prod-with-photo')

      expect(res.success).toBe(true)
      expect(mockStorage.deleteFile).toHaveBeenCalledWith({
        bucketId: 'photos',
        fileId: 'photo-file-456',
      })
      expect(db.deleteRow).toHaveBeenCalledWith({
        databaseId: 'db',
        tableId: 'products',
        rowId: 'prod-with-photo',
      })
      expect(revalidatePath).toHaveBeenCalledWith('/productos')
    })
  })
})
