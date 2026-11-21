'use client'

import { useMemo, useState } from 'react'
import { Button, Input } from '@/shared/ui'
import { HugeiconsIcon } from '@hugeicons/react'
import { SparklesIcon } from '@hugeicons/core-free-icons'
import type { RecipeEscandalloResult } from '../../model/escandallo'
import { formatEur } from './DishRecipeLineRow'

interface DishProfitabilityBreakdownCardProps {
  escandallo: RecipeEscandalloResult
  onApplyPrice: (formattedPrice: string) => void
}

export function DishProfitabilityBreakdownCard({
  escandallo,
  onApplyPrice,
}: DishProfitabilityBreakdownCardProps) {
  const [targetFoodCostPct, setTargetFoodCostPct] = useState<string>('30')

  const parsedTarget = useMemo(() => {
    const n = Number(targetFoodCostPct.replace(',', '.'))
    return Number.isFinite(n) && n > 0 && n < 100 ? n : 30
  }, [targetFoodCostPct])

  const suggestedPriceNumber = useMemo(() => {
    if (escandallo.costeTotalRacion <= 0 || parsedTarget <= 0) return 0
    return escandallo.costeTotalRacion / (parsedTarget / 100)
  }, [escandallo.costeTotalRacion, parsedTarget])

  const formattedSuggestedPrice = useMemo(() => {
    if (suggestedPriceNumber <= 0) return ''
    return suggestedPriceNumber.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
  }, [suggestedPriceNumber])

  const ingredientBreakdown = useMemo(() => {
    const total = escandallo.costeTotalRacion
    return [...escandallo.lines]
      .filter((l) => (l.costeLinea ?? 0) > 0)
      .sort((a, b) => (b.costeLinea ?? 0) - (a.costeLinea ?? 0))
      .map((l) => {
        const cost = l.costeLinea ?? 0
        return {
          id: l.id ?? l.ingredienteId,
          nombre: l.nombre,
          coste: cost,
          percentage: total > 0 ? (cost / total) * 100 : 0,
        }
      })
  }, [escandallo.lines, escandallo.costeTotalRacion])

  return (
    <>
      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <HugeiconsIcon icon={SparklesIcon} className="size-4 text-amber-500" />
            <h4 className="text-xs font-semibold text-[#142238]">Simulador de PVP y Rentabilidad</h4>
          </div>
          <span className="text-[11px] text-[#55667e]">
            Coste base: <strong className="text-[#142238]">{formatEur(escandallo.costeTotalRacion)}</strong>
          </span>
        </div>

        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[#55667e]">Objetivo Food Cost:</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setTargetFoodCostPct('30')}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                  targetFoodCostPct === '30'
                    ? 'bg-[#112747] text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-[#55667e] hover:bg-slate-100'
                }`}
              >
                30 % (Estándar)
              </button>
              <div className="relative flex items-center">
                <Input
                  type="number"
                  min="5"
                  max="95"
                  step="1"
                  value={targetFoodCostPct}
                  onChange={(e) => setTargetFoodCostPct(e.target.value)}
                  className="h-7 w-16 rounded-lg border-slate-200 bg-white px-2 py-0.5 text-xs text-right tabular-nums pr-5 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <span className="pointer-events-none absolute right-2 text-[11px] text-slate-400">%</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2.5 pt-1 sm:pt-0">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block leading-tight">PVP recomendado</span>
              <span className="text-sm font-bold text-[#142238] tabular-nums">{formatEur(suggestedPriceNumber)}</span>
            </div>
            {suggestedPriceNumber > 0 ? (
              <Button
                type="button"
                size="sm"
                onClick={() => onApplyPrice(formattedSuggestedPrice)}
                className="h-8 rounded-full bg-[#142238] hover:bg-[#1f304c] text-white text-xs px-3 font-semibold shadow-xs"
              >
                Aplicar a carta
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {ingredientBreakdown.length > 0 ? (
        <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#142238]">Desglose de impacto por ingrediente</span>
            <span className="text-[11px] text-[#55667e]">
              % del coste total ({formatEur(escandallo.costeTotalRacion)})
            </span>
          </div>

          <div className="space-y-2 pt-1">
            {ingredientBreakdown.map((item) => (
              <div key={item.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-[#142238] truncate max-w-[200px] sm:max-w-xs">{item.nombre}</span>
                  <div className="flex items-center gap-2 tabular-nums">
                    <span className="font-semibold text-[#142238]">{formatEur(item.coste)}</span>
                    <span className="text-[11px] text-[#55667e] w-12 text-right">{item.percentage.toFixed(1)} %</span>
                  </div>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#142238] transition-all"
                    style={{ width: `${Math.min(100, Math.max(0, item.percentage))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </>
  )
}
