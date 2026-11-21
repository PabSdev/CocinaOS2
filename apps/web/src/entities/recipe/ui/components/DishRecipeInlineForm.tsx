'use client'

import { Button, Input } from '@/shared/ui'
import { formatPurchasePrice } from '@/shared/lib'
import { HugeiconsIcon } from '@hugeicons/react'
import { Cancel01Icon } from '@hugeicons/core-free-icons'
import { getCompatibleUnits } from '../../model/escandallo-operations'
import type { RecipeIngredient } from '../../model/recipe-draft'
import type { RecipeUnit } from '../../model/types'

export interface DishRecipeInlineFormProps {
  title: string
  submitLabel: string
  ingredients: RecipeIngredient[]
  selectedIngredient: RecipeIngredient | undefined
  formIngredientId: string
  formCantidad: string
  formUnidad: RecipeUnit
  formMerma: string
  formError: string | null
  onSelectIngredient: (ingId: string) => void
  onChangeCantidad: (val: string) => void
  onChangeUnidad: (val: RecipeUnit) => void
  onChangeMerma: (val: string) => void
  onCancel: () => void
  onSave: () => void
}

export function DishRecipeInlineForm(props: DishRecipeInlineFormProps) {
  const {
    title,
    submitLabel,
    ingredients,
    selectedIngredient,
    formIngredientId,
    formCantidad,
    formUnidad,
    formMerma,
    formError,
    onSelectIngredient,
    onChangeCantidad,
    onChangeUnidad,
    onChangeMerma,
    onCancel,
    onSave,
  } = props

  const compatibleFormUnits = selectedIngredient
    ? getCompatibleUnits(selectedIngredient.unidad_de_masa)
    : (['G', 'KG', 'ML', 'L'] as RecipeUnit[])

  return (
    <div className="rounded-2xl border-2 border-[#142238] bg-white p-3.5 shadow-sm space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <span className="text-xs font-semibold text-[#142238]">{title}</span>
        <button type="button" onClick={onCancel} className="text-slate-400 hover:text-slate-600 cursor-pointer">
          <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-4">
        <div className="sm:col-span-2 space-y-1">
          <label className="text-[11px] font-medium text-[#55667e]">Ingrediente</label>
          <select
            value={formIngredientId}
            onChange={(e) => onSelectIngredient(e.target.value)}
            className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-[#142238] outline-none focus:border-[#142238]"
          >
            {ingredients.map((item) => (
              <option key={item.$id} value={item.$id}>
                {item.nombre} ({formatPurchasePrice(item.precio_compra ?? null, item.unidad_de_masa)})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-medium text-[#55667e]">Cantidad neta</label>
          <div className="flex gap-1">
            <Input
              type="number"
              min="0.001"
              step="any"
              value={formCantidad}
              onChange={(e) => onChangeCantidad(e.target.value)}
              className="h-9 rounded-xl border-slate-200 text-xs tabular-nums"
            />
            <select
              value={formUnidad}
              onChange={(e) => onChangeUnidad(e.target.value as RecipeUnit)}
              className="h-9 rounded-xl border border-slate-200 bg-white px-2 text-xs font-medium text-[#142238] outline-none"
            >
              {compatibleFormUnits.map((u) => (
                <option key={u} value={u}>
                  {u.toLowerCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-medium text-[#55667e]">% Merma</label>
          <div className="relative flex items-center">
            <Input
              type="number"
              min="0"
              max="99.9"
              step="0.5"
              placeholder="0"
              value={formMerma}
              onChange={(e) => onChangeMerma(e.target.value)}
              className="h-9 rounded-xl border-slate-200 text-xs tabular-nums pr-6"
            />
            <span className="pointer-events-none absolute right-2 text-[11px] text-slate-400">%</span>
          </div>
        </div>
      </div>

      {formError && <p className="text-xs font-medium text-rose-600">{formError}</p>}

      <div className="flex items-center justify-end gap-2 pt-1">
        <Button type="button" variant="outline" size="sm" onClick={onCancel} className="h-8 rounded-full text-xs px-3">
          Cancelar
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={onSave}
          className="h-8 rounded-full bg-[#142238] hover:bg-[#1f304c] text-white text-xs px-4"
        >
          {submitLabel}
        </Button>
      </div>
    </div>
  )
}
