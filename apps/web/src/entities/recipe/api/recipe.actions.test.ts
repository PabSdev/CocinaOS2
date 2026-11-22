import { beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({
  recetasGetRecetas: vi.fn(),
  recetasCreateReceta: vi.fn(),
  recetasGetRecetaById: vi.fn(),
  recetasUpdateReceta: vi.fn(),
  recetasDeleteReceta: vi.fn(),
  recetasSyncPlatoReceta: vi.fn(),
  recetasGetEscandallo: vi.fn(),
}));
const revalidatePath = vi.hoisted(() => vi.fn());

vi.mock('next/cache', () => ({ revalidatePath }));
vi.mock('@/shared/api', () => ({
  requireKitchenAccess: vi.fn().mockResolvedValue(undefined),
  UnidadDeMasa: { G: 'G', KG: 'KG', ML: 'ML', L: 'L' },
  ...api,
}));

import {
  checkDishPortionsFeasibility,
  createRecipeItem,
  deleteRecipeItem,
  getDishesByIngredient,
  getRecipeByDish,
  getRecipeItemById,
  getRecipeItems,
  setDishRecipe,
  updateRecipeItem,
} from './recipe.actions';

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
    expect(res.data![0].plato_id).toBe(PLATO_ID);
    expect(res.data![0].plato?.nombre).toBe('Tortilla');
    expect(res.data![0].ingrediente?.nombre).toBe('Huevo');
  });

  it('valida UUID en consultas por plato, ingrediente e id', async () => {
    expect((await getRecipeByDish('')).success).toBe(false);
    expect((await getDishesByIngredient('')).success).toBe(false);
    expect((await getRecipeItemById('')).success).toBe(false);
    expect(api.recetasGetRecetas).not.toHaveBeenCalled();

    api.recetasGetRecetas.mockResolvedValueOnce({ status: 200, data: [sampleRecetaDto], headers: {} });
    expect((await getRecipeByDish(PLATO_ID)).success).toBe(true);
    expect(api.recetasGetRecetas).toHaveBeenCalledWith({ plato_id: PLATO_ID });

    api.recetasGetRecetaById.mockResolvedValueOnce({ status: 200, data: sampleRecetaDto, headers: {} });
    expect((await getRecipeItemById(RECETA_ID)).success).toBe(true);
  });

  it('crea, actualiza y elimina líneas de receta validando entradas', async () => {
    expect(
      (await createRecipeItem({ plato_id: '', ingrediente_id: ING_ID, cantidad: 10, unidad: 'G' })).success,
    ).toBe(false);
    expect(
      (await createRecipeItem({ plato_id: PLATO_ID, ingrediente_id: ING_ID, cantidad: 0, unidad: 'G' })).success,
    ).toBe(false);

    api.recetasCreateReceta.mockResolvedValueOnce({ status: 201, data: sampleRecetaDto, headers: {} });
    const created = await createRecipeItem({
      plato_id: PLATO_ID,
      ingrediente_id: ING_ID,
      cantidad: 200,
      unidad: 'G',
    });
    expect(created.success).toBe(true);
    expect(revalidatePath).toHaveBeenCalledWith('/platos');

    api.recetasUpdateReceta.mockResolvedValueOnce({
      status: 200,
      data: { ...sampleRecetaDto, cantidad: '250.0000' },
      headers: {},
    });
    const updated = await updateRecipeItem(RECETA_ID, { cantidad: 250 });
    expect(updated.success).toBe(true);
    expect(updated.data?.cantidad).toBe(250);

    api.recetasDeleteReceta.mockResolvedValueOnce({ status: 204, data: undefined, headers: {} });
    expect((await deleteRecipeItem(RECETA_ID)).success).toBe(true);
  });

  it('sincroniza la receta completa de un plato de forma atómica', async () => {
    api.recetasSyncPlatoReceta.mockResolvedValueOnce({
      status: 200,
      data: { plato: sampleRecetaDto.plato, lineas: [sampleRecetaDto], version: 'v2' },
      headers: {},
    });
    const res = await setDishRecipe(PLATO_ID, [
      { ingrediente_id: ING_ID, cantidad: 200, unidad: 'G', merma_ingrediente_receta: null },
    ]);
    expect(res.success).toBe(true);
    expect(res.data).toHaveLength(1);
    expect(api.recetasSyncPlatoReceta).toHaveBeenCalledWith(PLATO_ID, {
      lineas: [{ ingrediente_id: ING_ID, cantidad: 200, unidad: 'G', merma_ingrediente_receta: null }],
    });
  });

  it('calcula la disponibilidad de raciones desde el escandallo', async () => {
    api.recetasGetEscandallo.mockResolvedValueOnce({
      status: 200,
      data: { plato: sampleRecetaDto.plato, lineas: [sampleRecetaDto], version: 'v1' },
      headers: {},
    });
    const res = await checkDishPortionsFeasibility(PLATO_ID);
    expect(res.success).toBe(true);
    expect(res.data?.maxPortionsPossible).toBe(5);
    expect(res.data?.platoNombre).toBe('Tortilla');
  });
});
