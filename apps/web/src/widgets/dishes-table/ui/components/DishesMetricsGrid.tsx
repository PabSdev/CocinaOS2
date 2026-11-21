'use client'

import { formatDate } from './DishRowActions'

interface DishesMetrics {
  total: number
  lowStock: number
  withPhoto: number
  latestUpdate: string
}

interface DishesMetricsGridProps {
  metrics: DishesMetrics
  dishesUnavailable: boolean
  withPhotoActive: boolean
  lowStockOnly: boolean
  onTogglePhotoFilter: () => void
  onToggleLowStock: () => void
}

export function DishesMetricsGrid({
  metrics,
  dishesUnavailable,
  withPhotoActive,
  lowStockOnly,
  onTogglePhotoFilter,
  onToggleLowStock,
}: DishesMetricsGridProps) {
  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
      <div className="flex flex-col justify-between rounded-[20px] border border-[#dce3e9] bg-white p-5 shadow-[0_14px_36px_-24px_rgba(17,39,71,0.14)]">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[13px] font-medium text-[#55667e]">Platos en carta</span>
          <span className="inline-flex items-center rounded-full border border-[#26592b]/14 bg-[#edf3ec] px-2.5 py-0.5 text-[11px] font-semibold text-[#26592b]">
            En carta
          </span>
        </div>
        <p className="mt-3 text-3xl font-semibold tabular-nums tracking-[-0.03em] text-[#142238]">
          {dishesUnavailable ? 'Sin datos' : metrics.total}
        </p>
        <span className="mt-2 text-xs text-[#64748b]">
          {metrics.latestUpdate
            ? `Sincronizado ${formatDate(metrics.latestUpdate)}`
            : 'Recetario centralizado en tiempo real'}
        </span>
      </div>

      <button
        type="button"
        onClick={onTogglePhotoFilter}
        disabled={metrics.withPhoto === 0 || dishesUnavailable}
        aria-pressed={withPhotoActive}
        className={`flex flex-col justify-between rounded-[20px] border p-5 text-left transition-all focus-visible:outline-none disabled:cursor-default ${
          withPhotoActive
            ? 'border-[#1c608f]/35 bg-[#e1f3fe]/45 shadow-[0_14px_36px_-24px_rgba(28,96,143,0.2)]'
            : 'border-[#dce3e9] bg-white shadow-[0_14px_36px_-24px_rgba(17,39,71,0.14)] hover:border-[#cbd7e3] hover:bg-[#fafbfc] disabled:hover:border-[#dce3e9] disabled:hover:bg-white'
        }`}
      >
        <div className="flex w-full items-center justify-between gap-2">
          <span className="text-[13px] font-medium text-[#55667e]">Con fotografía</span>
          <span className="inline-flex items-center rounded-full border border-[#1c608f]/15 bg-[#e1f3fe] px-2.5 py-0.5 text-[11px] font-semibold text-[#1c608f]">
            Appwrite Storage
          </span>
        </div>
        <span className="mt-3 block text-3xl font-semibold tabular-nums tracking-[-0.03em] text-[#142238]">
          {dishesUnavailable ? 'Sin datos' : metrics.withPhoto}
        </span>
        <span className="mt-2 block text-xs text-[#64748b]">
          {withPhotoActive
            ? 'Filtro activo: pulsa para ver toda la carta'
            : 'Imágenes listas para pase y comanda'}
        </span>
      </button>

      <button
        type="button"
        onClick={onToggleLowStock}
        disabled={metrics.lowStock === 0 || dishesUnavailable}
        aria-pressed={lowStockOnly}
        className={`flex flex-col justify-between rounded-[20px] border p-5 text-left transition-all focus-visible:outline-none disabled:cursor-default ${
          lowStockOnly
            ? 'border-[#8a5700]/35 bg-[#fbf3db]/55 shadow-[0_14px_36px_-24px_rgba(138,87,0,0.2)]'
            : 'border-[#dce3e9] bg-white shadow-[0_14px_36px_-24px_rgba(17,39,71,0.14)] hover:border-[#cbd7e3] hover:bg-[#fafbfc] disabled:hover:border-[#dce3e9] disabled:hover:bg-white'
        }`}
      >
        <div className="flex w-full items-center justify-between gap-2">
          <span className="text-[13px] font-medium text-[#55667e]">Por reponer</span>
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
              metrics.lowStock > 0
                ? 'border-[#8a5700]/16 bg-[#fbf3db] text-[#8a5700]'
                : 'border-[#26592b]/14 bg-[#edf3ec] text-[#26592b]'
            }`}
          >
            {metrics.lowStock > 0 ? 'Atención' : 'Al día'}
          </span>
        </div>
        <span
          className={`mt-3 block text-3xl font-semibold tabular-nums tracking-[-0.03em] ${
            metrics.lowStock > 0 ? 'text-[#8a5700]' : 'text-[#142238]'
          }`}
        >
          {dishesUnavailable ? 'Sin datos' : metrics.lowStock}
        </span>
        <span className="mt-2 block text-xs text-[#64748b]">
          {lowStockOnly
            ? 'Filtro activo: pulsa para ver todos'
            : '5 raciones o menos disponibles'}
        </span>
      </button>
    </div>
  )
}
