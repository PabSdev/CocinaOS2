import type { EstadoPedido } from '@/entities/pedido'

const coloresEstado: Record<EstadoPedido, string> = {
  Pendiente: 'border-[#8a5700]/16 bg-[#fbf3db] text-[#8a5700]',
  Completado: 'border-[#26592b]/14 bg-[#edf3ec] text-[#26592b]',
  Cancelado: 'border-[#962b29]/15 bg-[#fdebec] text-[#962b29]',
}

export function PedidoEstadoBadge({ estado, className = '' }: { estado: EstadoPedido; className?: string }) {
  return (
    <span className={`${className ? `${className} ` : ''}inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.04em] ${coloresEstado[estado] || ''}`}>
      {estado}
    </span>
  )
}
