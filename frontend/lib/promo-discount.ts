export function calculatePromoDiscount(percent: number | undefined, subtotal: number) {
  if (!percent) return 0
  return Math.min(subtotal * (percent / 100), subtotal)
}
