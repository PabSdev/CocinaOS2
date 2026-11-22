'use server';

import {
  platosGetPlatos,
  recetasGetEscandallo,
  recetasSyncPlatoReceta,
  requireKitchenAccess,
  type PlatoResponse,
  type RecetaLineaSync,
  type RecetaResponse,
} from '@/shared/api';
import { isValidUuid } from '@/shared/lib';
import { revalidatePath } from 'next/cache';
import { parseDishPrice, round2, round4 } from '../model/escandallo-operations';
import type { RecipeSheet, RecipeSheetDish, SaveRecipeSheetInput } from '../model/recipe-sheet';
import type { RecipeItem } from '../model/types';

const CONFLICT_MESSAGE =
  'El plato o la receta han cambiado. Recarga la página antes de volver a guardar.';

function extractApiDetail(data: unknown): string | null {
  if (typeof data === 'object' && data !== null && 'detail' in data) {
    const detail = (data as { detail?: unknown }).detail;
    if (typeof detail === 'string' && detail.trim()) return detail.trim();
  }
  return null;
}

function toSheetDish(dto: PlatoResponse): RecipeSheetDish {
  return {
    $id: dto.id,
    $createdAt: dto.created_at ?? '',
    $updatedAt: dto.updated_at ?? '',
    nombre: dto.nombre,
    precio: dto.precio == null ? null : String(dto.precio),
    foto: dto.foto ?? null,
    stock: Number(dto.stock ?? 0),
  };
}

function toSheetLine(dto: RecetaResponse): RecipeItem {
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
  };
}

export async function getRecipeSheetDishes(): Promise<RecipeSheetDish[]> {
  await requireKitchenAccess();
  const response = await platosGetPlatos();
  if (response.status !== 200) {
    throw new Error('No se pudieron cargar los platos.');
  }
  return response.data
    .map(toSheetDish)
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

export async function getRecipeSheet(dishId: string): Promise<RecipeSheet> {
  await requireKitchenAccess();
  if (!isValidUuid(dishId)) {
    throw new Error('ID de plato no válido.');
  }
  const response = await recetasGetEscandallo(dishId);
  if (response.status !== 200) {
    throw new Error('No se pudo cargar el escandallo del plato.');
  }
  return {
    dish: toSheetDish(response.data.plato),
    lines: response.data.lineas.map(toSheetLine),
    version: response.data.version,
  };
}

export async function saveRecipeSheet(input: SaveRecipeSheetInput): Promise<{ error?: string }> {
  try {
    await requireKitchenAccess();

    const normalizedPrice = (typeof input?.price === 'string' ? input.price.trim() : '') || '0';
    const price = parseDishPrice(normalizedPrice);
    if (
      !isValidUuid(input?.dishId) ||
      typeof input.version !== 'string' ||
      !Array.isArray(input.lines) ||
      price === null
    ) {
      return { error: 'Introduce un PVP válido, igual o mayor que cero.' };
    }

    const ingredientIds = new Set<string>();
    const lineas: RecetaLineaSync[] = [];

    for (const line of input.lines) {
      if (!isValidUuid(line?.ingrediente_id) || ingredientIds.has(line.ingrediente_id)) {
        return { error: 'Selecciona un ingrediente existente y distinto en cada línea.' };
      }
      ingredientIds.add(line.ingrediente_id);

      if (line.id !== undefined && !isValidUuid(line.id)) {
        return { error: CONFLICT_MESSAGE };
      }

      if (
        !Number.isFinite(line.cantidad) ||
        !Number.isFinite(round4(line.cantidad)) ||
        round4(line.cantidad) <= 0
      ) {
        return {
          error: 'Introduce una cantidad útil mayor que cero, con hasta cuatro decimales.',
        };
      }

      const loss = line.merma_ingrediente_receta;
      if (loss != null && (!Number.isFinite(loss) || loss < 0 || round2(loss) >= 100)) {
        return { error: 'La merma debe estar entre 0 % y 99,99 %.' };
      }

      lineas.push({
        ...(line.id ? { id: line.id } : {}),
        ingrediente_id: line.ingrediente_id,
        cantidad: round4(line.cantidad),
        unidad: line.unidad,
        merma_ingrediente_receta: loss == null ? null : round2(loss),
      });
    }

    const response = await recetasSyncPlatoReceta(input.dishId, {
      precio: Number(price.toFixed(2)),
      expected_version: input.version,
      lineas,
    });

    if (response.status === 200) {
      revalidatePath('/escandallos');
      revalidatePath('/platos');
      return {};
    }

    const apiDetail = extractApiDetail(response.data);
    if (response.status === 409) {
      return { error: apiDetail ?? CONFLICT_MESSAGE };
    }
    if (response.status === 422) {
      return {
        error: apiDetail ?? 'Revisa los valores de la receta antes de guardar.',
      };
    }
    if (response.status === 404) {
      return {
        error: apiDetail ?? 'Selecciona un ingrediente existente y distinto en cada línea.',
      };
    }

    return { error: 'No se pudo confirmar el guardado. El borrador sigue disponible.' };
  } catch (error) {
    console.error('Error guardando el escandallo', error);
    return { error: 'No se pudo confirmar el guardado. El borrador sigue disponible.' };
  }
}
