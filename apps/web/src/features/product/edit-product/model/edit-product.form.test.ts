import { describe, expect, it } from 'vitest';
import {
  buildEditProductFormData,
  createInitialFormValues,
  getDisplayedCategories,
  validateEditProductForm,
  type EditProductFormValues,
} from './edit-product.form';

const baseValues: EditProductFormValues = {
  nombre: 'Agua con gas',
  categoria: 'Bebidas',
  precio: '2,50',
  precioCompra: '0.80',
  stock: '12',
  fotoUrl: 'https://cdn.example.com/agua.png',
  removeExistingPhoto: false,
};

describe('edit-product.form', () => {
  it('inicializa los valores a partir del producto seleccionado', () => {
    const initial = createInitialFormValues({
      $id: '4',
      $createdAt: '',
      $updatedAt: '',
      nombre: 'Salsa brava',
      categoria: 'Salsas',
      precio: 3.2,
      precio_compra: 1.1,
      stock: 8,
      foto: null,
    });

    expect(initial).toEqual({
      nombre: 'Salsa brava',
      categoria: 'Salsas',
      precio: '3.2',
      precioCompra: '1.1',
      stock: '8',
      fotoUrl: '',
      removeExistingPhoto: false,
    });
  });

  it('filtra únicamente categorías oficiales del contrato', () => {
    expect(getDisplayedCategories(['Bebidas', 'Inventada', 'Envases'])).toEqual([
      'Bebidas',
      'Envases',
    ]);
    expect(getDisplayedCategories(['Inventada'])).toContain('Bebidas');
  });

  it('valida correctamente valores válidos con coma o punto decimal', () => {
    const { errors, parsed } = validateEditProductForm(baseValues);
    expect(errors).toEqual({});
    expect(parsed).toEqual({
      nombre: 'Agua con gas',
      categoria: 'Bebidas',
      precio: 2.5,
      precioCompra: 0.8,
      stock: 12,
      fotoUrl: 'https://cdn.example.com/agua.png',
    });
  });

  it('detecta errores en nombre, categoría, precios, stock y URL de foto', () => {
    const { errors, parsed } = validateEditProductForm({
      nombre: '   ',
      categoria: 'Desconocida',
      precio: '-2',
      precioCompra: '',
      stock: '-1',
      fotoUrl: 'ftp://invalida.com/foto.png',
      removeExistingPhoto: false,
    });

    expect(parsed).toBeNull();
    expect(errors).toEqual({
      nombre: 'Introduce el nombre del producto.',
      categoria: 'Selecciona una categoría válida.',
      precio: 'Introduce un precio válido.',
      precioCompra: 'Introduce un precio de compra válido.',
      stock: 'Introduce una cantidad válida (0 o mayor).',
      foto: 'Introduce una URL válida (http://, https:// o /...).',
    });
  });

  it('construye FormData y marca removeFoto=true al vaciar la fotografía', () => {
    const emptyPhotoValues: EditProductFormValues = {
      ...baseValues,
      fotoUrl: '',
      removeExistingPhoto: true,
    };
    const { parsed } = validateEditProductForm(emptyPhotoValues);
    expect(parsed).not.toBeNull();

    const formData = buildEditProductFormData(emptyPhotoValues, parsed!);
    expect(formData.get('nombre')).toBe('Agua con gas');
    expect(formData.get('categoria')).toBe('Bebidas');
    expect(formData.get('precio')).toBe('2.5');
    expect(formData.get('precio_compra')).toBe('0.8');
    expect(formData.get('stock')).toBe('12');
    expect(formData.get('foto')).toBe('');
    expect(formData.get('removeFoto')).toBe('true');
  });
});
