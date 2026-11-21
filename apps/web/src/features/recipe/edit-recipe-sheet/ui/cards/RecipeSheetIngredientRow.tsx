import type { Ingredient } from '@/entities/ingredient'
import { getCompatibleUnits, type computeDraftEscandallo, type DraftDishRecipeLine, type RecipeUnit } from '@/entities/recipe'
import { Input, Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui'
import { HugeiconsIcon } from '@hugeicons/react'
import { Delete02Icon } from '@hugeicons/core-free-icons'
import { amount, cellLabel, money, percent, recipeColumns, warningText } from './formatters'

type DraftEscandalloLine = ReturnType<typeof computeDraftEscandallo>['lines'][number]

interface RecipeSheetIngredientRowProps {
  line: DraftDishRecipeLine
  costLine: DraftEscandalloLine
  ingredient: Ingredient | undefined
  pending: boolean
  onChangeLine: (localId: string, patch: Partial<DraftDishRecipeLine>) => void
  onRemoveLine: (localId: string) => void
}

const LOSS_LABELS = { receta: 'Específica', ingrediente: 'Habitual', ninguna: 'Sin merma' } as const

export function RecipeSheetIngredientRow({
  line,
  costLine,
  ingredient,
  pending,
  onChangeLine,
  onRemoveLine,
}: RecipeSheetIngredientRowProps) {
  const units = getCompatibleUnits(ingredient?.unidad_de_masa ?? line.unidad)
  const warnings = costLine.warnings.map((warning) => warningText[warning])
  if (costLine.cantidadUtil <= 0) warnings.push('Introduce una cantidad útil mayor que cero')
  const name = ingredient?.nombre ?? 'Ingrediente no disponible'
  const lossSource = LOSS_LABELS[costLine.mermaOrigen]

  return (
    <li className={`grid grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] items-start gap-x-3 gap-y-2 px-4 py-3 text-sm sm:px-5 ${recipeColumns}`}>
      <div className="min-w-0">
        <p className="wrap-anywhere font-semibold text-[#142238]">{name}</p>
        {warnings.length > 0 && (
          <p className="mt-0.5 text-[11px] font-medium text-[#962b29]">{warnings.join('. ')}</p>
        )}
      </div>

      <div className="min-w-0">
        <span className={cellLabel}>Cantidad útil</span>
        <div className="flex items-center gap-1">
          <Input
            aria-label={`Cantidad útil de ${name}`}
            inputMode="decimal"
            value={line.cantidad}
            disabled={pending}
            onChange={(event) => onChangeLine(line.localId, { cantidad: event.target.value })}
            className="h-11 min-w-0 rounded-lg @min-[36rem]/receta:h-9 text-sm tabular-nums"
          />
          <Select
            value={line.unidad}
            disabled={pending}
            onValueChange={(unidad) => {
              if (unidad) onChangeLine(line.localId, { unidad: unidad as RecipeUnit })
            }}
          >
            <SelectTrigger
              size="sm"
              aria-label={`Unidad de ${name}`}
              className="min-h-11 shrink-0 rounded-lg bg-background px-2 text-sm @min-[36rem]/receta:min-h-9"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-[#dce3e9]">
              <SelectGroup>
                {units.map((unit) => (
                  <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="min-w-0">
        <span className={cellLabel}>Merma (%)</span>
        <div className="space-y-0.5">
          <div className="relative flex items-center">
            <Input
              aria-label={`Merma específica de ${name} en porcentaje`}
              inputMode="decimal"
              placeholder={ingredient?.merma_habitual != null ? String(ingredient.merma_habitual) : '0'}
              value={line.merma_override}
              disabled={pending}
              onChange={(event) => onChangeLine(line.localId, { merma_override: event.target.value })}
              className="h-11 min-w-0 rounded-lg @min-[36rem]/receta:h-9 pr-5 text-right text-sm tabular-nums"
            />
            <span className="pointer-events-none absolute right-1.5 text-[11px] text-[#64748b]" aria-hidden="true">
              %
            </span>
          </div>
          <span className="block text-xs text-[#64748b]">
            {lossSource}: {costLine.warnings.includes('MERMA_INVALIDA') ? '—' : percent(costLine.mermaAplicadaPct)}
          </span>
        </div>
      </div>

      <div className="col-start-2 row-start-1 text-right @min-[36rem]/receta:col-start-4">
        <span className={cellLabel}>Coste</span>
        <strong className="block font-semibold tabular-nums text-[#142238]">{money(costLine.costeLinea)}</strong>
        {costLine.pesoCostePct > 0 && (
          <div className="mt-1 flex items-center justify-end gap-1.5">
            <div className="hidden h-1.5 w-12 overflow-hidden rounded-full bg-[#eff4f8] @min-[36rem]/receta:block">
              <div
                className="h-full rounded-full bg-[#112747]"
                style={{ width: `${Math.min(100, costLine.pesoCostePct)}%` }}
              />
            </div>
            <span className="text-[11px] font-medium tabular-nums text-[#55667e]">
              {percent(costLine.pesoCostePct)}
            </span>
          </div>
        )}
      </div>

      <div className="col-span-full flex flex-wrap items-center justify-between gap-x-4 text-xs text-[#55667e]">
        <div className="flex flex-wrap gap-x-4 gap-y-1 tabular-nums">
          <span>Cantidad bruta: {amount(costLine.cantidadBrutaReceta, line.unidad)}</span>
          <span>
            Precio de compra: {money(costLine.precioCompraUnitario)}
            {costLine.precioCompraUnitario !== null ? ` / ${costLine.unidadCompra}` : ''}
          </span>
        </div>
        <button
          type="button"
          aria-label={`Quitar ${name}`}
          disabled={pending}
          onClick={() => onRemoveLine(line.localId)}
          className="inline-flex min-h-11 items-center gap-1 text-xs text-[#55667e] hover:text-[#962b29] hover:underline disabled:opacity-50 @min-[36rem]/receta:min-h-8"
        >
          <HugeiconsIcon icon={Delete02Icon} className="size-3" />
          <span>Quitar</span>
        </button>
      </div>
    </li>
  )
}
