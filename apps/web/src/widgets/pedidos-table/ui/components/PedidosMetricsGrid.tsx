import Link from 'next/link'
import type { EstadoPedido, Pedido } from '@/entities/pedido'
import { euros, pedidoUrl } from './pedidosTable.helpers'

export function PedidosMetricsGrid({ pedidos, total, estado, loadFailed }: {
  pedidos: Pedido[]
  total: number
  estado: EstadoPedido | ''
  loadFailed: boolean
}) {
  const pendientesEnVista = pedidos.filter((p) => p.estado === 'Pendiente').length
  const importeVistaCentimos = pedidos.reduce((sum, p) => sum + p.totalCentimos, 0)

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="rounded-[20px] border border-[#dce3e9] bg-white p-5 shadow-[0_14px_36px_-24px_rgba(17,39,71,0.14)]">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-[0.05em] text-[#55667e]">
            Pedidos registrados
          </p>
          <span className="inline-flex items-center rounded-full border border-[#26592b]/14 bg-[#edf3ec] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.04em] text-[#26592b]">
            {estado ? estado : 'En registro'}
          </span>
        </div>
        <p className="mt-3 text-3xl font-semibold tabular-nums tracking-tight text-[#112747]">
          {loadFailed ? 'Sin datos' : total}
        </p>
        <p className="mt-1 text-xs text-[#55667e]">
          {estado ? `Comandas con estado ${estado.toLowerCase()}` : 'Comandas totales en el historial'}
        </p>
      </div>

      <Link
        href={estado === 'Pendiente' ? pedidoUrl(1, '') : pedidoUrl(1, 'Pendiente')}
        aria-current={estado === 'Pendiente' ? 'true' : undefined}
        className={`rounded-[20px] border p-5 text-left transition-all duration-200 shadow-[0_14px_36px_-24px_rgba(17,39,71,0.14)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
          estado === 'Pendiente'
            ? 'border-[#8a5700]/35 bg-[#fffcf5]'
            : 'border-[#dce3e9] bg-white hover:border-[#cbd7e3] hover:bg-[#fffcf5]/60'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-[0.05em] text-[#55667e]">
            Pendientes en página
          </span>
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.04em] ${
              pendientesEnVista > 0
                ? 'border-[#8a5700]/16 bg-[#fbf3db] text-[#8a5700]'
                : 'border-[#26592b]/14 bg-[#edf3ec] text-[#26592b]'
            }`}
          >
            {pendientesEnVista > 0 ? 'Atención' : 'Al día'}
          </span>
        </div>
        <span
          className={`mt-3 block text-3xl font-semibold tabular-nums tracking-tight ${
            pendientesEnVista > 0 ? 'text-[#8a5700]' : 'text-[#112747]'
          }`}
        >
          {loadFailed ? 'Sin datos' : pendientesEnVista}
        </span>
        <span className="mt-1 block text-xs text-[#55667e]">
          {estado === 'Pendiente'
            ? 'Filtro activo: pulsa para ver todos'
            : 'Pulsa para filtrar comandas pendientes'}
        </span>
      </Link>

      <div className="rounded-[20px] border border-[#dce3e9] bg-white p-5 shadow-[0_14px_36px_-24px_rgba(17,39,71,0.14)]">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-[0.05em] text-[#55667e]">
            Importe en vista
          </p>
          <span className="inline-flex items-center rounded-full border border-[#1c608f]/15 bg-[#e1f3fe] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.04em] text-[#1c608f]">
            Solo lectura
          </span>
        </div>
        <p className="mt-3 text-2xl font-semibold tabular-nums tracking-tight text-[#112747] sm:text-3xl">
          {loadFailed ? 'Sin conexión' : euros.format(importeVistaCentimos / 100)}
        </p>
        <p className="mt-1 text-xs text-[#55667e]">
          {loadFailed
            ? 'Sin datos sincronizados'
            : `Suma de ${pedidos.length} ${pedidos.length === 1 ? 'pedido mostrado' : 'pedidos mostrados'}`}
        </p>
      </div>
    </div>
  )
}
