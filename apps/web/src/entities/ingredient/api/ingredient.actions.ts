'use server';

import {
  ingredientesCreateIngrediente,
  ingredientesDeleteIngrediente,
  ingredientesGetIngredientes,
  ingredientesUpdateIngrediente,
  requireKitchenAccess,
  UnidadDeMasa,
  type IngredienteCreate,
  type IngredienteResponse,
  type IngredienteUpdate,
} from '@/shared/api';
import { isValidUuid } from '@/shared/lib';
import { revalidatePath } from 'next/cache';
import { isPurchasePrice, roundPurchasePrice } from '../model/purchase-price';
import type {
  ActionResponse,
  CreateIngredientInput,
  Ingredient,
  UpdateIngredientInput,
} from '../model/types';

const UNITS: readonly UnidadDeMasa[] = [
  UnidadDeMasa.G,
  UnidadDeMasa.KG,
  UnidadDeMasa.ML,
  UnidadDeMasa.L,
];

class ValidationError extends Error {}

function isUnit(value: unknown): value is UnidadDeMasa {
  return typeof value === 'string' && UNITS.includes(value as UnidadDeMasa);
}

function isStock(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function isWastage(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value < 100;
}

function roundWastage(value: number): number {
  return Number(value.toFixed(2));
}

function parseIngredientId(id: string): string {
  const cleanId = id?.trim() ?? '';
  if (!cleanId) {
    throw new ValidationError('ID de ingrediente no proporcionado.');
  }
  if (!isValidUuid(cleanId)) {
    throw new ValidationError('ID de ingrediente no válido.');
  }
  return cleanId;
}

function toIngredient(dto: IngredienteResponse): Ingredient {
  return {
    $id: dto.id,
    $createdAt: dto.created_at ?? '',
    $updatedAt: dto.updated_at ?? '',
    nombre: dto.nombre,
    descripcion: dto.descripcion ?? null,
    stock: Number(dto.stock),
    unidad_de_masa: dto.unidad_de_masa,
    precio_compra: dto.precio_compra == null ? null : Number(dto.precio_compra),
    merma_habitual: dto.merma_habitual == null ? null : Number(dto.merma_habitual),
  };
}

function toErrorResponse(error: unknown, fallback: string): { success: false; error: string } {
  if (error instanceof ValidationError) {
    return { success: false, error: error.message };
  }
  console.error(fallback, error);
  return { success: false, error: fallback };
}

export async function getIngredients(): Promise<ActionResponse<Ingredient[]>> {
  try {
    await requireKitchenAccess();
    const response = await ingredientesGetIngredientes();
    if (response.status !== 200) {
      return { success: false, error: 'No se pudo cargar el inventario.' };
    }

    return {
      success: true,
      data: response.data.map(toIngredient),
    };
  } catch (error: unknown) {
    return toErrorResponse(error, 'No se pudo cargar el inventario.');
  }
}

 export async function createIngredient(
  input: CreateIngredientInput,
): Promise<ActionResponse<Ingredient>> {
  try {
    await requireKitchenAccess();
    const nombre = input.nombre?.trim();
    if (!nombre) {
      return { success: false, error: 'El nombre del ingrediente es obligatorio.' };
    }

    const stock = input.stock;
    if (!isStock(stock)) {
      return { success: false, error: 'El stock debe ser un número igual o mayor a 0.' };
    }

    if (!isUnit(input.unidad_de_masa)) {
      return { success: false, error: 'La unidad de medida no es válida.' };
    }

    if (input.precio_compra != null && !isPurchasePrice(input.precio_compra)) {
      return { success: false, error: 'El precio de compra debe ser un número igual o mayor a 0.' };
    }

    if (input.merma_habitual != null && !isWastage(input.merma_habitual)) {
      return { success: false, error: 'La merma debe estar entre 0 % y 99,99 %.' };
    }

    const payload: IngredienteCreate = {
      nombre,
      descripcion: input.descripcion?.trim() || null,
      stock,
      unidad_de_masa: input.unidad_de_masa,
      precio_compra: input.precio_compra == null ? null : roundPurchasePrice(input.precio_compra),
      ...(input.merma_habitual !== undefined
        ? {
            merma_habitual:
              input.merma_habitual === null ? null : roundWastage(input.merma_habitual),
          }
        : {}),
    };

    const response = await ingredientesCreateIngrediente(payload);
    if (response.status !== 201) {
      return { success: false, error: 'No se pudo crear el ingrediente.' };
    }

    revalidatePath('/ingredientes');
    return { success: true, data: toIngredient(response.data) };
  } catch (error: unknown) {
    return toErrorResponse(error, 'No se pudo crear el ingrediente.');
  }
}

export async function updateIngredient(
  id: string,
  input: UpdateIngredientInput,
): Promise<ActionResponse<Ingredient>> {
  try {
    await requireKitchenAccess();
    const validId = parseIngredientId(id);

    const updateData: IngredienteUpdate = {};

    if (input.nombre !== undefined) {
      const nombre = input.nombre.trim();
      if (!nombre) {
        return { success: false, error: 'El nombre no puede estar vacío.' };
      }
      updateData.nombre = nombre;
    }

    if (input.descripcion !== undefined) {
      updateData.descripcion = input.descripcion?.trim() || null;
    }

    if (input.stock !== undefined) {
      const stock = input.stock;
      if (!isStock(stock)) {
        return { success: false, error: 'El stock debe ser un número válido >= 0.' };
      }
      updateData.stock = stock;
    }

    if (input.unidad_de_masa !== undefined) {
      if (!isUnit(input.unidad_de_masa)) {
        return { success: false, error: 'La unidad de medida no es válida.' };
      }
      updateData.unidad_de_masa = input.unidad_de_masa;
    }

    if (input.precio_compra !== undefined) {
      if (input.precio_compra !== null && !isPurchasePrice(input.precio_compra)) {
        return {
          success: false,
          error: 'El precio de compra debe ser un número igual o mayor a 0.',
        };
      }
      updateData.precio_compra =
        input.precio_compra === null ? null : roundPurchasePrice(input.precio_compra);
    }

    if (input.merma_habitual !== undefined) {
      if (input.merma_habitual !== null && !isWastage(input.merma_habitual)) {
        return { success: false, error: 'La merma debe estar entre 0 % y 99,99 %.' };
      }
      updateData.merma_habitual =
        input.merma_habitual === null ? null : roundWastage(input.merma_habitual);
    }

    const response = await ingredientesUpdateIngrediente(validId, updateData);
    if (response.status !== 200) {
      return { success: false, error: 'No se pudo actualizar el ingrediente.' };
    }

    revalidatePath('/ingredientes');
    return { success: true, data: toIngredient(response.data) };
  } catch (error: unknown) {
    return toErrorResponse(error, 'No se pudo actualizar el ingrediente.');
  }
}

export async function deleteIngredient(id: string): Promise<ActionResponse<boolean>> {
  try {
    await requireKitchenAccess();
    const validId = parseIngredientId(id);

    const response = await ingredientesDeleteIngrediente(validId);
    if (response.status === 409) {
      return {
        success: false,
        error: 'No se puede eliminar el ingrediente porque está asociado a una o más recetas.',
      };
    }
    if (response.status !== 204) {
      return { success: false, error: 'No se pudo eliminar el ingrediente.' };
    }

    revalidatePath('/ingredientes');
    return { success: true, data: true };
  } catch (error: unknown) {
    return toErrorResponse(error, 'No se pudo eliminar el ingrediente.');
  }
}
