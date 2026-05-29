import type { Product } from "@/lib/api"

function hasBestsellerBadge(product: Product) {
  return product.badge?.toLowerCase() === "bestseller"
}

export function sortProductsByDisplayPriority(products: Product[]) {
  return [...products].sort((a, b) => {
    const stockPriority = Number(b.stock > 0) - Number(a.stock > 0)
    if (stockPriority !== 0) return stockPriority

    const bestsellerPriority = Number(hasBestsellerBadge(b)) - Number(hasBestsellerBadge(a))
    if (bestsellerPriority !== 0) return bestsellerPriority

    return 0
  })
}
