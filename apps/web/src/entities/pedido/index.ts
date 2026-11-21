import 'server-only'
import { cookies } from 'next/headers'
import { createSessionAccountClient, createSessionTablesDBClient, DATABASE_ID, getAuthCookieName, getUserRole, Query, TABLE_PEDIDOS_ID } from '@/shared/api'

export const estados = ['Pendiente', 'Completado', 'Cancelado'] as const
export type EstadoPedido = typeof estados[number]
export type Pedido = { $id: string; fecha: string; cliente: string; estado: EstadoPedido; totalCentimos: number }

export async function getPedidos(estado: string, pagina: number) {
  const secret = (await cookies()).get(getAuthCookieName())?.value
  if (!secret) return { autorizado: false as const }
  try {
    const user = await createSessionAccountClient(secret).get()
    if (!user.status || await getUserRole(user.$id) !== 'admin') return { autorizado: false as const }
  } catch {
    return { autorizado: false as const }
  }
  try {
    const queries = [Query.orderDesc('fecha'), Query.limit(25), Query.offset((pagina - 1) * 25)]
    if (estados.includes(estado as EstadoPedido)) queries.push(Query.equal('estado', estado))
    const result = await createSessionTablesDBClient(secret).listRows({ databaseId: DATABASE_ID, tableId: TABLE_PEDIDOS_ID, queries })
    return { autorizado: true as const, error: false as const, pedidos: result.rows as unknown as Pedido[], total: result.total }
  } catch {
    return { autorizado: true as const, error: true as const }
  }
}
