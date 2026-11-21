const priceFormatter = new Intl.NumberFormat('es-ES', {
  style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 4,
})

export function formatPurchasePrice(price: number | null, unit: string): string {
  return price == null ? 'Sin precio' : `${priceFormatter.format(price)}/${unit}`
}
