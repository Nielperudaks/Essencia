import { calculatePromoDiscount } from "./promo-discount"

function assertEqual(actual: number, expected: number) {
  if (actual !== expected) throw new Error(`Expected ${expected}, got ${actual}`)
}

assertEqual(calculatePromoDiscount(25, 200), 50)
assertEqual(calculatePromoDiscount(25, 400), 100)
assertEqual(calculatePromoDiscount(undefined, 400), 0)
