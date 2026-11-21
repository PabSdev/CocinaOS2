'use client'

import { formatDate } from './IngredientRowActions'

interface IngredientsMetrics {
  total: number
  lowStock: number
  latestUpdate: string
}

interface IngredientsMetricsGridProps {
  metrics: IngredientsMetrics
  inventoryUnavailable: boolean
  lowStockOnly: boolean
  onToggleLowStock: () => void
}

export function IngredientsMetricsGrid({
  metrics,
  inventoryUnavailable,
  lowStockOnly,
  onToggleLowStock,
}: IngredientsMetricsGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="rounded-[20px] border border-[#dce3e9] bg-white p-5 shadow-[0_14px_36px_-24px_rgba(17,39,71,0.14)]">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-[0.05em] text-[#55667e]">
            Ingredientes activos
          </p>
          <span className="inline-flex items-center rounded-full border border-[#26592b]/14 bg-[#edf3ec] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.04em] text-[#26592b]">
            En almacén
          </span>
        </div>
        <p className="mt-3 text-3xl font-semibold tabular-nums tracking-tight text-[#112747]">
          {inventoryUnavailable ? 'Sin datos' : metrics.total}
        </p>
        <p className="mt-1 text-xs text-[#55667e]">
          Materias primas registradas en cocina
        </p>
      </div>

      <button
        type="button"
        onClick={onToggleLowStock}
        disabled={metrics.lowStock === 0}
        aria-pressed={lowStockOnly}
        className={`rounded-[20px] border p-5 text-left transition-all duration-200 shadow-[0_14px_36px_-24px_rgba(17,39,71,0.14)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-default ${
          lowStockOnly
            ? 'border-[#8a5700]/35 bg-[#fffcf5]'
            : 'border-[#dce3e9] bg-white hover:border-[#cbd7e3] hover:bg-[#fffcf5]/60 disabled:hover:border-[#dce3e9] disabled:hover:bg-white'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-[0.05em] text-[#55667e]">
            Por reponer
          </span>
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.04em] ${
              metrics.lowStock > 0
                ? 'border-[#8a5700]/16 bg-[#fbf3db] text-[#8a5700]'
                : 'border-[#26592b]/14 bg-[#edf3ec] text-[#26592b]'
            }`}
          >
            {metrics.lowStock > 0 ? 'Atención' : 'Al día'}
          </span>
        </div>
        <span
          className={`mt-3 block text-3xl font-semibold tabular-nums tracking-tight ${
            metrics.lowStock > 0 ? 'text-[#8a5700]' : 'text-[#112747]'
          }`}
        >
          {inventoryUnavailable ? 'Sin datos' : metrics.lowStock}
        </span>
        <span className="mt-1 block text-xs text-[#55667e]">
          {lowStockOnly
            ? 'Filtro activo: pulsa para ver todos'
            : 'Existencias de 5 unidades o menos'}
        </span>
      </button>

      <div className="rounded-[20px] border border-[#dce3e9] bg-white p-5 shadow-[0_14px_36px_-24px_rgba(17,39,71,0.14)]">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-[0.05em] text-[#55667e]">
            Última revisión
          </p>
          <span className="inline-flex items-center rounded-full border border-[#1c608f]/15 bg-[#e1f3fe] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.04em] text-[#1c608f]">
            Sincronizado
          </span>
        </div>
        <p className="mt-3 text-xl font-semibold tracking-tight text-[#112747] sm:text-2xl">
          {inventoryUnavailable
            ? 'Sin conexión'
            : metrics.latestUpdate
              ? formatDate(metrics.latestUpdate)
              : 'Sin registros'}
        </p>
        <p className="mt-1 text-xs text-[#55667e]">
          Registro actualizado en tiempo real
        </p>
      </div>
    </div>
  )
}
