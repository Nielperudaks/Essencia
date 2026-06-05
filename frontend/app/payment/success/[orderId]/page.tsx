import type { Metadata } from "next"
import PaymentSuccessPage from "./payment-success-client"
import { noIndexMetadata } from "@/lib/seo"

type PaymentSuccessPageProps = {
  params: Promise<{ orderId: string }>
}

export const metadata: Metadata = noIndexMetadata(
  "Payment Submitted",
  "View a private Essencia payment confirmation.",
)

export default function Page({ params }: PaymentSuccessPageProps) {
  return <PaymentSuccessPage params={params} />
}
