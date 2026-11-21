'use client'

import { Button } from '@/shared/ui'
import { DishFilters, type PhotoFilter } from '@/features/dish/filter-dishes'
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon, Alert02Icon, Dish01Icon, RefreshIcon } from '@hugeicons/core-free-icons'
import { formatDate } from './DishRowActions'

interface DishesTableHeaderProps {
  filteredCount: number
  dishesUnavailable: boolean
  latestUpdate: string
  isPending: boolean
  loadFailed: boolean
  hasDishes: boolean
  search: string
  onSearchChange: (value: string) => void
  photoFilter: PhotoFilter
  onPhotoFilterChange: (value: PhotoFilter) => void
  lowStockOnly: boolean
  onLowStockChange: (value: boolean) => void
  onRefresh: () => void
  onOpenCreate: () => void
}

export function DishesTableHeader({
  filteredCount, dishesUnavailable, latestUpdate, isPending, loadFailed, hasDishes,
  search, onSearchChange, photoFilter, onPhotoFilterChange, lowStockOnly, onLowStockChange,
  onRefresh, onOpenCreate,
}: DishesTableHeaderProps) {
  return (
    <>
      <div className="space-y-4 border-b border-[#e5ebf1] bg-[#eff4f8]/65 px-5 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-[16px] font-semibold tracking-[-0.02em] text-[#142238]">Carta de platos</h2>
              <span className="inline-flex items-center rounded-full border border-[#dce3e9] bg-white px-2.5 py-0.5 text-xs font-semibold tabular-nums text-[#55667e]">
                {filteredCount}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-[#64748b]">
              {dishesUnavailable
                ? 'Sin datos disponibles. Vuelve a intentarlo.'
                : latestUpdate
                ? `Última actualización: ${formatDate(latestUpdate)}`
                : 'Añade el primer plato con su receta para empezar.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={onRefresh}
              disabled={isPending}
              className="h-9 rounded-full border-[#cbd7e3] bg-white px-4 text-xs font-medium text-[#1e324a] shadow-none hover:bg-[#eff4f8] hover:text-[#112747]"
            >
              <HugeiconsIcon icon={RefreshIcon} className={`size-3.5 ${isPending ? 'animate-spin' : ''}`} strokeWidth={2} />
              <span>Actualizar</span>
            </Button>
            <Button
              onClick={onOpenCreate}
              disabled={dishesUnavailable}
              className="h-9 rounded-full bg-[#112747] px-4 text-xs font-medium text-white shadow-[0_1px_2px_rgba(17,39,71,0.18)] hover:bg-[#19355e]"
            >
              <HugeiconsIcon icon={Add01Icon} className="size-3.5" strokeWidth={2} />
              <span>Nuevo plato</span>
            </Button>
          </div>
        </div>
        <DishFilters
          search={search}
          onSearchChange={onSearchChange}
          photoFilter={photoFilter}
          onPhotoFilterChange={onPhotoFilterChange}
          lowStockOnly={lowStockOnly}
          onLowStockChange={onLowStockChange}
        />
      </div>

      {loadFailed && hasDishes ? (
        <div className="border-b border-[#8a5700]/16 bg-[#fbf3db] px-5 py-2.5 text-xs font-medium text-[#8a5700]">
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={Alert02Icon} className="size-4 shrink-0" strokeWidth={2} />
            <span>No pudimos actualizar la carta de platos con Appwrite. Mostrando datos locales en caché.</span>
          </div>
        </div>
      ) : null}
    </>
  )
}

interface DishesEmptyStateProps {
  loadFailed: boolean
  dishesUnavailable: boolean
  isEmpty: boolean
  isPending: boolean
  onRefresh: () => void
  onOpenCreate: () => void
  onResetFilters: () => void
}

export function DishesEmptyState({
  loadFailed, dishesUnavailable, isEmpty, isPending, onRefresh, onOpenCreate, onResetFilters,
}: DishesEmptyStateProps) {
  return (
    <div className="px-4 py-14 text-center sm:py-16">
      <div className="mx-auto flex size-11 items-center justify-center rounded-full border border-[#dce3e9] bg-[#eff4f8] text-[#112747]">
        <HugeiconsIcon icon={loadFailed ? Alert02Icon : Dish01Icon} className="size-5" strokeWidth={1.8} />
      </div>
      <h3 className="mt-4 text-base font-semibold tracking-[-0.02em] text-[#142238]">
        {dishesUnavailable
          ? 'La carta de platos no está disponible'
          : isEmpty
          ? 'Tu carta de platos está vacía'
          : 'No encontramos coincidencias'}
      </h3>
      <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-[#55667e]">
        {dishesUnavailable
          ? 'No pudimos conectar con la base de datos de platos en este momento.'
          : isEmpty
          ? 'Añade elaboraciones culinarias y vincula los ingredientes de su receta.'
          : 'Prueba con otro término de búsqueda o limpia los filtros activos.'}
      </p>
      <div className="mt-5 flex justify-center">
        {dishesUnavailable ? (
          <Button onClick={onRefresh} disabled={isPending} className="h-9 rounded-full bg-[#112747] px-4 text-xs font-medium text-white hover:bg-[#19355e]">
            <HugeiconsIcon icon={RefreshIcon} className="size-3.5" strokeWidth={2} />
            Reintentar
          </Button>
        ) : isEmpty ? (
          <Button onClick={onOpenCreate} className="h-9 rounded-full bg-[#112747] px-4 text-xs font-medium text-white hover:bg-[#19355e]">
            <HugeiconsIcon icon={Add01Icon} className="size-3.5" strokeWidth={2} />
            Crear plato
          </Button>
        ) : (
          <Button variant="outline" onClick={onResetFilters} className="h-9 rounded-full border-[#cbd7e3] bg-white px-4 text-xs font-medium text-[#1e324a] hover:bg-[#eff4f8]">
            Limpiar filtros
          </Button>
        )}
      </div>
    </div>
  )
}
