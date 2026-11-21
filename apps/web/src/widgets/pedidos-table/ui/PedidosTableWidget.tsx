import type { EstadoPedido, Pedido } from '@/entities/pedido'
import { PedidosMetricsGrid } from './components/PedidosMetricsGrid'
import { PedidosTableHeader } from './components/PedidosTableHeader'
import { PedidosTableStates } from './components/PedidosTableStates'
import { PedidosDesktopTable } from './components/PedidosDesktopTable'
import { PedidoMobileCard } from './components/PedidoMobileCard'
import { PedidosPagination } from './components/PedidosPagination'

interface PedidosTableWidgetProps {
  pedidos: Pedido[]
  total: number
  estado: EstadoPedido | ''
  pagina: number
  loadFailed: boolean
}

export function PedidosTableWidget({ pedidos, total, estado, pagina, loadFailed }: PedidosTableWidgetProps) {
  return (
    <section className="space-y-5" aria-label="Historial de pedidos">
      <PedidosMetricsGrid pedidos={pedidos} total={total} estado={estado} loadFailed={loadFailed} />
      <div className="overflow-hidden rounded-[20px] border border-[#cbd7e3] bg-white shadow-[0_14px_36px_-24px_rgba(17,39,71,0.14)]">
        <PedidosTableHeader total={total} estado={estado} pagina={pagina} loadFailed={loadFailed} />
        {loadFailed || pedidos.length === 0 ? (
          <PedidosTableStates loadFailed={loadFailed} estado={estado} pagina={pagina} />
        ) : (
          <>
            <PedidosDesktopTable pedidos={pedidos} />
            <ul className="divide-y divide-[#edf1f5] sm:hidden" aria-label="Lista de pedidos">
              {pedidos.map((pedido) => <PedidoMobileCard key={pedido.$id} pedido={pedido} />)}
            </ul>
          </>
        )}
        {!loadFailed && (
          <PedidosPagination total={total} pagina={pagina} estado={estado} hasPedidos={pedidos.length > 0} />
        )}
      </div>
    </section>
  )
}
