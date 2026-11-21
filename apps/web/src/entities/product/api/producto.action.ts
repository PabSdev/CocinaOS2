'use server';

import {
  Categoria,
  productosCreateProducto,
  productosDeleteProducto,
  productosGetProductoById,
  productosGetProductos,
  productosUpdateProducto,
  requireKitchenAccess,
  type ProductoCreate,
  type ProductoResponse,
  type ProductoUpdate,
} from '@/shared/api';
import { revalidatePath } from 'next/cache';
import {
  DEFAULT_PRODUCT_CATEGORIES,
  type ActionResponse,
  type Product,
} from '../model/type';

const MAX_STOCK_INT32 = 2_147_483_647;

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

function parseCategory(raw: string): Categoria {
  const normalized = raw.trim().toLocaleLowerCase('es');
  const match = DEFAULT_PRODUCT_CATEGORIES.find(
    (category) => category.toLocaleLowerCase('es') === normalized,
  );
  if (!match) {
    throw new ValidationError('Selecciona una categoría válida.');
  }
  return match;
}

function parsePhotoUrl(raw: FormDataEntryValue | null): string {
  if (raw === null) return '';
  if (typeof raw !== 'string') {
    if (typeof (raw as File).size === 'number' && (raw as File).size === 0) {
      return '';
    }
    throw new ValidationError(
      'La subida de archivos está deshabilitada. Introduce una URL de imagen válida.',
    );
  }
  const trimmed = raw.trim();
  if (!trimmed) return '';
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

function toProduct(dto: ProductoResponse): Product {
  const finite = (raw: unknown) => {
    const value = parsePriceValue(raw);
    return Number.isFinite(value) ? value : 0;
  };
  return {
    $id: String(dto.id),
    $createdAt: '',
    $updatedAt: '',
    nombre: (dto.nombre ?? '').trim() || 'Producto sin nombre',
    precio: finite(dto.precio),
    precio_compra: finite(dto.precio_compra),
    stock: Number(dto.stock ?? 0),
    categoria: (dto.categoria ?? '').trim() || Categoria.Bebidas,
    foto: dto.foto?.trim() ? dto.foto.trim() : null,
  };
}

function toErrorResponse(error: unknown, fallback: string): { success: false; error: string } {
  if (error instanceof ValidationError) return { success: false, error: error.message };
  console.error(fallback, error);
  return { success: false, error: fallback };
}

/** Lee y valida los campos del formulario. En `partial` (update) solo los presentes. */
function readFields(formData: FormData, partial: boolean): Partial<ProductoUpdate> {
  const data: Partial<ProductoUpdate> = {};

  const read = (key: string) => {
    const value = formData.get(key)?.toString().trim();
    if (value) return value;
    if (!partial || formData.has(key)) return null; // obligatorio o vacío enviado
    return undefined; // update sin ese campo: se ignora
  };

  const nombre = read('nombre');
  if (nombre !== undefined) {
    if (nombre === null) throw new ValidationError('El nombre del producto es obligatorio.');
    data.nombre = nombre;
  }

  const rawCategoria = read('categoria');
  if (rawCategoria !== undefined) {
    if (rawCategoria === null) {
      throw new ValidationError('La categoría del producto es obligatoria.');
    }
    data.categoria = parseCategory(rawCategoria);
  }

  const money = (key: string, label: string, field: 'precio' | 'precio_compra') => {
    const value = read(key);
    if (value === undefined) return;
    if (value === null) throw new ValidationError(`${label} es obligatorio.`);
    const parsed = parsePriceValue(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
      throw new ValidationError(`Introduce ${label.toLowerCase()} válido igual o mayor a 0.`);
    }
    data[field] = parsed;
  };

  money('precio', 'El precio', 'precio');
  money('precio_compra', 'El precio de compra', 'precio_compra');

  const rawStock = formData.get('stock')?.toString().trim();
  if (rawStock) {
    const stock = Number(rawStock);
    if (!Number.isFinite(stock) || stock < 0 || stock > MAX_STOCK_INT32) {
      throw new ValidationError('La cantidad en stock debe ser 0 o mayor.');
    }
    data.stock = Math.floor(stock);
  } else if (!partial) {
    data.stock = 0;
  } else if (formData.has('stock')) {
    throw new ValidationError('La cantidad en stock debe ser 0 o mayor.');
  }

  if (formData.get('removeFoto') === 'true') {
    data.foto = '';
  } else if (formData.has('foto')) {
    data.foto = parsePhotoUrl(formData.get('foto'));
  } else if (!partial) {
    data.foto = '';
  }

  return data;
}

function parseProductId(productId: string): number {
  const cleanId = productId.trim();
  if (!cleanId) {
    throw new ValidationError('ID de producto no proporcionado.');
  }
  const numericId = Number(cleanId);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    throw new ValidationError('ID de producto no válido.');
  }
  return numericId;
}

export async function getProducts(): Promise<ActionResponse<Product[]>> {
  try {
    await requireKitchenAccess();
    const response = await productosGetProductos();
    if (response.status !== 200) {
      return { success: false, error: 'No se pudo cargar el catálogo de productos.' };
    }

    return { success: true, data: response.data.map(toProduct) };
  } catch (error: unknown) {
    return toErrorResponse(error, 'No se pudo cargar el catálogo de productos.');
  }
}

export async function createProduct(formData: FormData): Promise<ActionResponse<Product>> {
  try {
    await requireKitchenAccess();
    const payload = readFields(formData, false) as ProductoCreate;

    const response = await productosCreateProducto(payload);
    if (response.status !== 201) {
      return {
        success: false,
        error: 'No se pudo crear el producto. Verifica los datos e inténtalo de nuevo.',
      };
    }

    revalidatePath('/productos');
    return { success: true, data: toProduct(response.data) };
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
    await requireKitchenAccess();
    const numericId = parseProductId(productId);
    const fields = readFields(formData, true);

    const hasAllFields =
      fields.nombre !== undefined &&
      fields.categoria !== undefined &&
      fields.precio !== undefined &&
      fields.precio_compra !== undefined &&
      fields.stock !== undefined &&
      fields.foto !== undefined;

    let payload: ProductoUpdate;
    if (hasAllFields) {
      payload = fields as ProductoUpdate;
    } else {
      const currentResponse = await productosGetProductoById(numericId);
      if (currentResponse.status !== 200) {
        return { success: false, error: 'No se pudo actualizar el producto.' };
      }
      const current = currentResponse.data;
      payload = {
        nombre: fields.nombre ?? current.nombre,
        categoria: fields.categoria ?? current.categoria,
        precio: fields.precio ?? current.precio,
        precio_compra: fields.precio_compra ?? current.precio_compra,
        stock: fields.stock ?? current.stock,
        foto: fields.foto ?? current.foto,
      };
    }

    const response = await productosUpdateProducto(numericId, payload);
    if (response.status !== 200) {
      return { success: false, error: 'No se pudo actualizar el producto.' };
    }

    revalidatePath('/productos');
    return { success: true, data: toProduct(response.data) };
  } catch (error: unknown) {
    return toErrorResponse(error, 'No se pudo actualizar el producto.');
  }
}

export async function deleteProduct(productId: string): Promise<ActionResponse<boolean>> {
  try {
    await requireKitchenAccess();
    const numericId = parseProductId(productId);

    const response = await productosDeleteProducto(numericId);
    if (response.status !== 204) {
      return { success: false, error: 'No se pudo eliminar el producto.' };
    }

    revalidatePath('/productos');
    return { success: true, data: true };
  } catch (error: unknown) {
    return toErrorResponse(error, 'No se pudo eliminar el producto.');
  }
}
