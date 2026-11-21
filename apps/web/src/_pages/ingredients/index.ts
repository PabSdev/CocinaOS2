import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Ingredientes',
  description: 'Revisa existencias, detecta faltantes y mantén actualizado el inventario de cocina.',
}

export { IngredientsPage } from './ui/IngredientsPage'
export { IngredientsLoading } from './ui/IngredientsLoading'
