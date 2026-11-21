'use client'

import * as React from 'react'
import { Input, Button } from '@/shared/ui'
import type { UnidadDeMasa } from '@/entities/ingredient'
import { HugeiconsIcon } from '@hugeicons/react'
import { Search01Icon, Cancel01Icon } from '@hugeicons/core-free-icons'

export type UnitFilter = 'all' | UnidadDeMasa

interface IngredientFiltersProps {
  search: string
  onSearchChange: (search: string) => void
  selectedUnit: UnitFilter
  onUnitChange: (unit: UnitFilter) => void
  lowStockOnly: boolean
  onLowStockChange: (active: boolean) => void
}

const UNITS: { label: string; shortLabel: string; value: UnitFilter }[] = [
  { label: 'Todas las unidades', shortLabel: 'Todas', value: 'all' },
  { label: 'Kilogramos (KG)', shortLabel: 'KG', value: 'KG' },
  { label: 'Gramos (G)', shortLabel: 'G', value: 'G' },
  { label: 'Litros (L)', shortLabel: 'L', value: 'L' },
  { label: 'Mililitros (ML)', shortLabel: 'ML', value: 'ML' },
]

export function IngredientFilters({
  search,
  onSearchChange,
  selectedUnit,
  onUnitChange,
  lowStockOnly,
  onLowStockChange,
}: IngredientFiltersProps) {
  const hasActiveFilters = search.trim() !== '' || selectedUnit !== 'all' || lowStockOnly

  const clearFilters = () => {
    onSearchChange('')
    onUnitChange('all')
    onLowStockChange(false)
  }

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="relative w-full lg:max-w-sm">
        <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#55667e]">
          <HugeiconsIcon icon={Search01Icon} className="size-4" strokeWidth={2} />
        </div>
        <Input
          aria-label="Buscar ingredientes"
          placeholder="Buscar por nombre o descripción..."
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
          aria-label="Filtrar por unidad de medida"
          className="inline-flex flex-wrap items-center gap-1 rounded-full border border-[#e1e9f0] bg-[#eff4f8] p-1"
        >
          {UNITS.map((unit) => {
            const isSelected = selectedUnit === unit.value
            return (
              <button
                key={unit.value}
                type="button"
                onClick={() => onUnitChange(unit.value)}
                aria-pressed={isSelected}
                title={unit.label}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-all duration-200 ${
                  isSelected
                    ? 'bg-[#112747] text-white shadow-[0_4px_12px_-2px_rgba(17,39,71,0.3)]'
                    : 'text-[#465870] hover:text-[#112747]'
                }`}
              >
                {unit.shortLabel}
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
