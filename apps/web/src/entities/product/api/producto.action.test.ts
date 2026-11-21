import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createProduct, deleteProduct, getProducts, updateProduct } from './producto.action'

const api = vi.hoisted(() => ({
  productosGetProductos: vi.fn(),
  productosCreateProducto: vi.fn(),
  productosGetProductoById: vi.fn(),
  productosUpdateProducto: vi.fn(),
  productosDeleteProducto: vi.fn(),
}))

const revalidatePath = vi.hoisted(() => vi.fn())

vi.mock('next/cache', () => ({ revalidatePath }))
vi.mock('@/shared/api', () => ({
  requireKitchenAccess: vi.fn().mockResolvedValue(undefined),
  Categoria: {
    Bebidas: 'Bebidas',
    Salsas: 'Salsas',
    Conservas: 'Conservas',
    Lácteos: 'Lácteos',
    Postres: 'Postres',
    Envases: 'Envases',
  },
  ...api,
}))

const productDto = {
  id: 1,
  nombre: 'Agua',
  precio: '2.50',
  precio_compra: '0.50',
  stock: 10,
  categoria: 'Bebidas',
  foto: '',
}

describe('producto.action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.productosGetProductos.mockResolvedValue({
      status: 200,
      data: [productDto],
      headers: {},
    })
    api.productosGetProductoById.mockResolvedValue({
      status: 200,
      data: productDto,
      headers: {},
    })
    api.productosCreateProducto.mockImplementation(async (payload) => ({
      status: 201,
      data: {
        ...productDto,
        ...payload,
        precio: String(payload.precio),
        precio_compra: String(payload.precio_compra),
      },
      headers: {},
    }))
    api.productosUpdateProducto.mockImplementation(async (id, payload) => ({
      status: 200,
      data: {
        ...productDto,
        ...payload,
        id,
        precio: String(payload.precio),
        precio_compra: String(payload.precio_compra),
      },
      headers: {},
    }))
    api.productosDeleteProducto.mockResolvedValue({
      status: 204,
      data: undefined,
      headers: {},
    })
  })

  describe('getProducts', () => {
    it('convierte decimales de string a number y mapea id a $id', async () => {
      const result = await getProducts()
      expect(result.success).toBe(true)
      expect(result.data).toEqual([
        {
          $id: '1',
          $createdAt: '',
          $updatedAt: '',
          nombre: 'Agua',
          precio: 2.5,
          precio_compra: 0.5,
          stock: 10,
          categoria: 'Bebidas',
          foto: null,
        },
      ])
    })

    it('captura errores de red o API con mensaje comprensible', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      api.productosGetProductos.mockRejectedValueOnce(new Error('API timeout'))

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

    it('rechaza categoría fuera del contrato oficial', async () => {
      const form = new FormData()
      form.set('nombre', 'Refresco')
      form.set('categoria', 'Inventada')
      form.set('precio', '2.50')
      form.set('precio_compra', '1.00')
      const res = await createProduct(form)
      expect(res.success).toBe(false)
      expect(res.error).toBe('Selecciona una categoría válida.')
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

    it('rechaza URLs de foto inválidas o archivos subidos directamente', async () => {
      const form = new FormData()
      form.set('nombre', 'Refresco')
      form.set('categoria', 'Bebidas')
      form.set('precio', '2.50')
      form.set('precio_compra', '1.00')
      form.set('foto', 'no-es-una-url')

      const res = await createProduct(form)
      expect(res.success).toBe(false)
      expect(res.error).toBe('Introduce una URL de imagen válida (http://, https:// o /...).')
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

    it('permite crear productos en la categoría Envases con URL opcional', async () => {
      const form = new FormData()
      form.set('nombre', 'Envase Kraft 500ml')
      form.set('categoria', 'Envases')
      form.set('precio', '0,50')
      form.set('precio_compra', '0,15')
      form.set('stock', '100')
      form.set('foto', 'https://cdn.example.com/envase.webp')

      const res = await createProduct(form)
      expect(res.success).toBe(true)
      expect(api.productosCreateProducto).toHaveBeenCalledWith({
        nombre: 'Envase Kraft 500ml',
        categoria: 'Envases',
        precio: 0.5,
        precio_compra: 0.15,
        stock: 100,
        foto: 'https://cdn.example.com/envase.webp',
      })
      expect(res.data?.categoria).toBe('Envases')
      expect(res.data?.foto).toBe('https://cdn.example.com/envase.webp')
      expect(revalidatePath).toHaveBeenCalledWith('/productos')
    })
  })

  describe('updateProduct', () => {
    it('rechaza ID no numérico o inválido', async () => {
      const form = new FormData()
      form.set('nombre', 'Agua')
      const res = await updateProduct('abc', form)
      expect(res.success).toBe(false)
      expect(res.error).toBe('ID de producto no válido.')
    })

    it('combina actualizaciones parciales con el producto actual y revalida la ruta', async () => {
      const form = new FormData()
      form.set('nombre', 'Agua Mineral')
      form.set('categoria', 'Bebidas')
      form.set('precio', '3,50')
      form.set('precio_compra', '0,50')

      const result = await updateProduct('1', form)

      expect(result.success).toBe(true)
      expect(api.productosGetProductoById).toHaveBeenCalledWith(1)
      expect(api.productosUpdateProducto).toHaveBeenCalledWith(1, {
        nombre: 'Agua Mineral',
        categoria: 'Bebidas',
        precio: 3.5,
        precio_compra: 0.5,
        stock: 10,
        foto: '',
      })
      expect(result.data?.precio).toBe(3.5)
      expect(revalidatePath).toHaveBeenCalledWith('/productos')
    })

    it('limpia la fotografía cuando se envía removeFoto=true', async () => {
      const form = new FormData()
      form.set('nombre', 'Agua')
      form.set('categoria', 'Bebidas')
      form.set('precio', '2.50')
      form.set('precio_compra', '0.50')
      form.set('stock', '10')
      form.set('removeFoto', 'true')

      const result = await updateProduct('1', form)

      expect(result.success).toBe(true)
      expect(api.productosGetProductoById).not.toHaveBeenCalled()
      expect(api.productosUpdateProducto).toHaveBeenCalledWith(1, {
        nombre: 'Agua',
        categoria: 'Bebidas',
        precio: 2.5,
        precio_compra: 0.5,
        stock: 10,
        foto: '',
      })
    })
  })

  describe('deleteProduct', () => {
    it('rechaza ID de producto no proporcionado', async () => {
      const res = await deleteProduct('')
      expect(res.success).toBe(false)
      expect(res.error).toBe('ID de producto no proporcionado.')
    })

    it('rechaza ID de producto no numérico', async () => {
      const res = await deleteProduct('no-id')
      expect(res.success).toBe(false)
      expect(res.error).toBe('ID de producto no válido.')
    })

    it('elimina el producto en FastAPI y revalida la ruta', async () => {
      const res = await deleteProduct('1')

      expect(res.success).toBe(true)
      expect(api.productosDeleteProducto).toHaveBeenCalledWith(1)
      expect(revalidatePath).toHaveBeenCalledWith('/productos')
    })
  })
})
