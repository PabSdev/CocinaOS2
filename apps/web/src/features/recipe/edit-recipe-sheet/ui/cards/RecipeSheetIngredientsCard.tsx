import { Combobox } from '@base-ui/react/combobox'
import Link from 'next/link'
import type { Ingredient } from '@/entities/ingredient'
import type { computeDraftEscandallo, DraftDishRecipeLine } from '@/entities/recipe'
import { Input } from '@/shared/ui'
import { impactColors, percent, recipeColumns, summaryMoney } from './formatters'
import { RecipeSheetIngredientRow } from './RecipeSheetIngredientRow'

type DraftEscandalloLine = ReturnType<typeof computeDraftEscandallo>['lines'][number]

interface RecipeSheetIngredientsCardProps {
  lines: DraftDishRecipeLine[]
  resultLines: DraftEscandalloLine[]
  impact: DraftEscandalloLine[]
  ingredients: Ingredient[]
  available: Ingredient[]
  ingredientQuery: string
  pending: boolean
  cost: number | null
  costeNetoUtilRacion: number | null
  costeMermaRacion: number | null
  onIngredientQueryChange: (value: string) => void
  onAddIngredient: (ingredientId: string) => void
  onChangeLine: (localId: string, patch: Partial<DraftDishRecipeLine>) => void
  onRemoveLine: (localId: string) => void
}

