import { redirect } from 'next/navigation'
import { estados, getPedidos } from '@/entities/pedido'
import { PedidosTableWidget } from '@/widgets/pedidos-table'

export async function PedidosPage({ searchParams }: { searchParams: Promise<{ estado?: string; pagina?: string }> }) {
  const params = await searchParams
  const estado = estados.find((item) => item === params.estado) || ''
  const pagina = Math.max(1, Number.parseInt(params.pagina || '1', 10) || 1)
  const result = await getPedidos(estado, pagina)
  if (!result.autorizado) redirect('/ingredientes')

  return (
    <div className="space-y-6 md:space-y-8">
      <header className="max-w-2xl">
        <span className="inline-flex items-center rounded-full border border-[#dfe8f0] bg-[#eff4f8] px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.06em] text-[#112747]">
          Gestión Culinaria
        </span>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-[#142238] sm:text-4xl">
          Historial de pedidos
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#55667e] sm:text-base">
          Consulta las comandas registradas en sala, filtra por estado operativo y revisa el importe
          facturado por pedido.
        </p>
      </header>

      <PedidosTableWidget
        pedidos={result.error ? [] : result.pedidos}
        total={result.error ? 0 : result.total}
        estado={estado}
        pagina={pagina}
        loadFailed={result.error}
      />
    </div>
  )
}
