import type { Metadata } from "next"
import StatusPage from "./status-client"
import { noIndexMetadata } from "@/lib/seo"

export const metadata: Metadata = noIndexMetadata(
  "Track Your Order",
  "Track an Essencia order using your private order ID.",
)

export default function Page() {
  return <StatusPage />
}
