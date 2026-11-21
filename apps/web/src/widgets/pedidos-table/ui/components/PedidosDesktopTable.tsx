import type { Pedido } from '@/entities/pedido'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui'
import { PedidoEstadoBadge } from './PedidoEstadoBadge'
import { euros, fecha } from './pedidosTable.helpers'

export function PedidosDesktopTable({ pedidos }: { pedidos: Pedido[] }) {
  return (
    <Table className="hidden sm:table">
      <TableHeader>
        <TableRow className="border-[#dce3e9] bg-[#fafbfc] hover:bg-[#fafbfc]">
          <TableHead className="h-11 pl-6 text-[11px] font-bold uppercase tracking-[0.05em] text-[#55667e]">
            N.º de pedido
          </TableHead>
          <TableHead className="h-11 text-[11px] font-bold uppercase tracking-[0.05em] text-[#55667e]">
            Fecha y hora
          </TableHead>
          <TableHead className="h-11 text-[11px] font-bold uppercase tracking-[0.05em] text-[#55667e]">
            Cliente
          </TableHead>
          <TableHead className="h-11 text-[11px] font-bold uppercase tracking-[0.05em] text-[#55667e]">
            Estado
          </TableHead>
          <TableHead className="h-11 pr-6 text-right text-[11px] font-bold uppercase tracking-[0.05em] text-[#55667e]">
            Total
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {pedidos.map((p) => {
          const isPendiente = p.estado === 'Pendiente'
          return (
            <TableRow
              key={p.$id}
              className={`border-[#edf1f5] transition-colors ${
                isPendiente
                  ? 'bg-[#fffcf5] hover:bg-[#fbf3db]/45'
                  : 'bg-white hover:bg-[#eff4f8]/50'
              }`}
            >
              <TableCell className="py-3.5 pl-6">
                <span className="inline-flex items-center rounded-full border border-[#e1e9f0] bg-[#eff4f8] px-2.5 py-0.5 text-xs font-semibold tabular-nums text-[#142238]">
                  {p.$id}
                </span>
              </TableCell>
              <TableCell className="py-3.5 text-xs tabular-nums text-[#55667e] sm:text-sm">
                {fecha.format(new Date(p.fecha))}
              </TableCell>
              <TableCell className="py-3.5 text-sm font-semibold text-[#142238]">
                {p.cliente}
              </TableCell>
              <TableCell className="py-3.5">
                <PedidoEstadoBadge estado={p.estado} />
              </TableCell>
              <TableCell className="py-3.5 pr-6 text-right">
                <span className="inline-flex items-center rounded-full border border-[#dce3e9] bg-[#eff4f8] px-2.5 py-0.5 text-xs font-semibold tabular-nums text-[#142238]">
                  {euros.format(p.totalCentimos / 100)}
                </span>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
