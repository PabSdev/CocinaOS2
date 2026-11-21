import { beforeEach, describe, expect, it, vi } from 'vitest'
const { get, getUserRole, listRows } = vi.hoisted(() => ({ get: vi.fn(), getUserRole: vi.fn(), listRows: vi.fn() }))
vi.mock('next/headers', () => ({ cookies: async () => ({ get: () => ({ value: 'session' }) }) }))
vi.mock('@/shared/api', () => ({
  createSessionAccountClient: () => ({ get }),
  createSessionTablesDBClient: () => ({ listRows }),
  getAuthCookieName: () => 'session',
  getUserRole,
  DATABASE_ID: 'db',
  TABLE_PEDIDOS_ID: 'pedidos',
  Query: { orderDesc: vi.fn(() => 'order'), limit: vi.fn(() => 'limit'), offset: vi.fn((n) => `offset:${n}`), equal: vi.fn((a, b) => `${a}:${b}`) },
}))
import { getPedidos } from './index'
describe('historial de pedidos', () => {
  beforeEach(() => { vi.clearAllMocks(); get.mockResolvedValue({ $id: 'user', status: true }) })
  it('impide la consulta a cocineros', async () => {
    getUserRole.mockResolvedValue('cocinero')
    expect(await getPedidos('', 1)).toEqual({ autorizado: false })
    expect(listRows).not.toHaveBeenCalled()
  })
  it('filtra y pagina en Appwrite para administradores', async () => {
    getUserRole.mockResolvedValue('admin')
    listRows.mockResolvedValue({ rows: [], total: 0 })
    await getPedidos('Pendiente', 2)
    expect(listRows).toHaveBeenCalledWith(expect.objectContaining({ queries: ['order', 'limit', 'offset:25', 'estado:Pendiente'] }))
  })
})
