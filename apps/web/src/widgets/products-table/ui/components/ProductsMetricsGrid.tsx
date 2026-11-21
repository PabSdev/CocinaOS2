'use client'

import { formatDate } from './ProductRowActions'

interface ProductsMetrics {
  total: number
  categoriesCount: number
  lowStock: number
  latestUpdate: string
}

interface ProductsMetricsGridProps {
  metrics: ProductsMetrics
  productsUnavailable: boolean
  availableCategories: string[]
  lowStockOnly: boolean
  onToggleLowStock: () => void
}

export function ProductsMetricsGrid({
  metrics,
  productsUnavailable,
  availableCategories,
  lowStockOnly,
  onToggleLowStock,
}: ProductsMetricsGridProps) {
  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
      <div className="flex flex-col justify-between rounded-[20px] border border-[#dce3e9] bg-white p-5 shadow-[0_14px_36px_-24px_rgba(17,39,71,0.14)]">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[13px] font-medium text-[#55667e]">Productos registrados</span>
          <span className="inline-flex items-center rounded-full border border-[#26592b]/14 bg-[#edf3ec] px-2.5 py-0.5 text-[11px] font-semibold text-[#26592b]">
            En catálogo
          </span>
        </div>
        <p className="mt-3 text-3xl font-semibold tabular-nums tracking-[-0.03em] text-[#142238]">
          {productsUnavailable ? 'Sin datos' : metrics.total}
        </p>
        <span className="mt-2 text-xs text-[#64748b]">
          {metrics.latestUpdate
            ? `Sincronizado ${formatDate(metrics.latestUpdate)}`
            : 'Bebidas, salsas y referencias listas'}
        </span>
      </div>

      <div className="flex flex-col justify-between rounded-[20px] border border-[#dce3e9] bg-white p-5 shadow-[0_14px_36px_-24px_rgba(17,39,71,0.14)]">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[13px] font-medium text-[#55667e]">Categorías activas</span>
          <span className="inline-flex items-center rounded-full border border-[#1c608f]/15 bg-[#e1f3fe] px-2.5 py-0.5 text-[11px] font-semibold text-[#1c608f]">
            Clasificación
          </span>
        </div>
        <p className="mt-3 text-3xl font-semibold tabular-nums tracking-[-0.03em] text-[#142238]">
          {productsUnavailable ? 'Sin datos' : metrics.categoriesCount}
        </p>
        <span className="mt-2 text-xs text-[#64748b]">
          {availableCategories.slice(0, 4).join(', ')}
        </span>
      </div>

      <button
        type="button"
        onClick={onToggleLowStock}
        disabled={metrics.lowStock === 0 || productsUnavailable}
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
          {productsUnavailable ? 'Sin datos' : metrics.lowStock}
        </span>
        <span className="mt-2 block text-xs text-[#64748b]">
          {lowStockOnly
            ? 'Filtro activo: pulsa para ver todos'
            : '5 unidades o menos en almacén'}
        </span>
      </button>
    </div>
  )
}
