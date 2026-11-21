'use server';

import { requireKitchenAccess } from '@/shared/api'

import { ingredientDb } from '@/shared/api/ingredients';
import { revalidatePath } from 'next/cache';
import { isPurchasePrice, roundPurchasePrice } from '../model/purchase-price';
import type {
  ActionResponse,
  CreateIngredientInput,
  Ingredient,
  UnidadDeMasa,
  UpdateIngredientInput,
} from '../model/types';

const UNITS: readonly UnidadDeMasa[] = ['G', 'KG', 'ML', 'L'];

function isUnit(value: unknown): value is UnidadDeMasa {
  return typeof value === 'string' && UNITS.includes(value as UnidadDeMasa);
}

function isStock(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

/**
 * Fetch all ingredients from Appwrite TablesDB
 */
export async function getIngredients(): Promise<ActionResponse<Ingredient[]>> {
  try {
    await requireKitchenAccess()
    const rows = await ingredientDb.list();

    return {
      success: true,
      data: rows,
    };
  } catch (error: unknown) {
    console.error('Error fetching ingredients:', error);
    return {
      success: false,
      error: 'No se pudo cargar el inventario.',
    };
  }
}

export async function createIngredient(
  input: CreateIngredientInput,
): Promise<ActionResponse<Ingredient>> {
  try {
    await requireKitchenAccess()
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

    const payload = {
      nombre,
      descripcion: input.descripcion?.trim() || null,
      stock,
      unidad_de_masa: input.unidad_de_masa,
      precio_compra: input.precio_compra == null ? null : roundPurchasePrice(input.precio_compra),
    };

    const ingredient = await ingredientDb.create(payload);

    revalidatePath('/ingredientes');
    return { success: true, data: ingredient };
  } catch (error: unknown) {
    console.error('Error creating ingredient:', error);
    return {
      success: false,
      error: 'No se pudo crear el ingrediente.',
    };
  }
}

export async function updateIngredient(
  id: string,
  input: UpdateIngredientInput,
): Promise<ActionResponse<Ingredient>> {
  try {
    await requireKitchenAccess()
    if (!id) {
      return { success: false, error: 'ID de ingrediente no proporcionado.' };
    }

    const updateData: UpdateIngredientInput = {};

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

    const ingredient = await ingredientDb.update(id, updateData);

    revalidatePath('/ingredientes');
    return { success: true, data: ingredient };
  } catch (error: unknown) {
    console.error('Error updating ingredient:', error);
    return {
      success: false,
      error: 'No se pudo actualizar el ingrediente.',
    };
  }
}

/**
 * Delete an ingredient
 */
export async function deleteIngredient(id: string): Promise<ActionResponse<boolean>> {
  try {
    await requireKitchenAccess()
    if (!id) {
      return { success: false, error: 'ID de ingrediente no proporcionado.' };
    }

    await ingredientDb.delete(id);

    revalidatePath('/ingredientes');
    return { success: true, data: true };
  } catch (error: unknown) {
    console.error('Error deleting ingredient:', error);
    return {
      success: false,
      error: 'No se pudo eliminar el ingrediente.',
    };
  }
}
