import { beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({
  recetasGetRecetas: vi.fn(),
  recetasSyncPlatoReceta: vi.fn(),
}));
const revalidatePath = vi.hoisted(() => vi.fn());

vi.mock('next/cache', () => ({ revalidatePath }));
vi.mock('@/shared/api', () => ({
  requireKitchenAccess: vi.fn().mockResolvedValue(undefined),
  UnidadDeMasa: { G: 'G', KG: 'KG', ML: 'ML', L: 'L' },
  ...api,
}));

import { getRecipeItems, setDishRecipe } from './recipe.actions';

const RECETA_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const PLATO_ID = '11111111-1111-4111-8111-111111111111';
const ING_ID = '22222222-2222-4222-8222-222222222222';

const sampleRecetaDto = {
  id: RECETA_ID,
  plato_id: PLATO_ID,
  ingrediente_id: ING_ID,
  cantidad: '200.0000',
  unidad: 'G' as const,
  merma_ingrediente_receta: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  plato: { id: PLATO_ID, nombre: 'Tortilla', precio: '6.50', foto: null, stock: 10 },
  ingrediente: {
    id: ING_ID,
    nombre: 'Huevo',
    descripcion: null,
    stock: '1.0000',
    unidad_de_masa: 'KG' as const,
    precio_compra: '3.0000',
    merma_habitual: '0.00',
  },
};

describe('recipe.actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lista recetas y mapea relaciones desde FastAPI', async () => {
    api.recetasGetRecetas.mockResolvedValueOnce({
      status: 200,
      data: [sampleRecetaDto],
      headers: {},
    });

    const res = await getRecipeItems();
    expect(res.success).toBe(true);
    expect(res.data).toHaveLength(1);
    expect(res.data![0].plato?.nombre).toBe('Tortilla');
    expect(res.data![0].ingrediente?.nombre).toBe('Huevo');
  });

  it('sincroniza la receta completa de un plato y propaga detail en error', async () => {
    expect((await setDishRecipe('', [])).success).toBe(false);

    api.recetasSyncPlatoReceta.mockResolvedValueOnce({
      status: 200,
      data: { plato: sampleRecetaDto.plato, lineas: [sampleRecetaDto], version: 'v2' },
      headers: {},
    });
    const res = await setDishRecipe(PLATO_ID, [
      { ingrediente_id: ING_ID, cantidad: 200, unidad: 'G', merma_ingrediente_receta: null },
    ]);
    expect(res.success).toBe(true);
    expect(revalidatePath).toHaveBeenCalledWith('/platos');

    api.recetasSyncPlatoReceta.mockResolvedValueOnce({
      status: 422,
      data: { detail: 'La unidad de la receta debe ser compatible con la unidad de compra.' },
      headers: {},
    });
    const errRes = await setDishRecipe(PLATO_ID, [
      { ingrediente_id: ING_ID, cantidad: 200, unidad: 'ML', merma_ingrediente_receta: null },
    ]);
    expect(errRes).toEqual({
      success: false,
      error: 'La unidad de la receta debe ser compatible con la unidad de compra.',
    });
  });
});
