import Link from 'next/link'
import type { EstadoPedido } from '@/entities/pedido'
import { pedidoUrl } from './pedidosTable.helpers'

export function PedidosPagination({ total, pagina, estado, hasPedidos }: {
  total: number
  pagina: number
  estado: EstadoPedido | ''
  hasPedidos: boolean
}) {
  const totalPaginas = Math.max(1, Math.ceil(total / 25))

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 border-t border-[#dce3e9] bg-[#fafbfc] px-4 py-3 text-xs text-[#55667e] sm:px-6"
      aria-live="polite"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold text-[#142238] tabular-nums">{total} pedidos</span>
        {hasPedidos && (
          <span>
            (página <strong className="font-semibold text-[#142238] tabular-nums">{pagina}</strong> de{' '}
            <strong className="font-semibold text-[#142238] tabular-nums">{totalPaginas}</strong>)
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {pagina > 1 && (
          <Link
            href={pedidoUrl(pagina - 1, estado)}
            className="inline-flex h-8 items-center rounded-full border border-[#cbd7e3] bg-white px-3.5 text-xs font-semibold text-[#112747] transition-colors hover:bg-[#eff4f8]"
          >
            Anterior
          </Link>
        )}
        {pagina * 25 < total && (
          <Link
            href={pedidoUrl(pagina + 1, estado)}
            className="inline-flex h-8 items-center rounded-full border border-[#cbd7e3] bg-white px-3.5 text-xs font-semibold text-[#112747] transition-colors hover:bg-[#eff4f8]"
          >
            Siguiente
          </Link>
        )}
      </div>
    </div>
  )
}
