import { beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({
  platosGetPlatos: vi.fn(),
  recetasGetEscandallo: vi.fn(),
  recetasSyncPlatoReceta: vi.fn(),
}));
const revalidatePath = vi.hoisted(() => vi.fn());

vi.mock('next/cache', () => ({ revalidatePath }));
vi.mock('@/shared/api', () => ({
  requireKitchenAccess: vi.fn().mockResolvedValue(undefined),
  ...api,
}));

import { getRecipeSheet, getRecipeSheetDishes, saveRecipeSheet } from './recipe-sheet.actions';

const DISH_ID = '11111111-1111-4111-8111-111111111111';
const LINE_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const FLOUR_ID = '22222222-2222-4222-8222-222222222222';

const platoDto = {
  id: DISH_ID,
  nombre: 'Sopa',
  precio: '5.00',
  stock: 8,
  foto: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

const lineDto = {
  id: LINE_ID,
  plato_id: DISH_ID,
  ingrediente_id: FLOUR_ID,
  cantidad: '100.0000',
  unidad: 'G' as const,
  merma_ingrediente_receta: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

const input = {
  dishId: DISH_ID,
  price: '6,50',
  version: 'v1',
  lines: [{ id: LINE_ID, ingrediente_id: FLOUR_ID, cantidad: 150, unidad: 'G' as const }],
};

describe('recipe-sheet.actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.platosGetPlatos.mockResolvedValue({ status: 200, data: [platoDto], headers: {} });
    api.recetasGetEscandallo.mockResolvedValue({
      status: 200,
      data: { plato: platoDto, lineas: [lineDto], version: 'v1' },
      headers: {},
    });
    api.recetasSyncPlatoReceta.mockResolvedValue({
      status: 200,
      data: { plato: { ...platoDto, precio: '6.50' }, lineas: [lineDto], version: 'v2' },
      headers: {},
    });
  });

  it('lista platos y carga el escandallo desde FastAPI', async () => {
    const dishes = await getRecipeSheetDishes();
    expect(dishes[0].nombre).toBe('Sopa');

    const sheet = await getRecipeSheet(DISH_ID);
    expect(sheet.dish.precio).toBe('5.00');
    expect(sheet.lines).toHaveLength(1);
    expect(sheet.version).toBe('v1');
  });

  it('guarda escandallo, revalida rutas y propaga conflictos y errores del backend', async () => {
    expect(await saveRecipeSheet(input)).toEqual({});
    expect(revalidatePath).toHaveBeenCalledWith('/escandallos');
    expect(revalidatePath).toHaveBeenCalledWith('/platos');

    api.recetasSyncPlatoReceta.mockResolvedValueOnce({
      status: 409,
      data: { detail: 'El plato o la receta han cambiado.' },
      headers: {},
    });
    expect(await saveRecipeSheet(input)).toEqual({ error: 'El plato o la receta han cambiado.' });

    api.recetasSyncPlatoReceta.mockResolvedValueOnce({
      status: 422,
      data: { detail: 'Unidad incompatible' },
      headers: {},
    });
    expect(await saveRecipeSheet(input)).toEqual({ error: 'Unidad incompatible' });
  });

  it.each(['-1', 'abc', 'Infinity'])('rechaza PVP inválido %s antes de llamar a la API', async (price) => {
    expect(await saveRecipeSheet({ ...input, price })).toHaveProperty('error');
    expect(api.recetasSyncPlatoReceta).not.toHaveBeenCalled();
  });
});
