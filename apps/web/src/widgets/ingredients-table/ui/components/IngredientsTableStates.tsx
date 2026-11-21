'use client'

import { Button } from '@/shared/ui'
import { IngredientFilters, type UnitFilter } from '@/features/ingredient/filter-ingredients'
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon, Alert02Icon, CookingPotIcon, RefreshIcon } from '@hugeicons/core-free-icons'

interface IngredientsTableHeaderProps {
  totalCount: number
  inventoryUnavailable: boolean
  isPending: boolean
  loadFailed: boolean
  hasIngredients: boolean
  search: string
  onSearchChange: (value: string) => void
  selectedUnit: UnitFilter
  onUnitChange: (value: UnitFilter) => void
  lowStockOnly: boolean
  onLowStockChange: (value: boolean) => void
  onRefresh: () => void
  onOpenCreate: () => void
}

export function IngredientsTableHeader({
  totalCount, inventoryUnavailable, isPending, loadFailed, hasIngredients,
  search, onSearchChange, selectedUnit, onUnitChange, lowStockOnly, onLowStockChange,
  onRefresh, onOpenCreate,
}: IngredientsTableHeaderProps) {
  return (
    <>
      <div className="space-y-4 border-b border-[#dce3e9] bg-[#eff4f8]/65 p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-lg font-semibold tracking-tight text-[#142238]">Registro de materias primas</h2>
              <span className="inline-flex items-center rounded-full border border-[#dce3e9] bg-white px-2.5 py-0.5 text-xs font-semibold tabular-nums text-[#55667e]">
                {totalCount} {totalCount === 1 ? 'ítem' : 'ítems'}
              </span>
            </div>
            <p className="mt-1 text-xs text-[#55667e] sm:text-sm">
              {inventoryUnavailable
                ? 'Sin datos disponibles. Vuelve a intentarlo.'
                : 'Cada estado se identifica con etiqueta textual y código semántico pastel.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:flex">
            <Button
              variant="outline"
              onClick={onRefresh}
              disabled={isPending}
              className="h-10 rounded-full border-[#cbd7e3] bg-white px-4 text-xs font-semibold text-[#112747] hover:bg-[#eff4f8] active:scale-[0.98]"
            >
              <HugeiconsIcon icon={RefreshIcon} className={`size-4 ${isPending ? 'animate-spin' : ''}`} strokeWidth={2} />
              {isPending ? 'Actualizando...' : 'Actualizar'}
            </Button>
            <Button
              onClick={onOpenCreate}
              disabled={isPending || inventoryUnavailable}
              className="h-10 rounded-full bg-[#112747] px-4 text-xs font-semibold text-white hover:bg-[#1d3b66] active:scale-[0.98] sm:px-5"
            >
              <HugeiconsIcon icon={Add01Icon} className="size-4" strokeWidth={2} />
              <span className="sm:hidden">Nuevo</span>
              <span className="hidden sm:inline">Nuevo ingrediente</span>
            </Button>
          </div>
        </div>

        <IngredientFilters
          search={search}
          onSearchChange={onSearchChange}
          selectedUnit={selectedUnit}
          onUnitChange={onUnitChange}
          lowStockOnly={lowStockOnly}
          onLowStockChange={onLowStockChange}
        />
      </div>

      {loadFailed && hasIngredients ? (
        <div
          role="alert"
          className="flex items-start gap-3 border-b border-[#8a5700]/20 bg-[#fbf3db] px-4 py-3 text-sm text-[#8a5700] sm:px-6"
        >
          <HugeiconsIcon icon={Alert02Icon} className="mt-0.5 size-4 shrink-0" strokeWidth={2} />
          <div className="flex-1">
            <p className="font-semibold">No pudimos cargar la versión más reciente.</p>
            <p className="mt-0.5 text-xs sm:text-sm">
              Mostramos los datos disponibles en caché. Vuelve a intentarlo cuando tengas conexión.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={onRefresh}
            disabled={isPending}
            className="hidden h-9 rounded-full border-[#8a5700]/30 bg-white px-4 text-xs font-semibold text-[#8a5700] hover:bg-[#fffcf5] sm:inline-flex"
          >
            Reintentar
          </Button>
        </div>
      ) : null}
    </>
  )
}

interface IngredientsEmptyStateProps {
  loadFailed: boolean
  isEmpty: boolean
  isPending: boolean
  onRefresh: () => void
  onOpenCreate: () => void
  onResetFilters: () => void
}

export function IngredientsEmptyState({
  loadFailed, isEmpty, isPending, onRefresh, onOpenCreate, onResetFilters,
}: IngredientsEmptyStateProps) {
  return (
    <div className="px-4 py-14 text-center sm:py-16">
      <div className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-[#e1e9f0] bg-[#eff4f8] text-[#112747]">
        <HugeiconsIcon icon={loadFailed ? Alert02Icon : CookingPotIcon} className="size-6" strokeWidth={1.8} />
      </div>
      <h3 className="mt-4 text-base font-semibold text-[#142238]">
        {loadFailed && isEmpty
          ? 'El inventario no está disponible'
          : isEmpty
            ? 'Tu inventario está vacío'
            : 'No encontramos coincidencias'}
      </h3>
      <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-[#55667e]">
        {loadFailed && isEmpty
          ? 'No podemos confirmar las existencias en este momento.'
          : isEmpty
            ? 'Añade las materias primas que utilizas para empezar a controlar existencias.'
            : 'Prueba otra búsqueda o limpia los filtros activos.'}
      </p>
      <div className="mt-5 flex justify-center">
        {loadFailed && isEmpty ? (
          <Button onClick={onRefresh} disabled={isPending} className="h-10 rounded-full bg-[#112747] px-5 text-xs font-semibold text-white hover:bg-[#1d3b66]">
            <HugeiconsIcon icon={RefreshIcon} className="size-4" strokeWidth={2} />
            Reintentar
          </Button>
        ) : isEmpty ? (
          <Button onClick={onOpenCreate} className="h-10 rounded-full bg-[#112747] px-5 text-xs font-semibold text-white hover:bg-[#1d3b66]">
            <HugeiconsIcon icon={Add01Icon} className="size-4" strokeWidth={2} />
            Crear ingrediente
          </Button>
        ) : (
          <Button variant="outline" onClick={onResetFilters} className="h-10 rounded-full border-[#cbd7e3] bg-white px-5 text-xs font-semibold text-[#112747] hover:bg-[#eff4f8]">
            Limpiar filtros
          </Button>
        )}
      </div>
    </div>
  )
}
