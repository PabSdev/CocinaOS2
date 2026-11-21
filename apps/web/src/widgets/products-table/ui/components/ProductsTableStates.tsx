'use client'

import { Button } from '@/shared/ui'
import { ProductFilters } from '@/features/product/filter-products'
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon, Alert02Icon, PackageIcon, RefreshIcon } from '@hugeicons/core-free-icons'
import { formatDate } from './ProductRowActions'

interface ProductsTableHeaderProps {
  filteredCount: number
  productsUnavailable: boolean
  latestUpdate: string
  isPending: boolean
  loadFailed: boolean
  hasProducts: boolean
  search: string
  onSearchChange: (value: string) => void
  selectedCategory: string
  onCategoryChange: (value: string) => void
  availableCategories: string[]
  lowStockOnly: boolean
  onLowStockChange: (value: boolean) => void
  onRefresh: () => void
  onOpenCreate: () => void
}

export function ProductsTableHeader({
  filteredCount, productsUnavailable, latestUpdate, isPending, loadFailed, hasProducts,
  search, onSearchChange, selectedCategory, onCategoryChange, availableCategories,
  lowStockOnly, onLowStockChange, onRefresh, onOpenCreate,
}: ProductsTableHeaderProps) {
  return (
    <>
      <div className="space-y-4 border-b border-[#e5ebf1] bg-[#eff4f8]/65 px-5 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-[16px] font-semibold tracking-[-0.02em] text-[#142238]">Catálogo de productos</h2>
              <span className="inline-flex items-center rounded-full border border-[#dce3e9] bg-white px-2.5 py-0.5 text-xs font-semibold tabular-nums text-[#55667e]">
                {filteredCount}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-[#64748b]">
              {productsUnavailable
                ? 'Sin datos disponibles. Vuelve a intentarlo.'
                : latestUpdate
                ? `Última actualización: ${formatDate(latestUpdate)}`
                : 'Añade bebidas, salsas o productos para empezar.'}
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
              disabled={productsUnavailable}
              className="h-9 rounded-full bg-[#112747] px-4 text-xs font-medium text-white shadow-[0_1px_2px_rgba(17,39,71,0.18)] hover:bg-[#19355e]"
            >
              <HugeiconsIcon icon={Add01Icon} className="size-3.5" strokeWidth={2} />
              <span>Nuevo producto</span>
            </Button>
          </div>
        </div>

        <ProductFilters
          search={search}
          onSearchChange={onSearchChange}
          selectedCategory={selectedCategory}
          onCategoryChange={onCategoryChange}
          categories={availableCategories}
          lowStockOnly={lowStockOnly}
          onLowStockChange={onLowStockChange}
        />
      </div>

      {loadFailed && hasProducts ? (
        <div className="border-b border-[#8a5700]/16 bg-[#fbf3db] px-5 py-2.5 text-xs font-medium text-[#8a5700]">
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={Alert02Icon} className="size-4 shrink-0" strokeWidth={2} />
            <span>No pudimos actualizar el catálogo con Appwrite. Mostrando datos locales en caché.</span>
          </div>
        </div>
      ) : null}
    </>
  )
}

interface ProductsEmptyStateProps {
  loadFailed: boolean
  productsUnavailable: boolean
  isEmpty: boolean
  isPending: boolean
  onRefresh: () => void
  onOpenCreate: () => void
  onResetFilters: () => void
}

export function ProductsEmptyState({
  loadFailed, productsUnavailable, isEmpty, isPending, onRefresh, onOpenCreate, onResetFilters,
}: ProductsEmptyStateProps) {
  return (
    <div className="px-4 py-14 text-center sm:py-16">
      <div className="mx-auto flex size-11 items-center justify-center rounded-full border border-[#dce3e9] bg-[#eff4f8] text-[#112747]">
        <HugeiconsIcon icon={loadFailed ? Alert02Icon : PackageIcon} className="size-5" strokeWidth={1.8} />
      </div>
      <h3 className="mt-4 text-base font-semibold tracking-[-0.02em] text-[#142238]">
        {productsUnavailable
          ? 'El catálogo de productos no está disponible'
          : isEmpty
          ? 'Tu catálogo de productos está vacío'
          : 'No encontramos coincidencias'}
      </h3>
      <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-[#55667e]">
        {productsUnavailable
          ? 'No pudimos conectar con la tabla de productos en este momento.'
          : isEmpty
          ? 'Registra bebidas, salsas, conservas o referencias de sala y cocina con su categoría y stock.'
          : 'Prueba con otro término de búsqueda o cambia la categoría seleccionada.'}
      </p>
      <div className="mt-5 flex justify-center">
        {productsUnavailable ? (
          <Button onClick={onRefresh} disabled={isPending} className="h-9 rounded-full bg-[#112747] px-4 text-xs font-medium text-white hover:bg-[#19355e]">
            <HugeiconsIcon icon={RefreshIcon} className="size-3.5" strokeWidth={2} />
            Reintentar
          </Button>
        ) : isEmpty ? (
          <Button onClick={onOpenCreate} className="h-9 rounded-full bg-[#112747] px-4 text-xs font-medium text-white hover:bg-[#19355e]">
            <HugeiconsIcon icon={Add01Icon} className="size-3.5" strokeWidth={2} />
            Crear producto
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
