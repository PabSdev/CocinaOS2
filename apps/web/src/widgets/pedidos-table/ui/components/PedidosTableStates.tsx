import Link from 'next/link'
import { HugeiconsIcon } from '@hugeicons/react'
import { Alert02Icon, Invoice01Icon, RefreshIcon } from '@hugeicons/core-free-icons'
import type { EstadoPedido } from '@/entities/pedido'
import { pedidoUrl } from './pedidosTable.helpers'

export function PedidosTableStates({ loadFailed, estado, pagina }: {
  loadFailed: boolean
  estado: EstadoPedido | ''
  pagina: number
}) {
  return loadFailed ? (
    <div className="px-4 py-14 text-center sm:py-16">
      <div className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-[#e1e9f0] bg-[#eff4f8] text-[#112747]">
        <HugeiconsIcon icon={Alert02Icon} className="size-6" strokeWidth={1.8} />
      </div>
      <h3 className="mt-4 text-base font-semibold text-[#142238]">
        No se pudieron cargar los pedidos.
      </h3>
      <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-[#55667e]">
        No pudimos conectar con el registro de comandas en este momento.
      </p>
      <div className="mt-5 flex justify-center">
        <Link
          href={pedidoUrl(pagina, estado)}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-[#112747] px-5 text-xs font-semibold text-white transition-colors hover:bg-[#1d3b66]"
        >
          <HugeiconsIcon icon={RefreshIcon} className="size-4" strokeWidth={2} />
          <span>Reintentar</span>
        </Link>
      </div>
    </div>
  ) : (
    <div className="px-4 py-14 text-center sm:py-16">
      <div className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-[#e1e9f0] bg-[#eff4f8] text-[#112747]">
        <HugeiconsIcon icon={Invoice01Icon} className="size-6" strokeWidth={1.8} />
      </div>
      <h3 className="mt-4 text-base font-semibold text-[#142238]">
        {estado
          ? 'No hay pedidos con este estado.'
          : pagina > 1
            ? 'No hay más pedidos.'
            : 'Todavía no hay pedidos'}
      </h3>
      <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-[#55667e]">
        {estado
          ? 'Prueba a seleccionar otro estado o restablece la vista completa.'
          : pagina > 1
            ? 'Vuelve a la página anterior para revisar las comandas existentes.'
            : 'Cuando se registren comandas aparecerán listadas aquí con su estado e importe.'}
      </p>
      {(estado || pagina > 1) && (
        <div className="mt-5 flex justify-center">
          <Link
            href={pedidoUrl(1, '')}
            className="inline-flex h-10 items-center rounded-full border border-[#cbd7e3] bg-white px-5 text-xs font-semibold text-[#112747] transition-colors hover:bg-[#eff4f8]"
          >
            Ver todos los pedidos
          </Link>
        </div>
      )}
    </div>
  )
}
