import type { Metadata } from "next"
import PaymentPage from "./payment-client"
import { noIndexMetadata } from "@/lib/seo"

export const metadata: Metadata = noIndexMetadata(
  "Checkout",
  "Complete your private Essencia checkout.",
)

export default function Page() {
  return <PaymentPage />
}
