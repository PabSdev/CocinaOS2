import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Pedido } from '@/entities/pedido'

vi.mock('@/entities/pedido', () => ({ estados: ['Pendiente', 'Completado', 'Cancelado'] }))

import { PedidosTableWidget } from './PedidosTableWidget'

const pedido: Pedido = {
  $id: 'pedido-1',
  fecha: '2026-11-09T12:00:00Z',
  cliente: 'Mesa 4',
  estado: 'Pendiente',
  totalCentimos: 1250,
}

describe('PedidosTableWidget', () => {
  it('mantiene el filtro al paginar y muestra el pedido en escritorio y móvil', () => {
    render(<PedidosTableWidget pedidos={[pedido]} total={51} estado="Pendiente" pagina={2} loadFailed={false} />)

    expect(screen.getAllByText('Mesa 4')).toHaveLength(2)
    expect(screen.getByRole('link', { name: 'Anterior' }).getAttribute('href')).toBe('/pedidos?estado=Pendiente&pagina=1')
    expect(screen.getByRole('link', { name: 'Siguiente' }).getAttribute('href')).toBe('/pedidos?estado=Pendiente&pagina=3')
  })

  it('muestra el error con reintento en la misma página y sin paginación', () => {
    render(<PedidosTableWidget pedidos={[]} total={0} estado="Cancelado" pagina={2} loadFailed />)

    expect(screen.getByRole('heading', { name: 'No se pudieron cargar los pedidos.' })).toBeDefined()
    expect(screen.getByRole('link', { name: 'Reintentar' }).getAttribute('href')).toBe('/pedidos?estado=Cancelado&pagina=2')
    expect(screen.queryByRole('link', { name: 'Anterior' })).toBeNull()
  })

  it.each([
    { estado: '' as const, pagina: 1, titulo: 'Todavía no hay pedidos' },
    { estado: '' as const, pagina: 2, titulo: 'No hay más pedidos.' },
    { estado: 'Completado' as const, pagina: 1, titulo: 'No hay pedidos con este estado.' },
  ])('distingue el registro vacío: $titulo', ({ estado, pagina, titulo }) => {
    render(<PedidosTableWidget pedidos={[]} total={0} estado={estado} pagina={pagina} loadFailed={false} />)

    expect(screen.getByRole('heading', { name: titulo })).toBeDefined()
    const reset = screen.queryByRole('link', { name: 'Ver todos los pedidos' })
    expect(reset?.getAttribute('href') ?? null).toBe(estado || pagina > 1 ? '/pedidos?estado=&pagina=1' : null)
  })
})
