'use server';

import {
  recetasCreateReceta,
  recetasDeleteReceta,
  recetasGetEscandallo,
  recetasGetRecetaById,
  recetasGetRecetas,
  recetasSyncPlatoReceta,
  recetasUpdateReceta,
  requireKitchenAccess,
  UnidadDeMasa,
  type RecetaCreate,
  type RecetaLineaSync,
  type RecetaResponse,
  type RecetaUpdate,
} from '@/shared/api';
import { revalidatePath } from 'next/cache';
import {
  calculateGrossQuantity,
  normalizeRecipeQuantity,
  resolveEffectiveWastage,
  round2,
  round4,
} from '../model/escandallo-operations';
import type {
  ActionResponse,
  CreateRecipeItemInput,
  DishRecipeIngredientInput,
  DishStockFeasibility,
  RecipeItem,
  RecipeUnit,
  UpdateRecipeItemInput,
} from '../model/types';

const VALID_UNITS: readonly RecipeUnit[] = [
  UnidadDeMasa.G,
  UnidadDeMasa.KG,
  UnidadDeMasa.ML,
  UnidadDeMasa.L,
];
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

class ValidationError extends Error {}

function isValidUnit(value: unknown): value is RecipeUnit {
  return typeof value === 'string' && VALID_UNITS.includes(value as RecipeUnit);
}

function isValidWastage(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value < 100;
}

function parseUuid(value: string, emptyMessage: string, invalidMessage: string): string {
  const clean = value?.trim() ?? '';
  if (!clean) {
    throw new ValidationError(emptyMessage);
  }
  if (!UUID_REGEX.test(clean)) {
    throw new ValidationError(invalidMessage);
  }
  return clean;
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

function toErrorResponse(error: unknown, fallback: string): { success: false; error: string } {
  if (error instanceof ValidationError) {
    return { success: false, error: error.message };
  }
  console.error(fallback, error);
  return { success: false, error: fallback };
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
    return toErrorResponse(error, 'No se pudieron cargar las recetas.');
  }
}

export async function getRecipeByDish(dishId: string): Promise<ActionResponse<RecipeItem[]>> {
  try {
    await requireKitchenAccess();
    const validDishId = parseUuid(
      dishId,
      'ID de plato no proporcionado.',
      'ID de plato no válido.',
    );

    const response = await recetasGetRecetas({ plato_id: validDishId });
    if (response.status !== 200) {
      return { success: false, error: 'No se pudo cargar la receta del plato.' };
    }

    return { success: true, data: response.data.map(toRecipeItem) };
  } catch (error: unknown) {
    return toErrorResponse(error, 'No se pudo cargar la receta del plato.');
  }
}

export async function getDishesByIngredient(
  ingredientId: string,
): Promise<ActionResponse<RecipeItem[]>> {
  try {
    await requireKitchenAccess();
    const validIngredientId = parseUuid(
      ingredientId,
      'ID de ingrediente no proporcionado.',
      'ID de ingrediente no válido.',
    );

    const response = await recetasGetRecetas({ ingrediente_id: validIngredientId });
    if (response.status !== 200) {
      return {
        success: false,
        error: 'No se pudieron consultar los platos asociados al ingrediente.',
      };
    }

    return { success: true, data: response.data.map(toRecipeItem) };
  } catch (error: unknown) {
    return toErrorResponse(
      error,
      'No se pudieron consultar los platos asociados al ingrediente.',
    );
  }
}

export async function getRecipeItemById(id: string): Promise<ActionResponse<RecipeItem>> {
  try {
    await requireKitchenAccess();
    const validId = parseUuid(
      id,
      'ID de elemento de receta no proporcionado.',
      'ID de elemento de receta no válido.',
    );

    const response = await recetasGetRecetaById(validId);
    if (response.status !== 200) {
      return { success: false, error: 'No se encontró el elemento de receta.' };
    }

    return { success: true, data: toRecipeItem(response.data) };
  } catch (error: unknown) {
    return toErrorResponse(error, 'No se encontró el elemento de receta.');
  }
}

