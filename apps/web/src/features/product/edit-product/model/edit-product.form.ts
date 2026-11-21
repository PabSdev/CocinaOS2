import { DEFAULT_PRODUCT_CATEGORIES, type Product } from '@/entities/product';

export interface EditProductFormValues {
  nombre: string;
  categoria: string;
  precio: string;
  precioCompra: string;
  stock: string;
  fotoUrl: string;
  removeExistingPhoto: boolean;
}

export interface EditProductFormErrors {
  nombre?: string;
  categoria?: string;
  precio?: string;
  precioCompra?: string;
  stock?: string;
  foto?: string;
}

export interface ParsedEditProductValues {
  nombre: string;
  categoria: string;
  precio: number;
  precioCompra: number;
  stock: number;
  fotoUrl: string;
}

export function isValidOptionalPhotoUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return true;
  try {
    const url = new URL(trimmed);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function createInitialFormValues(product: Product | null): EditProductFormValues {
  return {
    nombre: product?.nombre ?? '',
    categoria: product?.categoria ?? DEFAULT_PRODUCT_CATEGORIES[0],
    precio: product ? product.precio.toString() : '',
    precioCompra: product ? product.precio_compra.toString() : '',
    stock: product ? product.stock.toString() : '0',
    fotoUrl: product?.foto ?? '',
    removeExistingPhoto: false,
  };
}

export function getDisplayedCategories(availableCategories: string[]): string[] {
  const officialCategories: readonly string[] = DEFAULT_PRODUCT_CATEGORIES;
  const filtered = availableCategories.filter((cat) =>
    officialCategories.some(
      (official) => official.toLocaleLowerCase('es') === cat.toLocaleLowerCase('es'),
    ),
  );
  return filtered.length > 0 ? filtered : [...DEFAULT_PRODUCT_CATEGORIES];
}

export function validateEditProductForm(values: EditProductFormValues): {
  errors: EditProductFormErrors;
  parsed: ParsedEditProductValues | null;
} {
  const errors: EditProductFormErrors = {};
  const officialCategories: readonly string[] = DEFAULT_PRODUCT_CATEGORIES;

  const nombre = values.nombre.trim();
  if (!nombre) {
    errors.nombre = 'Introduce el nombre del producto.';
  }

  const categoria = values.categoria.trim();
  const isOfficialCategory = officialCategories.some(
    (cat) => cat.toLocaleLowerCase('es') === categoria.toLocaleLowerCase('es'),
  );
  if (!categoria || !isOfficialCategory) {
    errors.categoria = 'Selecciona una categoría válida.';
  }

  const parsedPrecio = Number.parseFloat(
    values.precio.replace(',', '.').replace(/[^0-9.-]/g, ''),
  );
  if (!values.precio.trim() || Number.isNaN(parsedPrecio) || parsedPrecio < 0) {
    errors.precio = 'Introduce un precio válido.';
  }

  const parsedPrecioCompra = Number.parseFloat(
    values.precioCompra.replace(',', '.').replace(/[^0-9.-]/g, ''),
  );
  if (
    !values.precioCompra.trim() ||
    Number.isNaN(parsedPrecioCompra) ||
    parsedPrecioCompra < 0
  ) {
    errors.precioCompra = 'Introduce un precio de compra válido.';
  }

  const numericStock = Number.parseInt(values.stock, 10);
  if (Number.isNaN(numericStock) || numericStock < 0) {
    errors.stock = 'Introduce una cantidad válida (0 o mayor).';
  }

  if (!isValidOptionalPhotoUrl(values.fotoUrl)) {
    errors.foto = 'Introduce una URL válida (http://, https:// o /...).';
  }

  if (Object.keys(errors).length > 0) {
    return { errors, parsed: null };
  }

  return {
    errors,
    parsed: {
      nombre,
      categoria,
      precio: parsedPrecio,
      precioCompra: parsedPrecioCompra,
      stock: numericStock,
      fotoUrl: values.fotoUrl.trim(),
    },
  };
}

export function buildEditProductFormData(
  values: EditProductFormValues,
  parsed: ParsedEditProductValues,
): FormData {
  const formData = new FormData();
  formData.append('nombre', parsed.nombre);
  formData.append('categoria', parsed.categoria);
  formData.append('precio', parsed.precio.toString());
  formData.append('precio_compra', parsed.precioCompra.toString());
  formData.append('stock', parsed.stock.toString());
  formData.append('foto', parsed.fotoUrl);

  if (values.removeExistingPhoto || !parsed.fotoUrl) {
    formData.append('removeFoto', 'true');
  }

  return formData;
}
