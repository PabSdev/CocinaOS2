import {
  CookingPotIcon,
  Dish01Icon,
  Invoice01Icon,
  PackageIcon,
  DeliveryTruck01Icon,
  Settings02Icon,
} from '@hugeicons/core-free-icons'
import type { NavSection } from './types'

export const SIDEBAR_SECTIONS: NavSection[] = [
  {
    title: 'Operación en Cocina',
    items: [
      {
        id: 'ingredientes',
        label: 'Ingredientes',
        href: '/ingredientes',
        icon: CookingPotIcon,
        description: 'Stock, unidades y materias primas',
      },
      {
        id: 'platos',
        label: 'Platos',
        href: '/platos',
        icon: Dish01Icon,
        description: 'Carta, raciones y fotos de pase',
      },
      {
        id: 'productos',
        label: 'Productos',
        href: '/productos',
        icon: PackageIcon,
        description: 'Bebidas, salsas y despensa',
      },
    ],
  },
  {
    title: 'Gestión Culinaria',
    items: [
      {
        id: 'escandallos',
        label: 'Escandallos y Recetas',
        href: '/escandallos',
        icon: Invoice01Icon,
        description: 'Fichas técnicas y costes',
      },
      {
        id: 'pedidos',
        label: 'Historial de pedidos',
        href: '/pedidos',
        icon: Invoice01Icon,
        adminOnly: true,
        description: 'Registro y estado de comandas',
      },
      {
        id: 'movimientos',
        label: 'Entradas y Mermas',
        href: '#',
        icon: PackageIcon,
        badge: 'Pronto',
        badgeVariant: 'muted',
        disabled: true,
        description: 'Trazabilidad y desperdicios',
      },
      {
        id: 'proveedores',
        label: 'Proveedores',
        href: '#',
        icon: DeliveryTruck01Icon,
        badge: 'Pronto',
        badgeVariant: 'muted',
        disabled: true,
        description: 'Pedidos y contactos',
      },
    ],
  },
  {
    title: 'Configuración',
    items: [
      {
        id: 'ajustes',
        label: 'Ajustes de Cocina',
        href: '#',
        icon: Settings02Icon,
        badge: 'Pronto',
        badgeVariant: 'muted',
        disabled: true,
        description: 'Unidades y umbrales',
      },
    ],
  },
]