export async function createRecipeItem(
  input: CreateRecipeItemInput,
): Promise<ActionResponse<RecipeItem>> {
  try {
    await requireKitchenAccess();
    const platoId = parseUuid(
      input.plato_id,
      'El ID del plato es obligatorio.',
      'ID de plato no válido.',
    );
    const ingredienteId = parseUuid(
      input.ingrediente_id,
      'El ID del ingrediente es obligatorio.',
      'ID de ingrediente no válido.',
    );

    const cantidad = Number(input.cantidad);
    if (!Number.isFinite(cantidad) || cantidad <= 0) {
      return { success: false, error: 'La cantidad debe ser un número mayor a 0.' };
    }

    if (!isValidUnit(input.unidad)) {
      return {
        success: false,
        error: 'La unidad de medida seleccionada no es válida (G, KG, ML, L).',
      };
    }

    if (input.merma_ingrediente_receta != null && !isValidWastage(input.merma_ingrediente_receta)) {
      return { success: false, error: 'La merma debe estar entre 0 % y 99,99 %.' };
    }

    const payload: RecetaCreate = {
      plato_id: platoId,
      ingrediente_id: ingredienteId,
      cantidad: round4(cantidad),
      unidad: input.unidad,
      merma_ingrediente_receta:
        input.merma_ingrediente_receta == null ? null : round2(input.merma_ingrediente_receta),
    };

    const response = await recetasCreateReceta(payload);
    if (response.status !== 201) {
      return { success: false, error: 'No se pudo añadir el ingrediente a la receta.' };
    }

    revalidatePath('/platos');
    revalidatePath('/escandallos');
    return { success: true, data: toRecipeItem(response.data) };
  } catch (error: unknown) {
    return toErrorResponse(error, 'No se pudo añadir el ingrediente a la receta.');
  }
}

export async function updateRecipeItem(
  id: string,
  input: UpdateRecipeItemInput,
): Promise<ActionResponse<RecipeItem>> {
  try {
    await requireKitchenAccess();
    const validId = parseUuid(
      id,
      'ID de elemento de receta no proporcionado.',
      'ID de elemento de receta no válido.',
    );

    const updateData: RecetaUpdate = {};

    if (input.cantidad !== undefined) {
      const cantidad = Number(input.cantidad);
      if (!Number.isFinite(cantidad) || cantidad <= 0) {
        return { success: false, error: 'La cantidad debe ser un número mayor a 0.' };
      }
      updateData.cantidad = round4(cantidad);
    }

    if (input.unidad !== undefined) {
      if (!isValidUnit(input.unidad)) {
        return { success: false, error: 'Unidad de medida no válida.' };
      }
      updateData.unidad = input.unidad;
    }

    if (input.ingrediente_id !== undefined) {
      updateData.ingrediente_id = parseUuid(
        input.ingrediente_id,
        'ID de ingrediente inválido.',
        'ID de ingrediente inválido.',
      );
    }

    if (input.merma_ingrediente_receta !== undefined) {
      if (
        input.merma_ingrediente_receta !== null &&
        !isValidWastage(input.merma_ingrediente_receta)
      ) {
        return { success: false, error: 'La merma debe estar entre 0 % y 99,99 %.' };
      }
      updateData.merma_ingrediente_receta =
        input.merma_ingrediente_receta === null ? null : round2(input.merma_ingrediente_receta);
    }

    const response = await recetasUpdateReceta(validId, updateData);
    if (response.status !== 200) {
      return { success: false, error: 'No se pudo actualizar el elemento de la receta.' };
    }

    revalidatePath('/platos');
    revalidatePath('/escandallos');
    return { success: true, data: toRecipeItem(response.data) };
  } catch (error: unknown) {
    return toErrorResponse(error, 'No se pudo actualizar el elemento de la receta.');
  }
}

export async function deleteRecipeItem(id: string): Promise<ActionResponse<boolean>> {
  try {
    await requireKitchenAccess();
    const validId = parseUuid(
      id,
      'ID de elemento de receta no proporcionado.',
      'ID de elemento de receta no válido.',
    );

    const response = await recetasDeleteReceta(validId);
    if (response.status !== 204) {
      return { success: false, error: 'No se pudo eliminar el ingrediente de la receta.' };
    }

    revalidatePath('/platos');
    revalidatePath('/escandallos');
    return { success: true, data: true };
  } catch (error: unknown) {
    return toErrorResponse(error, 'No se pudo eliminar el ingrediente de la receta.');
  }
}

