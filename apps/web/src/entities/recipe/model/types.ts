import type { UnidadDeMasa } from '@/shared/api';

export type RecipeUnit = UnidadDeMasa;

export interface RecipeItem {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  plato_id: string;
  ingrediente_id: string;
  cantidad: number;
  unidad: RecipeUnit;
  merma_ingrediente_receta?: number | null;
  plato?: {
    $id: string;
    nombre: string;
    precio: string | null;
    foto?: string | null;
    stock: number;
  };
  ingrediente?: {
    $id: string;
    nombre: string;
    descripcion?: string | null;
    stock: number;
    unidad_de_masa: RecipeUnit;
    precio_compra?: number | null;
    merma_habitual?: number | null;
  };
}

export interface DishRecipeIngredientInput {
  ingrediente_id: string;
  cantidad: number;
  unidad: RecipeUnit;
  merma_ingrediente_receta?: number | null;
}

export interface ActionResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
