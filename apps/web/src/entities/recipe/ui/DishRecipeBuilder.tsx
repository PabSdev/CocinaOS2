'use client'

import { useMemo, useState } from 'react'
import { computeDraftEscandallo, type DraftDishRecipeLine, type RecipeIngredient } from '../model/recipe-draft'
import type { RecipeUnit } from '../model/types'
import { DishRecipeInlineForm } from './components/DishRecipeInlineForm'
import { DishRecipeLineRow } from './components/DishRecipeLineRow'
import { DishRecipeEmptyState, DishRecipeSummaryBar } from './components/DishRecipeSummaryBar'

interface DishRecipeBuilderProps {
  ingredients: RecipeIngredient[]
  lines: DraftDishRecipeLine[]
  onChange: (nextLines: DraftDishRecipeLine[]) => void
  disabled?: boolean
  onGoToProfitability?: () => void
}

const defaultUnitFor = (ing?: RecipeIngredient): RecipeUnit =>
  ing?.unidad_de_masa === 'KG' ? 'G' : ing?.unidad_de_masa === 'L' ? 'ML' : ing?.unidad_de_masa ?? 'G'

export function DishRecipeBuilder({
  ingredients,
  lines,
  onChange,
  disabled = false,
  onGoToProfitability,
}: DishRecipeBuilderProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingLineId, setEditingLineId] = useState<string | null>(null)
  const [formIngredientId, setFormIngredientId] = useState<string>('')
  const [formCantidad, setFormCantidad] = useState<string>('100')
  const [formUnidad, setFormUnidad] = useState<RecipeUnit>('G')
  const [formMerma, setFormMerma] = useState<string>('')
  const [formError, setFormError] = useState<string | null>(null)

  const ingredientMap = useMemo(() => new Map(ingredients.map((ing) => [ing.$id, ing])), [ingredients])
  const escandallo = useMemo(() => computeDraftEscandallo(lines, ingredients), [lines, ingredients])
  const lineCostMap = useMemo(
    () => new Map(escandallo.lines.filter((l) => l.id).map((l) => [l.id!, l.costeLinea])),
    [escandallo.lines]
  )

  const openAddForm = () => {
    const first = ingredients.find((ing) => !lines.some((l) => l.ingrediente_id === ing.$id)) ?? ingredients[0]
    setFormIngredientId(first?.$id ?? '')
    setFormCantidad('100')
    setFormUnidad(defaultUnitFor(first))
    setFormMerma(first?.merma_habitual != null ? String(first.merma_habitual) : '0')
    setFormError(null)
    setEditingLineId(null)
    setIsAdding(true)
  }

  const startEditLine = (line: DraftDishRecipeLine) => {
    setIsAdding(false)
    setEditingLineId(line.localId)
    setFormIngredientId(line.ingrediente_id)
    setFormCantidad(line.cantidad)
    setFormUnidad(line.unidad)
    setFormMerma(line.merma_override)
    setFormError(null)
  }

  const cancelInlineForm = () => {
    setIsAdding(false)
    setEditingLineId(null)
    setFormError(null)
  }

  const handleSelectIngredientInForm = (ingId: string) => {
    setFormIngredientId(ingId)
    setFormError(null)
    const ing = ingredientMap.get(ingId)
    if (ing) {
      setFormUnidad(defaultUnitFor(ing))
      if (formMerma === '' && ing.merma_habitual != null) setFormMerma(String(ing.merma_habitual))
    }
  }

  const handleSaveInlineForm = () => {
    if (!formIngredientId || !ingredientMap.has(formIngredientId)) return setFormError('Selecciona un ingrediente válido.')
    const parsedQty = Number(formCantidad.replace(',', '.'))
    if (!Number.isFinite(parsedQty) || parsedQty <= 0) return setFormError('Introduce una cantidad útil mayor que 0.')
    const trimmedMerma = formMerma.trim().replace(',', '.')
    if (trimmedMerma !== '') {
      const m = Number(trimmedMerma)
      if (!Number.isFinite(m) || m < 0 || m >= 100) return setFormError('La merma debe estar entre 0 % y 99,99 %.')
    }

    const patch = { ingrediente_id: formIngredientId, cantidad: String(parsedQty), unidad: formUnidad, merma_override: trimmedMerma }
    if (isAdding) {
      const idx = lines.findIndex((l) => l.ingrediente_id === formIngredientId)
      onChange(
        idx >= 0
          ? lines.map((l, i) => (i === idx ? { ...l, ...patch } : l))
          : [...lines, { localId: `recipe-line-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, ...patch }]
      )
    } else if (editingLineId) {
      onChange(lines.map((l) => (l.localId === editingLineId ? { ...l, ...patch } : l)))
    }
    cancelInlineForm()
  }

  const handleRemoveLine = (localId: string) => {
    if (editingLineId === localId) cancelInlineForm()
    onChange(lines.filter((l) => l.localId !== localId))
  }

  const sharedFormProps = {
    ingredients, selectedIngredient: ingredientMap.get(formIngredientId),
    formIngredientId, formCantidad, formUnidad, formMerma, formError,
    onSelectIngredient: handleSelectIngredientInForm, onChangeCantidad: setFormCantidad,
    onChangeUnidad: setFormUnidad, onChangeMerma: setFormMerma,
    onCancel: cancelInlineForm, onSave: handleSaveInlineForm,
  }

  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-[#142238]">Ingredientes · 1 ración</h4>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
          <span>{lines.length} {lines.length === 1 ? 'ingrediente' : 'ingredientes'}</span>
        </div>
      </div>

      <div className="space-y-2">
        {lines.length === 0 && !isAdding && <DishRecipeEmptyState />}
        {lines.map((line) =>
          editingLineId === line.localId ? (
            <DishRecipeInlineForm key={line.localId} title="Editar ingrediente" submitLabel="Actualizar" {...sharedFormProps} />
          ) : (
            <DishRecipeLineRow
              key={line.localId} line={line} ingredient={ingredientMap.get(line.ingrediente_id)}
              lineCost={lineCostMap.get(line.localId)} disabled={disabled}
              onEdit={startEditLine} onRemove={handleRemoveLine}
            />
          )
        )}
        {isAdding && <DishRecipeInlineForm title="Añadir ingrediente a 1 ración" submitLabel="Añadir a la receta" {...sharedFormProps} />}
      </div>

      <DishRecipeSummaryBar
        linesCount={lines.length} costeTotalRacion={escandallo.costeTotalRacion}
        showAddButton={!isAdding && !editingLineId} addDisabled={disabled || ingredients.length === 0}
        onOpenAddForm={openAddForm} onGoToProfitability={onGoToProfitability}
      />
    </div>
  )
}
