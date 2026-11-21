import Link from 'next/link'
import { HugeiconsIcon } from '@hugeicons/react'
import { Cancel01Icon, RefreshIcon } from '@hugeicons/core-free-icons'
import { estados, type EstadoPedido } from '@/entities/pedido'
import { pedidoUrl } from './pedidosTable.helpers'

export function PedidosTableHeader({ total, estado, pagina, loadFailed }: {
  total: number
  estado: EstadoPedido | ''
  pagina: number
  loadFailed: boolean
}) {
  return (
    <div className="space-y-4 border-b border-[#dce3e9] bg-[#eff4f8]/65 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-lg font-semibold tracking-tight text-[#142238]">
              Registro de comandas
            </h2>
            <span className="inline-flex items-center rounded-full border border-[#dce3e9] bg-white px-2.5 py-0.5 text-xs font-semibold tabular-nums text-[#55667e]">
              {loadFailed ? 'Sin datos' : `${total} ${total === 1 ? 'pedido' : 'pedidos'}`}
            </span>
          </div>
          <p className="mt-1 text-xs text-[#55667e] sm:text-sm">
            {loadFailed
              ? 'Sin datos disponibles. Vuelve a intentarlo.'
              : 'Cada estado se identifica con etiqueta textual y código semántico pastel.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href={pedidoUrl(pagina, estado)}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-[#cbd7e3] bg-white px-4 text-xs font-semibold text-[#112747] transition-colors hover:bg-[#eff4f8] active:scale-[0.98]"
          >
            <HugeiconsIcon icon={RefreshIcon} className="size-4" strokeWidth={2} />
            <span>Actualizar</span>
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div
          role="group"
          aria-label="Filtrar rápidamente por estado"
          className="inline-flex flex-wrap items-center gap-1 self-start rounded-full border border-[#e1e9f0] bg-white p-1"
        >
          {(['', ...estados] as const).map((item) => {
            const isSelected = estado === item
            const label = item || 'Todos'
            return (
              <Link
                key={label}
                href={pedidoUrl(1, item)}
                aria-current={isSelected ? 'page' : undefined}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
                  isSelected
                    ? 'bg-[#112747] text-white shadow-[0_4px_12px_-2px_rgba(17,39,71,0.3)]'
                    : 'text-[#465870] hover:text-[#112747]'
                }`}
              >
                {label}
              </Link>
            )
          })}
        </div>

        <form action="/pedidos" className="flex flex-wrap items-center gap-2.5">
          <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#465870]">
            <span>Estado</span>
            <select
              name="estado"
              defaultValue={estado}
              className="h-9 rounded-full border border-[#cbd7e3] bg-white px-3.5 text-xs font-semibold text-[#142238] focus-visible:border-[#3e81d0] focus-visible:outline-none"
            >
              <option value="">Todos</option>
              {estados.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="inline-flex h-9 items-center justify-center rounded-full bg-[#112747] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#1d3b66] active:scale-[0.98]"
          >
            Filtrar
          </button>
          {estado ? (
            <Link
              href={pedidoUrl(1, '')}
              className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-[#55667e] transition-colors hover:bg-white hover:text-[#112747]"
            >
              <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" strokeWidth={2} />
              <span>Limpiar filtro</span>
            </Link>
          ) : null}
        </form>
      </div>
    </div>
  )
}
