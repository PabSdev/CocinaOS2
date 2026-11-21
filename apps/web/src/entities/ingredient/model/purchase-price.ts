export function isPurchasePrice(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
}

export function roundPurchasePrice(value: number): number {
  return Number(value.toFixed(4))
}

/** Empty text is absent; malformed text remains invalid (NaN). */
export function parsePurchasePrice(value: string): number | null {
  const text = value.trim().replace(',', '.')
  if (text === '') return null
  return /^(?:\d+(?:\.\d*)?|\.\d+)$/.test(text) ? Number(text) : NaN
}

export function purchasePriceWithoutVat(gross: number, vat: number): number | null {
  if (!isPurchasePrice(gross) || !isPurchasePrice(vat)) return null
  const net = gross / (1 + vat / 100)
  // Compensa el error de coma flotante en céntimos exactos antes de truncar.
  return Math.trunc((net + net * Number.EPSILON) * 100) / 100
}

export { formatPurchasePrice } from '@/shared/lib'
