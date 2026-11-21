'use client'

import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon } from '@hugeicons/core-free-icons'
import { formatEur } from './DishRecipeLineRow'

export function DishRecipeEmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
      <p className="text-xs text-[#55667e]">
        Aún no has añadido ingredientes a la receta de este plato.
      </p>
      <p className="text-[11px] text-slate-400 mt-0.5">
        Cada ingrediente se calcula para <strong>1 ración</strong>.
      </p>
    </div>
  )
}

interface DishRecipeSummaryBarProps {
  linesCount: number
  costeTotalRacion: number
  showAddButton: boolean
  addDisabled: boolean
  onOpenAddForm: () => void
  onGoToProfitability?: () => void
}

export function DishRecipeSummaryBar({
  linesCount,
  costeTotalRacion,
  showAddButton,
  addDisabled,
  onOpenAddForm,
  onGoToProfitability,
}: DishRecipeSummaryBarProps) {
  return (
    <>
      {showAddButton && (
        <button
          type="button"
          onClick={onOpenAddForm}
          disabled={addDisabled}
          className="flex w-full items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white py-2.5 text-xs font-semibold text-[#142238] shadow-2xs hover:border-slate-300 hover:bg-slate-50/70 transition-all cursor-pointer disabled:opacity-50"
        >
          <HugeiconsIcon icon={Add01Icon} className="size-4 text-slate-500" />
          Añadir ingrediente
        </button>
      )}

      {linesCount > 0 && (
        <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2 text-xs text-[#55667e]">
          <span>Coste total de la ración:</span>
          <div className="flex items-center gap-2">
            <strong className="text-sm font-bold text-[#142238] tabular-nums">
              {formatEur(costeTotalRacion)}
            </strong>
            {onGoToProfitability && (
              <button
                type="button"
                onClick={onGoToProfitability}
                className="text-[11px] font-semibold text-sky-700 hover:underline cursor-pointer"
              >
                Ver rentabilidad →
              </button>
            )}
          </div>
        </div>
      )}
    </>
  )
}
