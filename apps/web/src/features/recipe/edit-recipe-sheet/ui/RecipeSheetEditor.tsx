'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import type { Dish } from '@/entities/dish'
import type { Ingredient } from '@/entities/ingredient'
import {
  calculateRecommendedDishPrice, computeDraftEscandallo, getCompatibleUnits,
  recipeItemsToDraftLines, saveRecipeSheet, validateAndBuildRecipePayload,
  type DraftDishRecipeLine, type RecipeSheet, type RecipeUnit,
} from '@/entities/recipe'
import { RecipeSheetHeaderCard } from './cards/RecipeSheetHeaderCard'
import { RecipeSheetIngredientsCard } from './cards/RecipeSheetIngredientsCard'
import { RecipeSheetKpisCard } from './cards/RecipeSheetKpisCard'

export function RecipeSheetEditor({ dishes, sheet, ingredients }: { dishes: Dish[]; sheet: RecipeSheet; ingredients: Ingredient[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [target, setTarget] = useState('30')
  const [vatRate, setVatRate] = useState<number>(10)
  const [price, setPrice] = useState(sheet.dish.precio ?? '')
  const [lines, setLines] = useState(() => recipeItemsToDraftLines(sheet.lines))
  const [error, setError] = useState('')
  const [ingredientQuery, setIngredientQuery] = useState('')

  const dirty =
    price !== (sheet.dish.precio ?? '') ||
    JSON.stringify(lines) !== JSON.stringify(recipeItemsToDraftLines(sheet.lines))

  const result = computeDraftEscandallo(lines, ingredients, price, vatRate)
  const validation = validateAndBuildRecipePayload(lines)
  const partial = result.incompleto || !validation.valid
  const canShowMargin = lines.length > 0 && !partial
  const dishOptions = dishes.map(({ $id, nombre }) => ({ value: $id, label: nombre }))
  const available = ingredients.filter((ing) => !lines.some((line) => line.ingrediente_id === ing.$id))

  function changeLine(localId: string, patch: Partial<DraftDishRecipeLine>) {
    setLines((curr) => curr.map((line) => (line.localId === localId ? { ...line, ...patch } : line)))
  }

  function addIngredient(ingredientId: string) {
    const ingredient = available.find((item) => item.$id === ingredientId)
    if (!ingredient) return
    const compatible = getCompatibleUnits(ingredient.unidad_de_masa)
    const unidad: RecipeUnit = compatible.includes('G') ? 'G' : compatible.includes('ML') ? 'ML' : compatible[0]
    const cantidad = unidad === 'G' || unidad === 'ML' ? '100' : '1'
    setLines((curr) => [
      ...curr,
      { localId: crypto.randomUUID(), ingrediente_id: ingredient.$id, cantidad, unidad, merma_override: '' },
    ])
  }

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending || !dirty) return
    if (!validation.valid) return setError(validation.error ?? 'Revisa las cantidades de la receta.')
    setError('')
    startTransition(async () => {
      try {
        const savedIds = new Set(sheet.lines.map((line) => line.$id))
        const response = await saveRecipeSheet({
          dishId: sheet.dish.$id,
          price,
          version: sheet.version,
          lines: validation.payload.map((line, index) => {
            const id = lines[index].localId
            return savedIds.has(id) ? { ...line, id } : line
          }),
        })
        if (response.error) setError(response.error)
        else toast.success('Escandallo guardado correctamente.')
      } catch {
        setError('No se pudo confirmar el guardado. El borrador sigue disponible.')
      }
    })
  }

  const cost = lines.length ? result.costeTotalRacion : null
  const targetPct = Number(target.replace(',', '.'))
  const validTarget = Number.isFinite(targetPct) && targetPct > 0 && targetPct < 100
  const suggested =
    canShowMargin && validTarget
      ? (calculateRecommendedDishPrice({
          costeTotalRacion: result.costeTotalRacion,
          targetFoodCostPct: targetPct,
          ivaPct: vatRate,
        })?.pvpRecomendadoConIva ?? null)
      : null
  const recommendedPrice = suggested !== null && Number.isFinite(suggested) ? suggested : null
  const impact = result.lines.filter((l) => l.costeLinea !== null).sort((a, b) => (b.costeLinea ?? 0) - (a.costeLinea ?? 0))

  return (
    <div className="@container/escandallo space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#142238]">Escandallos y recetas</h1>
        <p className="mt-1 text-sm text-[#55667e]">Calcula el coste por ración y simula el precio de venta.</p>
      </div>
      <form onSubmit={save} className="space-y-6" aria-busy={pending}>
        <RecipeSheetHeaderCard
          dish={sheet.dish} dishOptions={dishOptions} dirty={dirty} pending={pending} linesCount={lines.length} error={error}
          onSelectDish={(id) => {
            if (dirty && !window.confirm('¿Descartar los cambios de este plato?')) return
            startTransition(() => router.push(`/escandallos?plato=${encodeURIComponent(id)}`))
          }}
          onDiscard={() => { setPrice(sheet.dish.precio ?? ''); setLines(recipeItemsToDraftLines(sheet.lines)); setError('') }}
        />
        <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 @min-[62rem]/escandallo:grid-cols-[minmax(0,1fr)_23rem]">
          <RecipeSheetIngredientsCard
            lines={lines} resultLines={result.lines} impact={impact} ingredients={ingredients} available={available}
            ingredientQuery={ingredientQuery} pending={pending} cost={cost}
            costeNetoUtilRacion={result.costeNetoUtilRacion} costeMermaRacion={result.costeMermaRacion}
            onIngredientQueryChange={setIngredientQuery} onAddIngredient={addIngredient} onChangeLine={changeLine}
            onRemoveLine={(localId) => setLines((curr) => curr.filter((item) => item.localId !== localId))}
          />
          <aside
            aria-label="Food Cost objetivo y métricas de ración"
            className="min-w-0 space-y-3.5 @min-[62rem]/escandallo:sticky @min-[62rem]/escandallo:top-4"
          >
            <RecipeSheetKpisCard
              target={target} targetPct={targetPct} validTarget={validTarget} recommendedPrice={recommendedPrice}
              canShowMargin={canShowMargin} cost={cost} price={price} pending={pending}
              ingresoNetoSinIva={result.ingresoNetoSinIva} cuotaIva={result.cuotaIva}
              margenBrutoRacion={result.margenBrutoRacion} margenBrutoPct={result.margenBrutoPct}
              vatRate={vatRate} onVatRateChange={setVatRate}
              onTargetChange={setTarget} onPriceChange={setPrice}
              onApplyRecommendedPrice={() => {
                if (recommendedPrice !== null) {
                  setPrice(recommendedPrice.toFixed(2).replace('.', ','))
                  toast.success('PVP recomendado aplicado al campo de carta.')
                }
              }}
            />
          </aside>
        </div>
      </form>
    </div>
  )
}
