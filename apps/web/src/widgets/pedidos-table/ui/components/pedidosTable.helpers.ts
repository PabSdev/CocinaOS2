export const fecha = new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Madrid' })
export const euros = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' })

export function pedidoUrl(pagina: number, estado: string) {
  return `/pedidos?estado=${encodeURIComponent(estado)}&pagina=${pagina}`
}
