'use server';

import { requireKitchenAccess } from '@/shared/api'

import {
  BUCKET_FOTOS_ID,
  DATABASE_ID,
  ID,
  Query,
  storage,
  TABLE_PRODUCTOS_ID,
  tablesDB,
} from '@/shared/api';
import { revalidatePath } from 'next/cache';
import type { Models } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';
import type { ActionResponse, Product } from '../model/type';

type ProductRow = Models.Row & {
  Nombre?: string | null;
  Cantidad?: number | null;
  Categoria?: string | null;
  precio?: number | null;
  precio_compra?: number | string | null;
  fotos?: string | null;
};

type ProductPayload = Partial<
  Pick<ProductRow, 'Nombre' | 'Categoria' | 'precio' | 'precio_compra' | 'Cantidad' | 'fotos'>
>;

const PAGE_SIZE = 100;
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

class ValidationError extends Error {}

// Devuelve NaN si el texto no es un número (a diferencia de un 0 silencioso).
function parsePriceValue(raw: unknown): number {
  if (typeof raw === 'number') return raw;
  if (typeof raw !== 'string') return Number.NaN;
  const text = raw.trim();
  if (!/^-?[\d.,]+$/.test(text)) return Number.NaN;
  // "1.234,50" -> 1234.50 ; "2,50" -> 2.50 ; "2.50" se respeta
  const normalized = text.includes(',') ? text.replace(/\./g, '').replace(',', '.') : text;
  return Number(normalized);
}

function toProduct(row: ProductRow): Product {
  const finite = (raw: unknown) => {
    const value = parsePriceValue(raw);
    return Number.isFinite(value) ? value : 0;
  };
  return {
    $id: row.$id,
    $createdAt: row.$createdAt,
    $updatedAt: row.$updatedAt,
    nombre: (row.Nombre ?? '').trim() || 'Producto sin nombre',
    precio: finite(row.precio),
    precio_compra: finite(row.precio_compra),
    stock: Number(row.Cantidad ?? 0),
    categoria: (row.Categoria ?? '').trim() || 'General',
    foto: row.fotos || null,
  };
}

function toErrorResponse(error: unknown, fallback: string): { success: false; error: string } {
  if (error instanceof ValidationError) return { success: false, error: error.message };
  console.error(fallback, error);
  return { success: false, error: fallback };
}

/** Lee y valida los campos del formulario. En `partial` (update) solo los presentes. */
function readFields(formData: FormData, partial: boolean): ProductPayload {
  const data: ProductPayload = {};

  const read = (key: string) => {
    const value = formData.get(key)?.toString().trim();
    if (value) return value;
    if (!partial || formData.has(key)) return null; // obligatorio o vacío enviado
    return undefined; // update sin ese campo: se ignora
  };

  const text = (key: string, label: string, column: 'Nombre' | 'Categoria') => {
    const value = read(key);
    if (value === undefined) return;
    if (value === null) throw new ValidationError(`${label} es obligatorio.`);
    data[column] = value;
  };

  const money = (key: string, label: string, column: 'precio' | 'precio_compra') => {
    const value = read(key);
    if (value === undefined) return;
    if (value === null) throw new ValidationError(`${label} es obligatorio.`);
    const parsed = parsePriceValue(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
      throw new ValidationError(`Introduce ${label.toLowerCase()} válido igual o mayor a 0.`);
    }
    data[column] = parsed;
  };

  text('nombre', 'El nombre del producto', 'Nombre');
  text('categoria', 'La categoría del producto', 'Categoria');
  money('precio', 'El precio', 'precio');
  money('precio_compra', 'El precio de compra', 'precio_compra');

  const rawStock = formData.get('stock')?.toString().trim();
  if (rawStock) {
    const stock = Number(rawStock);
    if (!Number.isFinite(stock) || stock < 0) {
      throw new ValidationError('La cantidad en stock debe ser 0 o mayor.');
    }
    data.Cantidad = Math.floor(stock);
  } else if (!partial) {
    data.Cantidad = 0;
  }

  return data;
}

function getPhotoFile(formData: FormData): File | null {
  const file = formData.get('foto') as File | null;
  return file && file.size > 0 && typeof file.arrayBuffer === 'function' ? file : null;
}

