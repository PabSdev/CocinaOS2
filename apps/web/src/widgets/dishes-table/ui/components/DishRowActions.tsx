'use client'

import {
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/shared/ui'
import { type Dish } from '@/entities/dish'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Delete02Icon,
  Edit02Icon,
  MoreVerticalIcon,
} from '@hugeicons/core-free-icons'

const DATE_FORMATTER = new Intl.DateTimeFormat('es-ES', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

export const CURRENCY_2 = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatDate(isoString?: string) {
  if (!isoString) return 'Sin fecha'

  const date = new Date(isoString)
  return Number.isNaN(date.getTime()) ? 'Sin fecha' : DATE_FORMATTER.format(date)
}

interface DishRowActionsProps {
  dish: Dish
  disabled: boolean
  onEdit: (dish: Dish) => void
  onDelete: (dish: Dish) => void
}

export function DishRowActions({ dish, disabled, onEdit, onDelete }: DishRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled}
        render={
          <Button
            variant="ghost"
            size="icon"
            className="size-9 rounded-full text-[#55667e] hover:bg-[#eff4f8] hover:text-[#112747]"
          />
        }
      >
        <HugeiconsIcon icon={MoreVerticalIcon} className="size-4" strokeWidth={2} />
        <span className="sr-only">Acciones para {dish.nombre}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-48 rounded-2xl border border-[#dce3e9] bg-white p-1.5 shadow-[0_14px_36px_-18px_rgba(17,39,71,0.18)]"
      >
        <DropdownMenuItem
          onClick={() => onEdit(dish)}
          className="min-h-9 cursor-pointer gap-2.5 rounded-xl px-3 text-[13px] font-medium text-[#142238] focus:bg-[#eff4f8]"
        >
          <HugeiconsIcon icon={Edit02Icon} className="size-4 text-[#112747]" strokeWidth={2} />
          Editar plato y receta
        </DropdownMenuItem>
        <DropdownMenuSeparator className="my-1 bg-[#edf1f5]" />
        <DropdownMenuItem
          variant="destructive"
          onClick={() => onDelete(dish)}
          className="min-h-9 cursor-pointer gap-2.5 rounded-xl px-3 text-[13px] font-medium text-[#962b29] focus:bg-[#fdebec]"
        >
          <HugeiconsIcon icon={Delete02Icon} className="size-4" strokeWidth={2} />
          Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
