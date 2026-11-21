import { Categoria } from '@/shared/api/generated/models'

export const DEFAULT_PRODUCT_CATEGORIES = [
  Categoria.Bebidas,
  Categoria.Salsas,
  Categoria.Conservas,
  Categoria.Lácteos,
  Categoria.Postres,
  Categoria.Envases,
] as const

export interface Product {
  $id: string
  $createdAt: string
  $updatedAt: string
  nombre: string
  precio: number
  precio_compra: number
  stock: number
  categoria: string
  foto: string | null
}

export interface CreateProductInput {
  nombre: string
  precio: number
  precio_compra: number
  stock: number
  categoria: string
  foto?: string | null
}

export interface UpdateProductInput {
  nombre?: string
  precio?: number
  precio_compra?: number
  stock?: number
  categoria?: string
  foto?: string | null
}

export interface ActionResponse<T> {
  success: boolean
  data?: T
  error?: string
}

const EURO_FORMATTER = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatProductPrice(price: number): string {
  if (!Number.isFinite(price)) return '0,00 €'
  return EURO_FORMATTER.format(price)
}
