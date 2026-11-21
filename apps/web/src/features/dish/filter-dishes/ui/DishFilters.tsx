'use client'

import * as React from 'react'
import { Input, Button } from '@/shared/ui'
import { HugeiconsIcon } from '@hugeicons/react'
import { Search01Icon, Cancel01Icon } from '@hugeicons/core-free-icons'

export type PhotoFilter = 'all' | 'with-photo' | 'without-photo'

interface DishFiltersProps {
  search: string
  onSearchChange: (search: string) => void
  photoFilter: PhotoFilter
  onPhotoFilterChange: (filter: PhotoFilter) => void
  lowStockOnly: boolean
  onLowStockChange: (active: boolean) => void
}

const PHOTO_OPTIONS: { label: string; shortLabel: string; value: PhotoFilter }[] = [
  { label: 'Todos los platos', shortLabel: 'Todos', value: 'all' },
  { label: 'Platos con fotografía', shortLabel: 'Con foto', value: 'with-photo' },
  { label: 'Platos sin fotografía', shortLabel: 'Sin foto', value: 'without-photo' },
]

export function DishFilters({
  search,
  onSearchChange,
  photoFilter,
  onPhotoFilterChange,
  lowStockOnly,
  onLowStockChange,
}: DishFiltersProps) {
  const hasActiveFilters = search.trim() !== '' || photoFilter !== 'all' || lowStockOnly

  const clearFilters = () => {
    onSearchChange('')
    onPhotoFilterChange('all')
    onLowStockChange(false)
  }

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="relative w-full lg:max-w-sm">
        <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#55667e]">
          <HugeiconsIcon icon={Search01Icon} className="size-4" strokeWidth={2} />
        </div>
        <Input
          aria-label="Buscar platos"
          placeholder="Buscar plato por nombre o precio..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-10 rounded-full border-[#cbd7e3] bg-white pl-10 pr-10 text-sm text-[#142238] placeholder:text-[#55667e]/80 focus-visible:border-[#3e81d0]"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            aria-label="Borrar búsqueda"
            className="absolute right-1.5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-[#55667e] transition-colors hover:bg-[#eff4f8] hover:text-[#112747] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" strokeWidth={2} />
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div
          role="group"
          aria-label="Filtrar por fotografía"
          className="inline-flex flex-wrap items-center gap-1 rounded-full border border-[#e1e9f0] bg-[#eff4f8] p-1"
        >
          {PHOTO_OPTIONS.map((opt) => {
            const isSelected = photoFilter === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onPhotoFilterChange(opt.value)}
                aria-pressed={isSelected}
                title={opt.label}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-all duration-200 ${
                  isSelected
                    ? 'bg-[#112747] text-white shadow-[0_4px_12px_-2px_rgba(17,39,71,0.3)]'
                    : 'text-[#465870] hover:text-[#112747]'
                }`}
              >
                {opt.shortLabel}
              </button>
            )
          })}
        </div>

        <button
          type="button"
          onClick={() => onLowStockChange(!lowStockOnly)}
          aria-pressed={lowStockOnly}
          className={`inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-xs font-semibold transition-all duration-200 active:scale-[0.98] ${
            lowStockOnly
              ? 'border-[#8a5700]/25 bg-[#fbf3db] text-[#8a5700]'
              : 'border-[#cbd7e3] bg-white text-[#465870] hover:bg-[#eff4f8] hover:text-[#112747]'
          }`}
        >
          Solo stock bajo
        </button>

        {hasActiveFilters ? (
          <Button
            type="button"
            variant="ghost"
            onClick={clearFilters}
            aria-label="Limpiar todos los filtros"
            className="h-9 rounded-full px-3 text-xs font-semibold text-[#55667e] hover:bg-[#eff4f8] hover:text-[#112747]"
          >
            <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" strokeWidth={2} />
            Limpiar filtros
          </Button>
        ) : null}
      </div>
    </div>
  )
}
