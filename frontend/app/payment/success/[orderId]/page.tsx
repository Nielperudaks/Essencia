"use client"

import { use } from "react"
import Link from "next/link"
import { CheckCircle2 } from "lucide-react"
import { Header } from "@/components/blocks/header"
import { Footer } from "@/components/blocks/footer"

export default function PaymentSuccessPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params)
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
            The admin has been notified and will confirm your payment shortly. You&apos;ll receive your products soon.
          </p>
          <Link
            href="/shop"
            data-testid="continue-shopping-btn"
            className="inline-flex items-center justify-center bg-primary text-primary-foreground px-8 py-4 rounded-full text-sm tracking-wide hover:bg-primary/90 blocks-transition"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
      <Footer />
    </main>
  )
}
