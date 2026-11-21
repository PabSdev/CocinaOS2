'use client'

import { useDeferredValue, useMemo, useState, useTransition } from 'react'
import { getIngredients, type Ingredient } from '@/entities/ingredient'
import { getDishes, type Dish } from '@/entities/dish'
import { getRecipeItems, type RecipeItem } from '@/entities/recipe'
import { CreateDishDialog } from '@/features/dish/create-dish'
import { EditDishDialog } from '@/features/dish/edit-dish'
import { DeleteDishDialog } from '@/features/dish/delete-dish'
import { type PhotoFilter } from '@/features/dish/filter-dishes'
import { toast } from 'sonner'
import { DishesMetricsGrid } from './components/DishesMetricsGrid'
import { DishesEmptyState, DishesTableHeader } from './components/DishesTableStates'
import { DishesDesktopTable } from './components/DishDesktopRow'
import { DishMobileCard } from './components/DishMobileCard'
import { buildEscandalloByDishId, computeDishesMetrics, filterAndSortDishes } from './components/dishesTable.helpers'

interface DishesTableWidgetProps {
  initialDishes: Dish[]
  initialIngredients?: Ingredient[]
  initialRecipeItems?: RecipeItem[]
  initialLoadFailed?: boolean
}

export function DishesTableWidget({
  initialDishes,
  initialIngredients = [],
  initialRecipeItems = [],
  initialLoadFailed = false,
}: DishesTableWidgetProps) {
  const [dishes, setDishes] = useState<Dish[]>(initialDishes)
  const [ingredients, setIngredients] = useState<Ingredient[]>(initialIngredients)
  const [recipeItems, setRecipeItems] = useState<RecipeItem[]>(initialRecipeItems)
  const [loadFailed, setLoadFailed] = useState(initialLoadFailed)
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [photoFilter, setPhotoFilter] = useState<PhotoFilter>('all')
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [editingDish, setEditingDish] = useState<Dish | null>(null)
  const [deletingDish, setDeletingDish] = useState<Dish | null>(null)
  const [isPending, startTransition] = useTransition()

  const ingredientMap = useMemo(() => new Map(ingredients.map((ing) => [ing.$id, ing])), [ingredients])
  const recipeByDishMap = useMemo(() => {
    const map = new Map<string, RecipeItem[]>()
    for (const item of recipeItems) {
      const list = map.get(item.plato_id)
      if (list) list.push(item)
      else map.set(item.plato_id, [item])
    }
    return map
  }, [recipeItems])

  const escandalloByDishId = useMemo(
    () => buildEscandalloByDishId(dishes, ingredientMap, recipeByDishMap),
    [dishes, ingredientMap, recipeByDishMap]
  )
  const filteredDishes = useMemo(
    () => filterAndSortDishes(dishes, deferredSearch, photoFilter, lowStockOnly),
    [deferredSearch, dishes, lowStockOnly, photoFilter]
  )
  const metrics = useMemo(() => computeDishesMetrics(dishes), [dishes])

  const handleRefresh = () => {
    startTransition(async () => {
      const [dishesRes, ingredientsRes, recipesRes] = await Promise.all([getDishes(), getIngredients(), getRecipeItems()])
      if (dishesRes.success && dishesRes.data) {
        setDishes(dishesRes.data)
        if (ingredientsRes.success && ingredientsRes.data) setIngredients(ingredientsRes.data)
        if (recipesRes.success && recipesRes.data) setRecipeItems(recipesRes.data)
        setLoadFailed(false)
        toast.success('Carta de platos y recetas actualizada.')
        return
      }
      setLoadFailed(true)
      toast.error('No se pudo actualizar la carta de platos. Inténtalo de nuevo.')
    })
  }

  const handleCreated = (dish: Dish, createdRecipeItems: RecipeItem[]) => {
    setDishes((current) => [dish, ...current])
    if (createdRecipeItems.length > 0) setRecipeItems((current) => [...createdRecipeItems, ...current])
  }
  const handleUpdated = (updated: Dish, updatedRecipeItems: RecipeItem[]) => {
    setDishes((current) => current.map((dish) => (dish.$id === updated.$id ? updated : dish)))
    setRecipeItems((current) => [...current.filter((item) => item.plato_id !== updated.$id), ...updatedRecipeItems])
  }
  const handleDeleted = (deletedId: string) => {
    setDishes((current) => current.filter((dish) => dish.$id !== deletedId))
    setRecipeItems((current) => current.filter((item) => item.plato_id !== deletedId))
  }

  const resetFilters = () => { setSearch(''); setPhotoFilter('all'); setLowStockOnly(false) }
  const hasFilters = search.trim() !== '' || photoFilter !== 'all' || lowStockOnly
  const searchIsPending = search !== deferredSearch
  const dishesUnavailable = loadFailed && dishes.length === 0
  const withPhotoActive = photoFilter === 'with-photo'

  return (
    <section className="space-y-4" aria-busy={isPending || searchIsPending}>
      <DishesMetricsGrid
        metrics={metrics}
        dishesUnavailable={dishesUnavailable}
        withPhotoActive={withPhotoActive}
        lowStockOnly={lowStockOnly}
        onTogglePhotoFilter={() => setPhotoFilter((current) => (current === 'with-photo' ? 'all' : 'with-photo'))}
        onToggleLowStock={() => setLowStockOnly((active) => !active)}
      />

      <div className="overflow-hidden rounded-[20px] border border-[#cbd7e3] bg-white shadow-[0_14px_36px_-24px_rgba(17,39,71,0.14)]">
        <DishesTableHeader
          filteredCount={filteredDishes.length} dishesUnavailable={dishesUnavailable} latestUpdate={metrics.latestUpdate}
          isPending={isPending} loadFailed={loadFailed} hasDishes={dishes.length > 0} search={search} onSearchChange={setSearch}
          photoFilter={photoFilter} onPhotoFilterChange={setPhotoFilter} lowStockOnly={lowStockOnly} onLowStockChange={setLowStockOnly}
          onRefresh={handleRefresh} onOpenCreate={() => setCreateOpen(true)}
        />

        {filteredDishes.length === 0 ? (
          <DishesEmptyState
            loadFailed={loadFailed} dishesUnavailable={dishesUnavailable} isEmpty={dishes.length === 0}
            isPending={isPending} onRefresh={handleRefresh} onOpenCreate={() => setCreateOpen(true)} onResetFilters={resetFilters}
          />
        ) : (
          <>
            <DishesDesktopTable dishes={filteredDishes} escandalloByDishId={escandalloByDishId} isPending={isPending} onEdit={setEditingDish} onDelete={setDeletingDish} />
            <ul className="divide-y divide-[#edf1f5] sm:hidden" aria-label="Platos en carta">
              {filteredDishes.map((dish) => (
                <DishMobileCard key={dish.$id} dish={dish} dishEscandallo={escandalloByDishId.get(dish.$id)} isPending={isPending} onEdit={setEditingDish} onDelete={setDeletingDish} />
              ))}
            </ul>
          </>
        )}

        {filteredDishes.length > 0 ? (
          <div className="flex items-center justify-between border-t border-[#edf1f5] bg-[#fafbfc] px-5 py-3 text-xs text-[#64748b] sm:px-6">
            <span>
              Mostrando <strong className="font-semibold text-[#142238]">{filteredDishes.length}</strong> de{' '}
              <strong className="font-semibold text-[#142238]">{dishes.length}</strong> platos
            </span>
            {hasFilters ? (
              <button type="button" onClick={resetFilters} className="font-medium text-[#112747] underline-offset-4 hover:underline">
                Restablecer vista
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      <CreateDishDialog open={createOpen} onOpenChange={setCreateOpen} ingredients={ingredients} onCreated={handleCreated} />
      <EditDishDialog dish={editingDish} open={Boolean(editingDish)} onOpenChange={(open) => { if (!open) setEditingDish(null) }} ingredients={ingredients} initialRecipeItems={editingDish ? (recipeByDishMap.get(editingDish.$id) ?? []) : []} onUpdated={handleUpdated} />
      <DeleteDishDialog dish={deletingDish} open={Boolean(deletingDish)} onOpenChange={(open) => { if (!open) setDeletingDish(null) }} onDeleted={handleDeleted} />
    </section>
  )
}
