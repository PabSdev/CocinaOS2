'use client'

import * as React from 'react'
import { Input, Button } from '@/shared/ui'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Search01Icon,
  Cancel01Icon,
  Alert02Icon,
} from '@hugeicons/core-free-icons'

interface ProductFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  selectedCategory: string
  onCategoryChange: (value: string) => void
  categories: string[]
  lowStockOnly: boolean
  onLowStockChange: (value: boolean) => void
}

export function ProductFilters({
  search,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
  lowStockOnly,
  onLowStockChange,
}: ProductFiltersProps) {
  const hasActiveFilters =
    search.trim() !== '' || selectedCategory !== 'ALL' || lowStockOnly

  const handleClear = () => {
    onSearchChange('')
    onCategoryChange('ALL')
    onLowStockChange(false)
  }

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      {/* Buscador en píldora */}
      <div className="relative flex-1 lg:max-w-sm">
        <HugeiconsIcon
          icon={Search01Icon}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#55667e]"
          strokeWidth={2}
        />
        <Input
          type="search"
          aria-label="Buscar producto por nombre o categoría"
          placeholder="Buscar bebida, salsa o categoría..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-10 rounded-full border-[#cbd7e3] bg-white pl-10 pr-9 text-[13px] text-[#142238] placeholder:text-[#64748b] focus-visible:border-[#112747] focus-visible:ring-[#112747]/15"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            aria-label="Limpiar búsqueda"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-[#55667e] hover:bg-[#eff4f8] hover:text-[#142238]"
          >
            <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" />
          </button>
        )}
      </div>

      {/* Cápsula segmentada de categorías + Filtro Stock Bajo */}
      <div className="flex flex-wrap items-center gap-2">
        <div
          role="group"
          aria-label="Filtrar por categoría de producto"
          className="inline-flex max-w-full flex-wrap items-center gap-1 rounded-full border border-[#e1e9f0] bg-[#eff4f8] p-1"
        >
          <button
            type="button"
            onClick={() => onCategoryChange('ALL')}
            aria-pressed={selectedCategory === 'ALL'}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
              selectedCategory === 'ALL'
                ? 'bg-[#112747] text-white shadow-[0_1px_2px_rgba(17,39,71,0.16)]'
                : 'text-[#55667e] hover:bg-white/80 hover:text-[#112747]'
            }`}
          >
            Todas
          </button>
          {categories.map((cat) => {
            const active = selectedCategory.toLocaleLowerCase('es') === cat.toLocaleLowerCase('es')
            return (
              <button
                key={cat}
                type="button"
                onClick={() => onCategoryChange(cat)}
                aria-pressed={active}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                  active
                    ? 'bg-[#112747] text-white shadow-[0_1px_2px_rgba(17,39,71,0.16)]'
                    : 'text-[#55667e] hover:bg-white/80 hover:text-[#112747]'
                }`}
              >
                {cat}
              </button>
            )
          })}
        </div>

        <Button
          type="button"
          variant={lowStockOnly ? 'default' : 'outline'}
          size="default"
          onClick={() => onLowStockChange(!lowStockOnly)}
          aria-pressed={lowStockOnly}
          className={`h-9 rounded-full px-3.5 text-xs font-medium transition-colors ${
            lowStockOnly
              ? 'border border-[#8a5700]/25 bg-[#fbf3db] text-[#8a5700] hover:bg-[#f6e8c3]'
              : 'border-[#cbd7e3] bg-white text-[#55667e] hover:bg-[#eff4f8] hover:text-[#112747]'
          }`}
        >
          <HugeiconsIcon
            icon={Alert02Icon}
            className={`size-3.5 ${lowStockOnly ? 'text-[#8a5700]' : 'text-[#8a5700]'}`}
          />
          Solo stock bajo
        </Button>

        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            size="default"
            onClick={handleClear}
            className="h-9 rounded-full px-3 text-xs font-medium text-[#55667e] hover:bg-[#eff4f8] hover:text-[#112747]"
          >
            Limpiar filtros
          </Button>
        )}
      </div>
    </div>
  )
}
