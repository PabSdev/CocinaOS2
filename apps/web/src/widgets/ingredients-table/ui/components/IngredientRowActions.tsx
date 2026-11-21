'use client'

import {
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/shared/ui'
import { type Ingredient } from '@/entities/ingredient'
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

export function formatDate(isoString?: string) {
  if (!isoString) return 'Sin fecha'

  const date = new Date(isoString)
  return Number.isNaN(date.getTime()) ? 'Sin fecha' : DATE_FORMATTER.format(date)
}

export function formatNumber(value: number) {
  return value.toLocaleString('es-ES', {
    maximumFractionDigits: 20,
  })
}

interface IngredientRowActionsProps {
  ingredient: Ingredient
  disabled: boolean
  onEdit: (ingredient: Ingredient) => void
  onDelete: (ingredient: Ingredient) => void
}

export function IngredientRowActions({
  ingredient,
  disabled,
  onEdit,
  onDelete,
}: IngredientRowActionsProps) {
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
        <span className="sr-only">Acciones para {ingredient.nombre}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 rounded-2xl border-[#cbd7e3] p-1.5 shadow-lg">
        <DropdownMenuItem
          onClick={() => onEdit(ingredient)}
          className="min-h-9 cursor-pointer gap-2 rounded-xl font-medium"
        >
          <HugeiconsIcon icon={Edit02Icon} className="size-4 text-[#112747]" strokeWidth={2} />
          Editar
        </DropdownMenuItem>
        <DropdownMenuSeparator className="my-1 bg-[#dce3e9]" />
        <DropdownMenuItem
          variant="destructive"
          onClick={() => onDelete(ingredient)}
          className="min-h-9 cursor-pointer gap-2 rounded-xl font-medium text-[#962b29]"
        >
          <HugeiconsIcon icon={Delete02Icon} className="size-4" strokeWidth={2} />
          Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
