export interface MenuItem {
  id: string
  type: 'plato' | 'producto'
  name: string
  price: number | null
  category: string | null
  photo: boolean
  availability: 'disponible' | 'bajo' | 'agotado'
}

export interface ClientMenu {
  dishes: { data: MenuItem[] | null }
  products: { data: MenuItem[] | null }
}
