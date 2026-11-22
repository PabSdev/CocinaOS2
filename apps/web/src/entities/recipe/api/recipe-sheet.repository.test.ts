import { beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({
  platosGetPlatos: vi.fn(),
  recetasGetEscandallo: vi.fn(),
  recetasSyncPlatoReceta: vi.fn(),
}));
vi.mock('server-only', () => ({}));
vi.mock('@/shared/api', () => api);

import { recipeSheetDb } from './recipe-sheet.repository';

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

describe('guardado del escandallo', () => {
  beforeEach(() => {
    vi.resetAllMocks();
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

  it('lee los platos y la ficha de escandallo desde FastAPI', async () => {
    const sheet = await recipeSheetDb.get(DISH_ID);
    expect(sheet.dish.precio).toBe('5.00');
    expect(sheet.lines).toHaveLength(1);
    expect(sheet.version).toBe('v1');

    const dishes = await recipeSheetDb.listDishes();
    expect(dishes[0].nombre).toBe('Sopa');
  });

  it.each(['-1', 'abc', 'Infinity'])('rechaza PVP inválido %s antes de llamar a la API', async (price) => {
    expect(await recipeSheetDb.save({ ...input, price })).toHaveProperty('error');
    expect(api.recetasSyncPlatoReceta).not.toHaveBeenCalled();
  });

  it('guarda precio y líneas de forma atómica con control de versión', async () => {
    expect(await recipeSheetDb.save(input)).toEqual({});
    expect(api.recetasSyncPlatoReceta).toHaveBeenCalledWith(DISH_ID, {
      precio: 6.5,
      expected_version: 'v1',
      lineas: [
        {
          id: LINE_ID,
          ingrediente_id: FLOUR_ID,
          cantidad: 150,
          unidad: 'G',
          merma_ingrediente_receta: null,
        },
      ],
    });
  });

  it.each([undefined, null, '', '   '])('guarda PVP cero si el precio es %s', async (price) => {
    expect(await recipeSheetDb.save({ ...input, price })).toEqual({});
    expect(api.recetasSyncPlatoReceta).toHaveBeenCalledWith(
      DISH_ID,
      expect.objectContaining({ precio: 0 }),
    );
  });

  it('devuelve error de conflicto cuando la API responde 409', async () => {
    api.recetasSyncPlatoReceta.mockResolvedValueOnce({ status: 409, data: undefined, headers: {} });
    const res = await recipeSheetDb.save(input);
    expect(res.error).toMatch(/han cambiado/i);
  });

  it('devuelve error de compatibilidad cuando la API responde 422', async () => {
    api.recetasSyncPlatoReceta.mockResolvedValueOnce({ status: 422, data: undefined, headers: {} });
    const res = await recipeSheetDb.save(input);
    expect(res.error).toMatch(/compatible/i);
  });
});
