import { beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({
  platosGetPlatos: vi.fn(),
  platosCreatePlato: vi.fn(),
  platosUpdatePlato: vi.fn(),
  platosDeletePlato: vi.fn(),
}));
const revalidatePath = vi.hoisted(() => vi.fn());

vi.mock('next/cache', () => ({ revalidatePath }));
vi.mock('@/shared/api', () => ({
  requireKitchenAccess: vi.fn().mockResolvedValue(undefined),
  ...api,
}));

import { createDish, deleteDish, getDishes, updateDish } from './dish.actions';

const DISH_ID = '11111111-1111-4111-8111-111111111111';
const sampleDto = {
  id: DISH_ID,
  nombre: 'Tortilla',
  precio: '8.50',
  stock: 10,
  foto: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

describe('dish.actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lista platos desde FastAPI', async () => {
    api.platosGetPlatos.mockResolvedValueOnce({ status: 200, data: [sampleDto], headers: {} });
    const res = await getDishes();
    expect(res.success).toBe(true);
    expect(res.data).toEqual([
      {
        $id: DISH_ID,
        $createdAt: '2026-01-01T00:00:00Z',
        $updatedAt: '2026-01-01T00:00:00Z',
        nombre: 'Tortilla',
        precio: '8.50',
        foto: null,
        stock: 10,
      },
    ]);
  });

  it('crea un plato válido y rechaza subida de archivos', async () => {
    api.platosCreatePlato.mockResolvedValueOnce({ status: 201, data: sampleDto, headers: {} });
    const form = new FormData();
    form.set('nombre', 'Tortilla');
    form.set('precio', '8,50 €');
    form.set('stock', '10');

    const res = await createDish(form);
    expect(res.success).toBe(true);
    expect(api.platosCreatePlato).toHaveBeenCalledWith({
      nombre: 'Tortilla',
      precio: 8.5,
      stock: 10,
      foto: null,
    });
    expect(revalidatePath).toHaveBeenCalledWith('/platos');
    expect(revalidatePath).toHaveBeenCalledWith('/escandallos');

    const formWithFile = new FormData();
    formWithFile.set('nombre', 'Sopa');
    formWithFile.set('precio', '5');
    formWithFile.set('stock', '2');
    formWithFile.set('foto', new File(['abc'], 'sopa.jpg', { type: 'image/jpeg' }));
    const blocked = await createDish(formWithFile);
    expect(blocked.success).toBe(false);
    expect(blocked.error).toMatch(/deshabilitada/i);
  });

  it('valida UUID y actualiza parcialmente un plato', async () => {
    const bad = await updateDish('not-a-uuid', new FormData());
    expect(bad.success).toBe(false);
    expect(api.platosUpdatePlato).not.toHaveBeenCalled();

    api.platosUpdatePlato.mockResolvedValueOnce({
      status: 200,
      data: { ...sampleDto, precio: '9.00' },
      headers: {},
    });
    const form = new FormData();
    form.set('precio', '9');
    form.set('removeFoto', 'true');
    const res = await updateDish(DISH_ID, form);
    expect(res.success).toBe(true);
    expect(api.platosUpdatePlato).toHaveBeenCalledWith(DISH_ID, { precio: 9, foto: null });
  });

  it('elimina un plato por UUID', async () => {
    expect((await deleteDish('')).success).toBe(false);
    api.platosDeletePlato.mockResolvedValueOnce({ status: 204, data: undefined, headers: {} });
    const res = await deleteDish(DISH_ID);
    expect(res.success).toBe(true);
    expect(api.platosDeletePlato).toHaveBeenCalledWith(DISH_ID);
  });
});
