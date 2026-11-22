'use server';

import {
  platosCreatePlato,
  platosDeletePlato,
  platosGetPlatos,
  platosUpdatePlato,
  requireKitchenAccess,
  type PlatoCreate,
  type PlatoResponse,
  type PlatoUpdate,
} from '@/shared/api';
import { isValidUuid } from '@/shared/lib';
import { revalidatePath } from 'next/cache';
import type { ActionResponse, Dish } from '../model/types';

class ValidationError extends Error {}

function readPrice(value: FormDataEntryValue | null): number | null {
  const cleaned = (value?.toString() ?? '').replace(/[€$\s]/g, '').trim();
  if (!cleaned) return 0;
  const normalized = cleaned.includes(',')
    ? cleaned.replace(/\./g, '').replace(',', '.')
    : cleaned;
  const price = Number(normalized);
  return Number.isFinite(price) && price >= 0 ? Number(price.toFixed(2)) : null;
}

function parseDishId(id: string): string {
  const cleanId = id?.trim() ?? '';
  if (!cleanId) {
    throw new ValidationError('ID de plato no proporcionado.');
  }
  if (!isValidUuid(cleanId)) {
    throw new ValidationError('ID de plato no válido.');
  }
  return cleanId;
}

// shortcut: la subida de archivos de fotos está deshabilitada temporalmente; solo se aceptan URLs o vacío.
function parsePhotoValue(raw: FormDataEntryValue | null): string | null {
  if (raw === null) return null;
  if (typeof raw !== 'string') {
    if (typeof (raw as File).size === 'number' && (raw as File).size === 0) {
      return null;
    }
    throw new ValidationError(
      'La subida de fotos está deshabilitada temporalmente.',
    );
  }
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return trimmed;
  try {
    const url = new URL(trimmed);
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return trimmed;
    }
  } catch {
    // Validado abajo con mensaje explícito.
  }
  throw new ValidationError('Introduce una URL de imagen válida (http://, https:// o /...).');
}

function toDish(dto: PlatoResponse): Dish {
  return {
    $id: dto.id,
    $createdAt: dto.created_at ?? '',
    $updatedAt: dto.updated_at ?? '',
    nombre: dto.nombre,
    precio: dto.precio == null ? null : String(dto.precio),
    foto: dto.foto?.trim() ? dto.foto.trim() : null,
    stock: Number(dto.stock ?? 0),
  };
}

function toErrorResponse(error: unknown, fallback: string): { success: false; error: string } {
  if (error instanceof ValidationError) {
    return { success: false, error: error.message };
  }
  console.error(fallback, error);
  return { success: false, error: fallback };
}

export async function getDishes(): Promise<ActionResponse<Dish[]>> {
  try {
    await requireKitchenAccess();
    const response = await platosGetPlatos();
    if (response.status !== 200) {
      return { success: false, error: 'No se pudo cargar la lista de platos.' };
    }

    return {
      success: true,
      data: response.data.map(toDish),
    };
  } catch (error: unknown) {
    return toErrorResponse(error, 'No se pudo cargar la lista de platos.');
  }
}

export async function createDish(formData: FormData): Promise<ActionResponse<Dish>> {
  try {
    await requireKitchenAccess();
    const nombre = formData.get('nombre')?.toString().trim();
    if (!nombre) {
      return { success: false, error: 'El nombre del plato es obligatorio.' };
    }

    const precio = readPrice(formData.get('precio'));
    if (precio === null) {
      return { success: false, error: 'Introduce un precio válido igual o mayor a 0.' };
    }

    const rawStock = formData.get('stock')?.toString();
    const stock = Number(rawStock ?? 0);
    if (!Number.isFinite(stock) || stock < 0) {
      return { success: false, error: 'El stock debe ser un número igual o mayor a 0.' };
    }

    const foto = formData.has('foto') ? parsePhotoValue(formData.get('foto')) : null;

    const payload: PlatoCreate = {
      nombre,
      precio,
      stock: Math.floor(stock),
      foto,
    };

    const response = await platosCreatePlato(payload);
    if (response.status !== 201) {
      return {
        success: false,
        error: 'No se pudo crear el plato. Verifica los datos e inténtalo de nuevo.',
      };
    }

    revalidatePath('/platos');
    revalidatePath('/escandallos');
    return { success: true, data: toDish(response.data) };
  } catch (error: unknown) {
    return toErrorResponse(
      error,
      'No se pudo crear el plato. Verifica los datos e inténtalo de nuevo.',
    );
  }
}

export async function updateDish(
  id: string,
  formData: FormData,
): Promise<ActionResponse<Dish>> {
  try {
    await requireKitchenAccess();
    const validId = parseDishId(id);

    const updateData: PlatoUpdate = {};

    const nombre = formData.get('nombre')?.toString().trim();
    if (nombre) {
      updateData.nombre = nombre;
    }

    const rawPrecio = formData.get('precio');
    if (rawPrecio !== null) {
      const precio = readPrice(rawPrecio);
      if (precio === null) {
        return { success: false, error: 'Introduce un precio válido igual o mayor a 0.' };
      }
      updateData.precio = precio;
    }

    const rawStock = formData.get('stock')?.toString();
    if (rawStock !== undefined && rawStock !== null && rawStock !== '') {
      const stock = Number(rawStock);
      if (!Number.isFinite(stock) || stock < 0) {
        return { success: false, error: 'El stock debe ser un número igual o mayor a 0.' };
      }
      updateData.stock = Math.floor(stock);
    }

    if (formData.get('removeFoto') === 'true') {
      updateData.foto = null;
    } else if (formData.has('foto')) {
      updateData.foto = parsePhotoValue(formData.get('foto'));
    }

    const response = await platosUpdatePlato(validId, updateData);
    if (response.status !== 200) {
      return { success: false, error: 'No se pudo actualizar el plato.' };
    }

    revalidatePath('/platos');
    revalidatePath('/escandallos');
    return { success: true, data: toDish(response.data) };
  } catch (error: unknown) {
    return toErrorResponse(error, 'No se pudo actualizar el plato.');
  }
}

export async function deleteDish(id: string): Promise<ActionResponse<boolean>> {
  try {
    await requireKitchenAccess();
    const validId = parseDishId(id);

    const response = await platosDeletePlato(validId);
    if (response.status !== 204) {
      return { success: false, error: 'No se pudo eliminar el plato.' };
    }

    revalidatePath('/platos');
    revalidatePath('/escandallos');
    return { success: true, data: true };
  } catch (error: unknown) {
    return toErrorResponse(error, 'No se pudo eliminar el plato.');
  }
}
