import { UnidadDeMasa } from '@/shared/api/generated/models';

export { UnidadDeMasa };

export interface Ingredient {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  nombre: string;
  descripcion: string | null;
  stock: number;
  unidad_de_masa: UnidadDeMasa;
  precio_compra: number | null;
  merma_habitual?: number | null;
}

export interface CreateIngredientInput {
  nombre: string;
  descripcion?: string | null;
  stock: number;
  unidad_de_masa: UnidadDeMasa;
  precio_compra?: number | null;
  merma_habitual?: number | null;
}

export interface UpdateIngredientInput {
  nombre?: string;
  descripcion?: string | null;
  stock?: number;
  unidad_de_masa?: UnidadDeMasa;
  precio_compra?: number | null;
  merma_habitual?: number | null;
}

export interface ActionResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
