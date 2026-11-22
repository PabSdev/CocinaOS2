import { beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({
  platosGetPlatos: vi.fn(),
  productosGetProductos: vi.fn(),
}));

vi.mock('@/shared/api', () => api);

import { getClientMenu } from './client-menu';

const DISH_ID = '11111111-1111-4111-8111-111111111111';

describe('carta de clientes', () => {
  beforeEach(() => vi.resetAllMocks());

  it('muestra solo campos de carta y normaliza precio y disponibilidad', async () => {
    api.platosGetPlatos.mockResolvedValue({
      status: 200,
      data: [{ id: DISH_ID, nombre: 'Tortilla', precio: '12.50', foto: 'https://cdn.example.com/t.jpg', stock: 3 }],
      headers: {},
    });
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
    });

    const menu = await getClientMenu();
    expect(menu.dishes.data).toEqual([
      {
        id: DISH_ID,
        type: 'plato',
        name: 'Tortilla',
        price: 12.5,
        category: null,
        photo: true,
        availability: 'bajo',
      },
    ]);
    expect(menu.products.data).toEqual([
      {
        id: '1',
        type: 'producto',
        name: 'Agua',
        price: 2,
        category: 'Bebidas',
        photo: false,
        availability: 'agotado',
      },
    ]);
    expect(api.platosGetPlatos).toHaveBeenCalledTimes(1);
    expect(api.productosGetProductos).toHaveBeenCalledTimes(1);
  });

  it('conserva productos cuando falla la lectura de platos', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    api.platosGetPlatos.mockRejectedValue(new Error('unavailable'));
    api.productosGetProductos.mockResolvedValue({
      status: 200,
      data: [],
      headers: {},
    });
    expect(await getClientMenu()).toEqual({ dishes: { data: null }, products: { data: [] } });
    log.mockRestore();
  });

  it('distingue un precio vacío de cero', async () => {
    api.platosGetPlatos.mockResolvedValue({
      status: 200,
      data: [
        { id: DISH_ID, nombre: 'Plato 1', precio: '', stock: 0, foto: null },
        { id: '22222222-2222-4222-8222-222222222222', nombre: 'Plato 2', precio: '0', stock: 6, foto: null },
      ],
      headers: {},
    });
    api.productosGetProductos.mockResolvedValue({
      status: 200,
      data: [],
      headers: {},
    });
    const menu = await getClientMenu();
    expect(menu.dishes.data).toHaveLength(2);
    expect(menu.dishes.data?.[0].price).toBeNull();
    expect(menu.dishes.data?.[1]).toMatchObject({ price: 0, availability: 'disponible' });
  });
});
