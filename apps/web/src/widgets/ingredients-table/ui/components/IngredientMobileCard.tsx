'use client'

import {
  StockBadge,
  formatPurchasePrice,
  type Ingredient,
} from '@/entities/ingredient'
import { IngredientRowActions, formatNumber } from './IngredientRowActions'

interface IngredientMobileCardProps {
  ingredient: Ingredient
  isPending: boolean
  onEdit: (ingredient: Ingredient) => void
  onDelete: (ingredient: Ingredient) => void
}

export function IngredientMobileCard({
  ingredient,
  isPending,
  onEdit,
  onDelete,
}: IngredientMobileCardProps) {
  const isLow = ingredient.stock <= 5

  return (
    <li
      className={`p-4 transition-colors ${isLow ? 'bg-[#fffcf5]' : 'bg-white'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[#142238]">
            {ingredient.nombre}
          </p>
          {ingredient.descripcion ? (
            <p className="mt-0.5 truncate text-xs text-[#55667e]">
              {ingredient.descripcion}
            </p>
          ) : null}
        </div>
        <IngredientRowActions
          ingredient={ingredient}
          disabled={isPending}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>
      <div className="mt-3 flex items-center justify-between gap-4">
        <div className="inline-flex items-center gap-1.5">
          <span className="text-base font-semibold tabular-nums text-[#142238]">
            {formatNumber(ingredient.stock)}
          </span>
          <span className="rounded-full border border-[#e1e9f0] bg-[#eff4f8] px-2 py-0.5 text-[11px] font-semibold text-[#465870]">
            {ingredient.unidad_de_masa}
          </span>
        </div>
        <StockBadge stock={ingredient.stock} />
      </div>
      <p className="mt-2 text-xs tabular-nums text-[#55667e]">
        Compra sin IVA: {formatPurchasePrice(ingredient.precio_compra, ingredient.unidad_de_masa)}
      </p>
    </li>
  )
}
