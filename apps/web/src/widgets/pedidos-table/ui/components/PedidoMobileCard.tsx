import type { Pedido } from '@/entities/pedido'
import { PedidoEstadoBadge } from './PedidoEstadoBadge'
import { euros, fecha } from './pedidosTable.helpers'

export function PedidoMobileCard({ pedido: p }: { pedido: Pedido }) {
  const isPendiente = p.estado === 'Pendiente'

  return (
    <li
      className={`p-4 transition-colors ${isPendiente ? 'bg-[#fffcf5]' : 'bg-white'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[#142238]">
            {p.cliente}
          </p>
          <p className="mt-0.5 break-all text-xs font-medium tabular-nums text-[#55667e]">
            Pedido #{p.$id}
          </p>
        </div>
        <PedidoEstadoBadge estado={p.estado} className="shrink-0" />
      </div>
      <div className="mt-3 flex items-center justify-between gap-4">
        <span className="text-xs tabular-nums text-[#55667e]">
          {fecha.format(new Date(p.fecha))}
        </span>
        <span className="inline-flex items-center rounded-full border border-[#dce3e9] bg-[#eff4f8] px-2.5 py-0.5 text-xs font-semibold tabular-nums text-[#142238]">
          {euros.format(p.totalCentimos / 100)}
        </span>
      </div>
    </li>
  )
}
