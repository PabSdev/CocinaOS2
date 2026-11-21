'use client'

import { StockBadge } from '@/entities/ingredient'
import { DishThumbnail, type Dish } from '@/entities/dish'
import { type DishEscandalloSummary } from './DishDesktopRow'
import { CURRENCY_2, DishRowActions } from './DishRowActions'

interface DishMobileCardProps {
  dish: Dish
  dishEscandallo?: DishEscandalloSummary
  isPending: boolean
  onEdit: (dish: Dish) => void
  onDelete: (dish: Dish) => void
}

export function DishMobileCard({
  dish,
  dishEscandallo,
  isPending,
  onEdit,
  onDelete,
}: DishMobileCardProps) {
  const isLow = dish.stock <= 5
  const ingCount = dishEscandallo?.lines.length ?? 0

  return (
    <li className={`p-4 ${isLow ? 'bg-[#fffcf5]' : 'bg-white'}`}>
      <div className="flex items-start gap-3">
        <DishThumbnail fotoId={dish.foto} alt={dish.nombre} size="md" />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[13.5px] font-semibold text-[#142238]">
              {dish.nombre}
            </p>
            <DishRowActions
              dish={dish}
              disabled={isPending}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tabular-nums ${
                dish.precio
                  ? 'border-[#dce3e9] bg-[#eff4f8] text-[#142238]'
                  : 'border-dashed border-[#cbd7e3] bg-white text-[#55667e]'
              }`}>
                {dish.precio || 'Sin PVP'}
              </span>
              <span className="rounded-md bg-[#eff4f8] px-2 py-0.5 text-xs font-medium text-[#55667e]">
                {dish.stock} {dish.stock === 1 ? 'ración' : 'raciones'}
              </span>
              {ingCount > 0 ? (
                <span className="rounded-md bg-[#eff4f8] px-2 py-0.5 text-xs font-semibold tabular-nums text-[#112747]">
                  Coste: {CURRENCY_2.format(dishEscandallo?.costeTotalRacionRedondeado ?? 0)} ({ingCount} ingr.)
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => onEdit(dish)}
                  className="text-xs font-semibold text-[#112747] underline"
                >
                  + Vincular receta
                </button>
              )}
            </div>
            <StockBadge stock={dish.stock} />
          </div>
        </div>
      </div>
    </li>
  )
}
