import { beforeEach, describe, expect, it, vi } from 'vitest'

const db = vi.hoisted(() => ({ listRows: vi.fn() }))
const api = vi.hoisted(() => ({ productosGetProductos: vi.fn() }))

vi.mock('@/shared/api', async () => {
  const { Query } = await import('node-appwrite')
  return {
    tablesDB: db,
    DATABASE_ID: 'db',
    TABLE_PLATOS_ID: 'dishes',
    Query,
    productosGetProductos: api.productosGetProductos,
  }
})

import { getClientMenu } from './client-menu'

describe('carta de clientes', () => {
  beforeEach(() => vi.resetAllMocks())

  it('muestra solo campos de carta y normaliza precio y disponibilidad', async () => {
    db.listRows.mockResolvedValue({
      rows: [{ $id: 'dish', nombre: 'Tortilla', precio: '12,50', foto: 'photo', stock: 3, receta_id: 'private' }],
    })
    api.productosGetProductos.mockResolvedValue({
      status: 200,
      data: [
        {
          id: 1,
          nombre: 'Agua',
          precio: '2.00',
          precio_compra: '1.00',
          stock: 0,
          categoria: 'Bebidas',
          foto: '',
        },
      ],
      headers: {},
    })

    const menu = await getClientMenu()
    expect(menu.dishes.data).toEqual([{ id: 'dish', type: 'plato', name: 'Tortilla', price: 12.5, category: null, photo: true, availability: 'bajo' }])
    expect(menu.products.data).toEqual([{ id: '1', type: 'producto', name: 'Agua', price: 2, category: 'Bebidas', photo: false, availability: 'agotado' }])
    expect(db.listRows).toHaveBeenCalledWith(expect.objectContaining({ ttl: 0, total: false }))
    expect(api.productosGetProductos).toHaveBeenCalledTimes(1)
  })

  it('conserva productos cuando falla la lectura de platos', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    db.listRows.mockRejectedValue(new Error('unavailable'))
    api.productosGetProductos.mockResolvedValue({
      status: 200,
      data: [],
      headers: {},
    })
    expect(await getClientMenu()).toEqual({ dishes: { data: null }, products: { data: [] } })
    log.mockRestore()
  })

  it('pagina los resultados y distingue un precio vacío de cero', async () => {
    db.listRows.mockImplementation(async ({ queries }) => {
      if (queries.some((query: string) => query.includes('cursorAfter'))) {
        return { rows: [{ $id: 'last', nombre: 'Agua', precio: '0', stock: 6 }] }
      }
      return { rows: Array.from({ length: 100 }, (_, i) => ({ $id: `dish-${i}`, nombre: 'Plato', precio: '', stock: 0 })) }
    })
    api.productosGetProductos.mockResolvedValue({
      status: 200,
      data: [],
      headers: {},
    })
    const menu = await getClientMenu()
    expect(menu.dishes.data).toHaveLength(101)
    expect(menu.dishes.data?.[0].price).toBeNull()
    expect(menu.dishes.data?.[100]).toMatchObject({ price: 0, availability: 'disponible' })
  })
})
