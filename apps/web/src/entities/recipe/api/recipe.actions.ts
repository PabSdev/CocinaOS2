'use server';

import {
  recetasGetRecetas,
  recetasSyncPlatoReceta,
  requireKitchenAccess,
  UnidadDeMasa,
  type RecetaLineaSync,
  type RecetaResponse,
} from '@/shared/api';
import { isValidUuid } from '@/shared/lib';
import { revalidatePath } from 'next/cache';
import { round2, round4 } from '../model/escandallo-operations';
import type {
  ActionResponse,
  DishRecipeIngredientInput,
  RecipeItem,
  RecipeUnit,
} from '../model/types';

const VALID_UNITS: readonly RecipeUnit[] = [
  UnidadDeMasa.G,
  UnidadDeMasa.KG,
  UnidadDeMasa.ML,
  UnidadDeMasa.L,
];

function isValidUnit(value: unknown): value is RecipeUnit {
  return typeof value === 'string' && VALID_UNITS.includes(value as RecipeUnit);
}

function isValidWastage(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value < 100;
}

function extractApiDetail(data: unknown): string | null {
  if (typeof data === 'object' && data !== null && 'detail' in data) {
    const detail = (data as { detail?: unknown }).detail;
    if (typeof detail === 'string' && detail.trim()) return detail.trim();
  }
  return null;
}

function toRecipeItem(dto: RecetaResponse): RecipeItem {
  return {
    $id: dto.id,
    $createdAt: dto.created_at ?? '',
    $updatedAt: dto.updated_at ?? '',
    plato_id: dto.plato_id,
    ingrediente_id: dto.ingrediente_id,
    cantidad: Number(dto.cantidad),
    unidad: dto.unidad,
    merma_ingrediente_receta:
      dto.merma_ingrediente_receta == null ? null : Number(dto.merma_ingrediente_receta),
    plato: dto.plato
      ? {
          $id: dto.plato.id,
          nombre: dto.plato.nombre,
          precio: dto.plato.precio == null ? null : String(dto.plato.precio),
          foto: dto.plato.foto ?? null,
          stock: Number(dto.plato.stock ?? 0),
        }
      : undefined,
    ingrediente: dto.ingrediente
      ? {
          $id: dto.ingrediente.id,
          nombre: dto.ingrediente.nombre,
          descripcion: dto.ingrediente.descripcion ?? null,
          stock: Number(dto.ingrediente.stock ?? 0),
          unidad_de_masa: dto.ingrediente.unidad_de_masa,
          precio_compra:
            dto.ingrediente.precio_compra == null ? null : Number(dto.ingrediente.precio_compra),
          merma_habitual:
            dto.ingrediente.merma_habitual == null ? null : Number(dto.ingrediente.merma_habitual),
        }
      : undefined,
  };
}

export async function getRecipeItems(): Promise<ActionResponse<RecipeItem[]>> {
  try {
    await requireKitchenAccess();
    const response = await recetasGetRecetas();
    if (response.status !== 200) {
      return { success: false, error: 'No se pudieron cargar las recetas.' };
    }
    return { success: true, data: response.data.map(toRecipeItem) };
  } catch (error: unknown) {
    console.error('No se pudieron cargar las recetas.', error);
    return { success: false, error: 'No se pudieron cargar las recetas.' };
  }
}

export async function setDishRecipe(
  dishId: string,
  ingredients: DishRecipeIngredientInput[],
): Promise<ActionResponse<RecipeItem[]>> {
  try {
    await requireKitchenAccess();
    const validDishId = dishId?.trim() ?? '';
    if (!validDishId) {
      return { success: false, error: 'ID de plato no proporcionado.' };
    }
    if (!isValidUuid(validDishId)) {
      return { success: false, error: 'ID de plato no válido.' };
    }

    const lineas: RecetaLineaSync[] = [];
    for (const item of ingredients) {
      if (!isValidUuid(item.ingrediente_id)) {
        return { success: false, error: 'ID de ingrediente inválido.' };
      }
      const cantidad = Number(item.cantidad);
      if (!Number.isFinite(cantidad) || cantidad <= 0) {
        return { success: false, error: 'Todas las cantidades útiles deben ser mayores a 0.' };
      }
      if (!isValidUnit(item.unidad)) {
        return { success: false, error: 'Unidad de medida no válida en la receta.' };
      }
      if (item.merma_ingrediente_receta != null && !isValidWastage(item.merma_ingrediente_receta)) {
        return { success: false, error: 'El porcentaje de merma debe estar entre 0 % y 99,99 %.' };
      }
      lineas.push({
        ingrediente_id: item.ingrediente_id.trim(),
        cantidad: round4(cantidad),
        unidad: item.unidad,
        merma_ingrediente_receta:
          item.merma_ingrediente_receta == null ? null : round2(item.merma_ingrediente_receta),
      });
    }

    const response = await recetasSyncPlatoReceta(validDishId, { lineas });
    if (response.status !== 200) {
      return {
        success: false,
        error:
          extractApiDetail(response.data) ??
          'No se pudo sincronizar la receta completa del plato.',
      };
    }

    revalidatePath('/platos');
    revalidatePath('/escandallos');
    return { success: true, data: response.data.lineas.map(toRecipeItem) };
  } catch (error: unknown) {
    console.error('No se pudo sincronizar la receta completa del plato.', error);
    return { success: false, error: 'No se pudo sincronizar la receta completa del plato.' };
  }
}
