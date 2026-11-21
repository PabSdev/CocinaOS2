'use client'

import { useMemo } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Coins01Icon } from '@hugeicons/core-free-icons'
import type { RecipeEscandalloResult } from '../model/escandallo'
import { formatEur } from './components/DishRecipeLineRow'
import { DishProfitabilityBreakdownCard } from './components/DishProfitabilityBreakdownCard'

interface DishProfitabilityTabProps {
  escandallo: RecipeEscandalloResult
  dishPriceGross: string
  onApplyPrice: (formattedPrice: string) => void
  linesCount: number
}

export function DishProfitabilityTab({
  escandallo,
  dishPriceGross,
  onApplyPrice,
  linesCount,
}: DishProfitabilityTabProps) {
  const foodCostBadge = useMemo(() => {
    const fc = escandallo.foodCostPct
    if (fc == null) {
      return {
        label: 'Sin PVP',
        variant: 'secondary' as const,
        textColor: 'text-slate-600',
        bgColor: 'bg-slate-100',
      }
    }
    if (fc <= 30) {
      return {
        label: 'Óptimo (≤ 30 %)',
        variant: 'default' as const,
        textColor: 'text-emerald-700',
        bgColor: 'bg-emerald-50 border-emerald-200',
      }
    }
    if (fc <= 35) {
      return {
        label: 'Ajustado (30–35 %)',
        variant: 'outline' as const,
        textColor: 'text-amber-700',
        bgColor: 'bg-amber-50 border-amber-200',
      }
    }
    return {
      label: 'Alto (> 35 %)',
      variant: 'destructive' as const,
      textColor: 'text-rose-700',
      bgColor: 'bg-rose-50 border-rose-200',
    }
  }, [escandallo.foodCostPct])

  if (linesCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center">
        <HugeiconsIcon icon={Coins01Icon} className="size-8 text-slate-400 mb-2" />
        <h4 className="text-sm font-semibold text-[#142238]">Aún no hay ingredientes en la receta</h4>
        <p className="mt-1 text-xs text-[#55667e] max-w-sm">
          Añade ingredientes en la pestaña <strong>Receta</strong> para calcular el coste por ración,
          el margen bruto y simular el precio de venta recomendado.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 4 Métricas clave en rejilla */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {/* Coste 1 Ración */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-xs">
          <span className="text-[11px] font-medium text-[#55667e] block">Coste 1 ración</span>
          <p className="mt-1 text-base font-bold text-[#142238] tabular-nums">
            {formatEur(escandallo.costeTotalRacion)}
          </p>
          <span className="text-[10px] text-slate-400">Suma con mermas</span>
        </div>

        {/* PVP Actual */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-xs">
          <span className="text-[11px] font-medium text-[#55667e] block">PVP carta</span>
          <p className="mt-1 text-base font-bold text-[#142238] tabular-nums">
            {dishPriceGross.trim() ? dishPriceGross : '0,00 €'}
          </p>
          <span className="text-[10px] text-slate-400">PVP en General</span>
        </div>

        {/* Margen Bruto */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-xs">
          <span className="text-[11px] font-medium text-[#55667e] block">Margen bruto</span>
          <p className="mt-1 text-base font-bold text-emerald-700 tabular-nums">
            {formatEur(escandallo.margenBrutoRacion)}
          </p>
          <span className="text-[10px] text-slate-400">
            {escandallo.margenBrutoPct != null ? `${escandallo.margenBrutoPct.toFixed(1)} % s/PVP` : '—'}
          </span>
        </div>

        {/* Food Cost % */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-xs">
          <span className="text-[11px] font-medium text-[#55667e] block">Food Cost actual</span>
          <p className="mt-1 text-base font-bold text-[#142238] tabular-nums">
            {escandallo.foodCostPct != null ? `${escandallo.foodCostPct.toFixed(1)} %` : '—'}
          </p>
          <span
            className={`inline-block mt-0.5 rounded-full px-1.5 py-0.2 text-[10px] font-semibold border ${foodCostBadge.bgColor} ${foodCostBadge.textColor}`}
          >
            {foodCostBadge.label}
          </span>
        </div>
      </div>

      <DishProfitabilityBreakdownCard escandallo={escandallo} onApplyPrice={onApplyPrice} />
    </div>
  )
}
