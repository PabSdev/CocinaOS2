export interface Dish {
  $id: string
  $createdAt: string
  $updatedAt: string
  nombre: string
  precio: string | null
  foto: string | null
  stock: number
}

export interface CreateDishInput {
  nombre: string
  precio?: string | null
  stock: number
  foto?: string | null
}

export interface UpdateDishInput {
  nombre?: string
  precio?: string | null
  stock?: number
  foto?: string | null
}

export interface ActionResponse<T> {
  success: boolean
  data?: T
  error?: string
}