async function uploadPhoto(file: File): Promise<string> {
  if (!PHOTO_TYPES.includes(file.type)) {
    throw new ValidationError('Formato no compatible. Usa JPG, PNG o WebP.');
  }
  if (file.size > MAX_PHOTO_BYTES) {
    throw new ValidationError('La imagen no puede superar 10 MB.');
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const uploaded = await storage.createFile({
    bucketId: BUCKET_FOTOS_ID,
    fileId: ID.unique(),
    file: InputFile.fromBuffer(buffer, file.name || 'product-photo.jpg'),
  });
  return uploaded.$id;
}

async function deletePhoto(fileId: string | null | undefined) {
  if (!fileId) return;
  await storage
    .deleteFile({ bucketId: BUCKET_FOTOS_ID, fileId })
    .catch((err) => console.warn('Could not delete product photo:', err));
}

export async function getProducts(): Promise<ActionResponse<Product[]>> {
  try {
    await requireKitchenAccess()
    const rows: ProductRow[] = [];
    // Pagina hasta cargar todo el catálogo, no solo los primeros 100.
    for (;;) {
      const response = await tablesDB.listRows<ProductRow>({
        databaseId: DATABASE_ID,
        tableId: TABLE_PRODUCTOS_ID,
        queries: [
          Query.orderDesc('$createdAt'),
          Query.limit(PAGE_SIZE),
          Query.offset(rows.length),
        ],
      });
      rows.push(...response.rows);
      if (response.rows.length < PAGE_SIZE) break;
    }

    return { success: true, data: rows.map(toProduct) };
  } catch (error: unknown) {
    return toErrorResponse(error, 'No se pudo cargar el catálogo de productos.');
  }
}

export async function createProduct(formData: FormData): Promise<ActionResponse<Product>> {
  try {
    await requireKitchenAccess()
    const payload = readFields(formData, false);

    const fotoFile = getPhotoFile(formData);
    const fotoId = fotoFile ? await uploadPhoto(fotoFile) : null;

    let response: ProductRow;
    try {
      response = await tablesDB.createRow<ProductRow>({
        databaseId: DATABASE_ID,
        tableId: TABLE_PRODUCTOS_ID,
        rowId: ID.unique(),
        data: { ...payload, fotos: fotoId },
      });
    } catch (error) {
      await deletePhoto(fotoId); // no dejar la foto huérfana
      throw error;
    }

    revalidatePath('/productos');
    return { success: true, data: toProduct(response) };
  } catch (error: unknown) {
    return toErrorResponse(
      error,
      'No se pudo crear el producto. Verifica los datos e inténtalo de nuevo.',
    );
  }
}

export async function updateProduct(
  productId: string,
  formData: FormData,
): Promise<ActionResponse<Product>> {
  try {
    await requireKitchenAccess()
    if (!productId) {
      return { success: false, error: 'ID de producto no proporcionado.' };
    }

    const updateData = readFields(formData, true);

    const currentProduct = await tablesDB.getRow<ProductRow>({
      databaseId: DATABASE_ID,
      tableId: TABLE_PRODUCTOS_ID,
      rowId: productId,
    });

    const fotoFile = getPhotoFile(formData);
    let newFotoId: string | null = null;
    if (fotoFile) {
      newFotoId = await uploadPhoto(fotoFile);
      updateData.fotos = newFotoId;
    } else if (formData.get('removeFoto') === 'true') {
      updateData.fotos = null;
    }

    let response: ProductRow;
    try {
      response = await tablesDB.updateRow<ProductRow>({
        databaseId: DATABASE_ID,
        tableId: TABLE_PRODUCTOS_ID,
        rowId: productId,
        data: updateData,
      });
    } catch (error) {
      await deletePhoto(newFotoId);
      throw error;
    }

    // La foto antigua se borra solo cuando la fila ya apunta a la nueva.
    if ('fotos' in updateData) await deletePhoto(currentProduct.fotos);

    revalidatePath('/productos');
    return { success: true, data: toProduct(response) };
  } catch (error: unknown) {
    return toErrorResponse(error, 'No se pudo actualizar el producto.');
  }
}

export async function deleteProduct(productId: string): Promise<ActionResponse<boolean>> {
  try {
    await requireKitchenAccess()
    if (!productId) {
      return { success: false, error: 'ID de producto no proporcionado.' };
    }

    const row = await tablesDB.getRow<ProductRow>({
      databaseId: DATABASE_ID,
      tableId: TABLE_PRODUCTOS_ID,
      rowId: productId,
    });

    await tablesDB.deleteRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_PRODUCTOS_ID,
      rowId: productId,
    });
    await deletePhoto(row.fotos);

    revalidatePath('/productos');
    return { success: true, data: true };
  } catch (error: unknown) {
    return toErrorResponse(error, 'No se pudo eliminar el producto.');
  }
}
