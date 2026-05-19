"use client"

import { use, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { CheckCircle2, MessageCircle, Search } from "lucide-react"
import { Header } from "@/components/blocks/header"
import { Footer } from "@/components/blocks/footer"
import { api, type Order } from "@/lib/api"

const FACEBOOK_PAGE = process.env.NEXT_PUBLIC_FACEBOOK_PAGE_USERNAME || process.env.NEXT_PUBLIC_FACEBOOK_PAGE_ID || "essencia"

export default function PaymentSuccessPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params)
  const [order, setOrder] = useState<Order | null>(null)

  useEffect(() => {
    api.getPublicOrder(orderId).then(setOrder).catch(() => setOrder(null))
  }, [orderId])

  const messengerUrl = useMemo(() => {
    const lines = [
      "Hello Essencia, I have submitted my payment proof.",
      `Order ID: ${orderId}`,
      ...(order?.items || []).map((item) => {
        const size = item.size ? ` (${item.size})` : ""
        return `- ${item.name}${size} x ${item.quantity}`
      }),
      order ? `Total: $${order.total.toFixed(2)}` : "",
    ].filter(Boolean)
    return `https://m.me/${encodeURIComponent(FACEBOOK_PAGE)}?text=${encodeURIComponent(lines.join("\n"))}`
  }, [order, orderId])

  return (
    <main className="min-h-screen" data-testid="payment-success-page">
      <Header />
      <div className="pt-40 pb-32">
        <div className="max-w-xl mx-auto px-6 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-6">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="font-serif text-4xl md:text-5xl text-foreground mb-3">Thank you!</h1>
          <p className="text-muted-foreground mb-3">Your payment proof has been submitted.</p>
          <p className="text-sm text-muted-foreground mb-8">
            Order ID: <code className="bg-muted px-2 py-1 rounded">{orderId}</code>
          </p>
          <p className="text-sm text-foreground/80 mb-10">
            The admin has been notified and will confirm your payment shortly. Please open your email to check your order information and status instructions.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href={messengerUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="message-us-btn"
              className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-full text-sm tracking-wide hover:bg-blue-700 blocks-transition"
            >
              <MessageCircle className="w-4 h-4" />
              Message us
            </a>
            <Link
              href={`/status?orderId=${orderId}`}
              data-testid="check-status-btn"
              className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-full text-sm tracking-wide hover:bg-primary/90 blocks-transition"
            >
              <Search className="w-4 h-4" />
              Check Order Status
            </Link>
            <Link
              href="/shop"
              data-testid="continue-shopping-btn"
              className="inline-flex items-center justify-center border border-border px-8 py-4 rounded-full text-sm tracking-wide hover:bg-muted blocks-transition"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
