'use client'

import { HugeiconsIcon } from '@hugeicons/react'
import { Delete02Icon, Edit02Icon } from '@hugeicons/core-free-icons'
import type { DraftDishRecipeLine, RecipeIngredient } from '../../model/recipe-draft'

const CURRENCY = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatEur(val: number | null | undefined): string {
  if (val == null || !Number.isFinite(val)) return '0,00 €'
  return CURRENCY.format(val)
}

interface DishRecipeLineRowProps {
  line: DraftDishRecipeLine
  ingredient: RecipeIngredient | undefined
  lineCost: number | null | undefined
  disabled: boolean
  onEdit: (line: DraftDishRecipeLine) => void
  onRemove: (localId: string) => void
}

export function DishRecipeLineRow({
  line,
  ingredient,
  lineCost,
  disabled,
  onEdit,
  onRemove,
}: DishRecipeLineRowProps) {
  const mermaDisplay = line.merma_override.trim()
    ? `${line.merma_override} % merma`
    : ingredient?.merma_habitual != null
      ? `${ingredient.merma_habitual} % merma`
      : '0 % merma'

  return (
    <div className="group flex items-center justify-between rounded-xl border border-slate-200/80 bg-white px-3.5 py-2.5 transition-all hover:border-slate-300 shadow-2xs">
      <div className="min-w-0 pr-3">
        <h5 className="text-[13px] font-semibold text-[#142238] truncate">
          {ingredient?.nombre ?? 'Ingrediente'}
        </h5>
        <p className="text-xs text-[#55667e] mt-0.5">
          {line.cantidad} {line.unidad.toLowerCase()} · {mermaDisplay}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className="text-sm font-bold text-[#142238] tabular-nums">
          {formatEur(lineCost)}
        </span>
        <button
          type="button"
          onClick={() => onEdit(line)}
          disabled={disabled}
          title="Editar ingrediente"
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
        >
          <HugeiconsIcon icon={Edit02Icon} className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onRemove(line.localId)}
          disabled={disabled}
          title="Eliminar ingrediente"
          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
        >
          <HugeiconsIcon icon={Delete02Icon} className="size-3.5" />
        </button>
      </div>
    </div>
  )
}