export async function setDishRecipe(
  dishId: string,
  ingredients: DishRecipeIngredientInput[],
): Promise<ActionResponse<RecipeItem[]>> {
  try {
    await requireKitchenAccess();
    const validDishId = parseUuid(
      dishId,
      'ID de plato no proporcionado.',
      'ID de plato no válido.',
    );

    const lineas: RecetaLineaSync[] = [];
    for (const item of ingredients) {
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
        ingrediente_id: parseUuid(
          item.ingrediente_id,
          'ID de ingrediente inválido.',
          'ID de ingrediente inválido.',
        ),
        cantidad: round4(cantidad),
        unidad: item.unidad,
        merma_ingrediente_receta:
          item.merma_ingrediente_receta == null ? null : round2(item.merma_ingrediente_receta),
      });
    }

    const response = await recetasSyncPlatoReceta(validDishId, { lineas });
    if (response.status !== 200) {
      return { success: false, error: 'No se pudo sincronizar la receta completa del plato.' };
    }

    revalidatePath('/platos');
    revalidatePath('/escandallos');
    return { success: true, data: response.data.lineas.map(toRecipeItem) };
  } catch (error: unknown) {
    return toErrorResponse(error, 'No se pudo sincronizar la receta completa del plato.');
  }
}

export async function checkDishPortionsFeasibility(
  dishId: string,
): Promise<ActionResponse<DishStockFeasibility>> {
  try {
    await requireKitchenAccess();
    const validDishId = parseUuid(
      dishId,
      'ID de plato no proporcionado.',
      'ID de plato no válido.',
    );

    const response = await recetasGetEscandallo(validDishId);
    if (response.status !== 200) {
      return {
        success: false,
        error: 'No se pudo calcular la disponibilidad de ingredientes para este plato.',
      };
    }

    const { plato, lineas } = response.data;
    if (lineas.length === 0) {
      return {
        success: true,
        data: {
          platoId: validDishId,
          platoNombre: plato.nombre || 'Plato',
          maxPortionsPossible: 0,
          ingredientsRequirement: [],
        },
      };
    }

    let minPortions = Infinity;
    const requirements: DishStockFeasibility['ingredientsRequirement'] = [];

    for (const row of lineas) {
      const parsed = toRecipeItem(row);
      const ing = parsed.ingrediente;

      const currentStock = ing ? ing.stock : 0;
      const stockUnit = ing ? ing.unidad_de_masa : parsed.unidad;
      const ingNombre = ing ? ing.nombre : parsed.ingrediente_id;

      const wastage = resolveEffectiveWastage(
        parsed.merma_ingrediente_receta,
        ing?.merma_habitual ?? null,
      );
      const grossInRecipeUnit =
        calculateGrossQuantity(parsed.cantidad, wastage.valid ? wastage.pct : 0) ?? parsed.cantidad;

      const normalizedRequired = normalizeRecipeQuantity(grossInRecipeUnit, parsed.unidad, stockUnit);
      const effectiveRequired = normalizedRequired !== null ? normalizedRequired : grossInRecipeUnit;

      const portionsCanMake =
        effectiveRequired > 0 ? Math.floor(currentStock / effectiveRequired) : 0;

      if (portionsCanMake < minPortions) {
        minPortions = portionsCanMake;
      }

      requirements.push({
        ingredienteId: parsed.ingrediente_id,
        nombre: ingNombre,
        currentStock,
        stockUnit,
        requiredPerPortion: parsed.cantidad,
        grossRequiredPerPortion: round4(grossInRecipeUnit),
        wastagePct: wastage.valid ? round2(wastage.pct) : 0,
        recipeUnit: parsed.unidad,
        normalizedRequiredPerPortion: round4(effectiveRequired),
        portionsCanMake,
        hasSufficientStock: portionsCanMake > 0,
      });
    }

    return {
      success: true,
      data: {
        platoId: validDishId,
        platoNombre: plato.nombre || 'Plato',
        maxPortionsPossible: Number.isFinite(minPortions) ? Math.max(0, minPortions) : 0,
        ingredientsRequirement: requirements,
      },
    };
  } catch (error: unknown) {
    return toErrorResponse(
      error,
      'No se pudo calcular la disponibilidad de ingredientes para este plato.',
    );
  }
}