export function RecipeSheetIngredientsCard({
  lines,
  resultLines,
  impact,
  ingredients,
  available,
  ingredientQuery,
  pending,
  cost,
  costeNetoUtilRacion,
  costeMermaRacion,
  onIngredientQueryChange,
  onAddIngredient,
  onChangeLine,
  onRemoveLine,
}: RecipeSheetIngredientsCardProps) {
  return (
    <div className="space-y-4">
      <section aria-labelledby="recipe-lines-heading" className="@container/receta rounded-xl border border-[#dce3e9] bg-white">
        <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3 px-4 py-4 sm:px-5">
          <div>
            <h2 id="recipe-lines-heading" className="text-lg font-semibold text-[#142238]">Receta por ración</h2>
            <p className="mt-1 text-sm text-[#55667e]">
              Precios de <Link href="/ingredientes" className="underline underline-offset-2">Ingredientes</Link>
            </p>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-[#55667e]">Coste por ración</span>
            <strong className="text-xl font-semibold tabular-nums text-[#142238]">{summaryMoney(cost)}</strong>
          </div>
          {available.length > 0 && (
            <div className="w-full @min-[36rem]/receta:w-52">
              <Combobox.Root<Ingredient>
                items={available}
                itemToStringLabel={(ingredient) => ingredient.nombre}
                value={null}
                inputValue={ingredientQuery}
                onInputValueChange={onIngredientQueryChange}
                disabled={pending}
                autoHighlight
                onValueChange={(ingredient) => {
                  if (ingredient) {
                    onAddIngredient(ingredient.$id)
                    onIngredientQueryChange('')
                  }
                }}
              >
                <Combobox.Input
                  aria-label="Buscar ingrediente para añadir"
                  placeholder="Buscar ingrediente…"
                  render={<Input className="min-h-11 rounded-lg bg-background" />}
                />
                <Combobox.Portal>
                  <Combobox.Positioner sideOffset={4} className="z-50">
                    <Combobox.Popup className="w-(--anchor-width) rounded-lg border bg-popover p-1 text-popover-foreground shadow-lg">
                      <Combobox.Empty className="px-2 py-2 text-sm text-muted-foreground">
                        No se encontraron ingredientes.
                      </Combobox.Empty>
                      <Combobox.List className="max-h-[min(16rem,var(--available-height))] overflow-y-auto">
                        {(ingredient: Ingredient) => (
                          <Combobox.Item
                            key={ingredient.$id}
                            value={ingredient}
                            className="cursor-pointer rounded-md px-2 py-2 text-sm wrap-anywhere data-highlighted:bg-accent data-highlighted:text-accent-foreground"
                          >
                            {ingredient.nombre}
                          </Combobox.Item>
                        )}
                      </Combobox.List>
                    </Combobox.Popup>
                  </Combobox.Positioner>
                </Combobox.Portal>
              </Combobox.Root>
            </div>
          )}
        </header>

        {/* Distribución visual del impacto en el coste a primera vista */}
        {impact.length > 0 && cost !== null && cost > 0 && (
          <div className="border-t border-[#edf1f5] bg-[#fafbfc]/70 px-4 py-3 sm:px-5">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="font-semibold text-[#142238]">Distribución del coste por materia prima</span>
              <span className="text-[11px] text-[#55667e]">
                Top {Math.min(3, impact.length)} concentra el{' '}
                <strong className="font-semibold tabular-nums text-[#142238]">
                  {percent(impact.slice(0, 3).reduce((sum, item) => sum + item.pesoCostePct, 0))}
                </strong>
              </span>
            </div>
            <div
              aria-hidden="true"
              className="flex h-2.5 overflow-hidden rounded-full bg-[#eff4f8] gap-0.5"
            >
              {impact.map((line, index) => (
                <div
                  key={line.id ?? line.ingredienteId}
                  className={`h-full ${impactColors[index % impactColors.length]} transition-all`}
                  style={{ width: `${line.pesoCostePct}%` }}
                  title={`${line.nombre}: ${percent(line.pesoCostePct)} (${summaryMoney(line.costeLinea)})`}
                />
              ))}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#55667e]">
              {impact.slice(0, 4).map((line, index) => (
                <span key={line.id ?? line.ingredienteId} className="inline-flex items-center gap-1.5">
                  <span
                    aria-hidden="true"
                    className={`size-2 shrink-0 rounded-full ${impactColors[index % impactColors.length]}`}
                  />
                  <span className="max-w-[140px] truncate font-medium text-[#142238]">
                    {line.nombre}
                  </span>
                  <strong className="tabular-nums font-semibold text-[#55667e]">
                    {percent(line.pesoCostePct)}
                  </strong>
                </span>
              ))}
              {impact.length > 4 && (
                <span className="text-[#64748b]">
                  +{impact.length - 4} restantes (
                  {percent(impact.slice(4).reduce((sum, item) => sum + item.pesoCostePct, 0))})
                </span>
              )}
            </div>
          </div>
        )}

        {lines.length === 0 ? (
          <p className="border-t border-[#edf1f5] px-4 py-6 text-sm text-[#55667e] sm:px-5">
            {available.length > 0 ? 'Añade el primer ingrediente para calcular el coste por ración.' : 'Este plato aún no tiene ingredientes.'}
          </p>
        ) : (
          <>
            <div aria-hidden="true" className={`hidden gap-x-3 border-t border-[#edf1f5] px-5 py-2 text-xs font-medium text-[#55667e] @min-[36rem]/receta:grid ${recipeColumns}`}>
              <span>Ingrediente</span>
              <span>Cantidad útil</span>
              <span>Merma (%)</span>
              <span className="text-right">Coste</span>
            </div>
            <ul aria-label="Ingredientes de la receta" className="divide-y divide-[#edf1f5] border-t border-[#edf1f5]">
              {lines.map((line, index) => (
                <RecipeSheetIngredientRow
                  key={line.localId}
                  line={line}
                  costLine={resultLines[index]}
                  ingredient={ingredients.find((item) => item.$id === line.ingrediente_id)}
                  pending={pending}
                  onChangeLine={onChangeLine}
                  onRemoveLine={onRemoveLine}
                />
              ))}
            </ul>
          </>
        )}

        <footer className="flex flex-wrap gap-x-5 gap-y-1 rounded-b-xl border-t border-[#edf1f5] bg-[#fafbfc] px-4 py-3 text-xs text-[#55667e] sm:px-5">
          <span>Coste útil neto: <strong className="tabular-nums text-[#142238]">{summaryMoney(costeNetoUtilRacion)}</strong></span>
          <span>Coste de merma: <strong className="tabular-nums text-[#142238]">{summaryMoney(costeMermaRacion)}</strong></span>
        </footer>
      </section>
    </div>
  )
}
