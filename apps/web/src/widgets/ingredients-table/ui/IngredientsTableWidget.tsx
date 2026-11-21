'use client'

import { useDeferredValue, useMemo, useState, useTransition } from 'react'
import { getIngredients, type Ingredient } from '@/entities/ingredient'
import { CreateIngredientDialog } from '@/features/ingredient/create-ingredient'
import { EditIngredientDialog } from '@/features/ingredient/edit-ingredient'
import { DeleteIngredientDialog } from '@/features/ingredient/delete-ingredient'
import { type UnitFilter } from '@/features/ingredient/filter-ingredients'
import { toast } from 'sonner'
import { IngredientsMetricsGrid } from './components/IngredientsMetricsGrid'
import { IngredientsEmptyState, IngredientsTableHeader } from './components/IngredientsTableStates'
import { IngredientsDesktopTable } from './components/IngredientDesktopRow'
import { IngredientMobileCard } from './components/IngredientMobileCard'

interface IngredientsTableWidgetProps {
  initialIngredients: Ingredient[]
  initialLoadFailed?: boolean
}

export function IngredientsTableWidget({
  initialIngredients,
  initialLoadFailed = false,
}: IngredientsTableWidgetProps) {
  const [ingredients, setIngredients] = useState<Ingredient[]>(initialIngredients)
  const [loadFailed, setLoadFailed] = useState(initialLoadFailed)
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [selectedUnit, setSelectedUnit] = useState<UnitFilter>('all')
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null)
  const [deletingIngredient, setDeletingIngredient] = useState<Ingredient | null>(null)
  const [isPending, startTransition] = useTransition()

  const filteredIngredients = useMemo(() => {
    const query = deferredSearch.trim().toLocaleLowerCase('es')
    const filtered = ingredients.filter((ingredient) => {
      const matchesSearch =
        !query ||
        ingredient.nombre.toLocaleLowerCase('es').includes(query) ||
        ingredient.descripcion?.toLocaleLowerCase('es').includes(query)
      const matchesUnit = selectedUnit === 'all' || ingredient.unidad_de_masa === selectedUnit
      const matchesStock = !lowStockOnly || ingredient.stock <= 5
      return matchesSearch && matchesUnit && matchesStock
    })
    return lowStockOnly ? filtered.sort((a, b) => a.stock - b.stock) : filtered
  }, [deferredSearch, ingredients, lowStockOnly, selectedUnit])

  const metrics = useMemo(() => {
    let lowStock = 0
    let latestUpdate = ''
    for (const ingredient of ingredients) {
      if (ingredient.stock <= 5) lowStock += 1
      const timestamp = ingredient.$updatedAt || ingredient.$createdAt || ''
      if (timestamp > latestUpdate) latestUpdate = timestamp
    }
    return { total: ingredients.length, lowStock, latestUpdate }
  }, [ingredients])

  const handleRefresh = () => {
    startTransition(async () => {
      const response = await getIngredients()
      if (response.success && response.data) {
        setIngredients(response.data)
        setLoadFailed(false)
        toast.success('Inventario actualizado.')
        return
      }
      setLoadFailed(true)
      toast.error('No pudimos actualizar el inventario. Inténtalo de nuevo.')
    })
  }

  const handleCreated = (ingredient: Ingredient) => setIngredients((current) => [ingredient, ...current])
  const handleUpdated = (updated: Ingredient) =>
    setIngredients((current) => current.map((ingredient) => (ingredient.$id === updated.$id ? updated : ingredient)))
  const handleDeleted = (deletedId: string) =>
    setIngredients((current) => current.filter((ingredient) => ingredient.$id !== deletedId))

  const hasFilters = search.trim() !== '' || selectedUnit !== 'all' || lowStockOnly
  const searchIsPending = search !== deferredSearch
  const inventoryUnavailable = loadFailed && ingredients.length === 0

  return (
    <section className="space-y-5" aria-busy={isPending || searchIsPending}>
      <IngredientsMetricsGrid
        metrics={metrics}
        inventoryUnavailable={inventoryUnavailable}
        lowStockOnly={lowStockOnly}
        onToggleLowStock={() => setLowStockOnly((active) => !active)}
      />

      <div className="overflow-hidden rounded-[20px] border border-[#cbd7e3] bg-white shadow-[0_14px_36px_-24px_rgba(17,39,71,0.14)]">
        <IngredientsTableHeader
          totalCount={ingredients.length}
          inventoryUnavailable={inventoryUnavailable}
          isPending={isPending}
          loadFailed={loadFailed}
          hasIngredients={ingredients.length > 0}
          search={search}
          onSearchChange={setSearch}
          selectedUnit={selectedUnit}
          onUnitChange={setSelectedUnit}
          lowStockOnly={lowStockOnly}
          onLowStockChange={setLowStockOnly}
          onRefresh={handleRefresh}
          onOpenCreate={() => setCreateOpen(true)}
        />

        <div className="relative">
          {filteredIngredients.length === 0 ? (
            <IngredientsEmptyState
              loadFailed={loadFailed}
              isEmpty={ingredients.length === 0}
              isPending={isPending}
              onRefresh={handleRefresh}
              onOpenCreate={() => setCreateOpen(true)}
              onResetFilters={() => { setSearch(''); setSelectedUnit('all'); setLowStockOnly(false) }}
            />
          ) : (
            <>
              <ul className="divide-y divide-[#edf1f5] sm:hidden" aria-label="Ingredientes">
                {filteredIngredients.map((ingredient) => (
                  <IngredientMobileCard key={ingredient.$id} ingredient={ingredient} isPending={isPending} onEdit={setEditingIngredient} onDelete={setDeletingIngredient} />
                ))}
              </ul>
              <IngredientsDesktopTable ingredients={filteredIngredients} isPending={isPending} onEdit={setEditingIngredient} onDelete={setDeletingIngredient} />
            </>
          )}
        </div>

        {filteredIngredients.length > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#dce3e9] bg-[#fafbfc] px-4 py-3 text-xs text-[#55667e] sm:px-6" aria-live="polite">
            <span>
              {hasFilters
                ? `Mostrando ${filteredIngredients.length} de ${ingredients.length} ingredientes`
                : `Total: ${ingredients.length} ingredientes registrados`}
            </span>
            <span>Umbral de aviso: 5 unidades o menos</span>
          </div>
        ) : null}
      </div>

      <CreateIngredientDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={handleCreated} />
      <EditIngredientDialog ingredient={editingIngredient} open={Boolean(editingIngredient)} onOpenChange={(open) => !open && setEditingIngredient(null)} onUpdated={handleUpdated} />
      <DeleteIngredientDialog ingredient={deletingIngredient} open={Boolean(deletingIngredient)} onOpenChange={(open) => !open && setDeletingIngredient(null)} onDeleted={handleDeleted} />
    </section>
  )
}
