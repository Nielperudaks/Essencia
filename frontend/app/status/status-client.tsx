"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { CheckCircle2, ClipboardList, MessageCircle, PackageCheck, Search, Truck } from "lucide-react"
import { Header } from "@/components/blocks/header"
import { Footer } from "@/components/blocks/footer"
import { api, wsUrl, type Order } from "@/lib/api"
import { formatCurrency } from "@/lib/currency"

const STATUS_STEPS = [
  { key: "pending", label: "Payment submitted" },
  { key: "confirmed", label: "Payment confirmed" },
  { key: "shipped", label: "Shipped" },
  { key: "received", label: "Received" },
] as const

const STATUS_INDEX: Record<Order["status"], number> = {
  pending: 0,
  rejected: 0,
  confirmed: 1,
  shipped: 2,
  received: 3,
}

const messengerUrl = `https://m.me/${encodeURIComponent(process.env.NEXT_PUBLIC_FACEBOOK_PAGE_ID || "essencia")}`

export default function StatusPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-background"><Header /><div className="pt-40 text-center text-muted-foreground">Loading...</div><Footer /></main>}>
      <StatusContent />
    </Suspense>
  )
}

function StatusContent() {
  const searchParams = useSearchParams()
  const [orderId, setOrderId] = useState(searchParams.get("orderId") || "")
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(false)
  const [receiving, setReceiving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initialOrderId = searchParams.get("orderId")
    if (initialOrderId) {
      lookup(initialOrderId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  useEffect(() => {
    if (!order?.id) return
    let active = true
    const socket = new WebSocket(wsUrl(`/ws/orders/${order.id}`))
    socket.onmessage = (event) => {
      if (!active) return
      const message = JSON.parse(event.data) as { order?: Order }
      if (message.order?.id === order.id) {
        setOrder(message.order)
      }
    }
    return () => {
      active = false
      socket.close()
    }
  }, [order?.id])

  async function lookup(id = orderId) {
    const trimmed = id.trim()
    setError(null)
    setOrder(null)
    if (!trimmed) {
      setError("Please enter your order ID")
      return
    }
    setLoading(true)
    try {
      const data = await api.getPublicOrder(trimmed)
      setOrder(data)
      setOrderId(trimmed)
    } catch (e) {
      const err = e as Error
      setError(err.message || "Order not found")
    } finally {
      setLoading(false)
    }
  }

  async function markReceived() {
    if (!order) return
    setReceiving(true)
    setError(null)
    try {
      const updated = await api.markOrderReceived(order.id)
      setOrder(updated)
    } catch (e) {
      const err = e as Error
      setError(err.message || "Unable to mark order received")
    } finally {
      setReceiving(false)
    }
  }

  return (
    <main className="min-h-screen bg-background" data-testid="status-page">
      <Header />
      <div className="pt-32 pb-24">
        <div className="mx-auto w-full max-w-5xl px-5 sm:px-6 lg:px-8">
          <div className="mb-10 grid gap-6 lg:grid-cols-[1fr_320px] lg:items-end">
            <div>
              <span className="storefront-kicker">Order Status</span>
              <h1 className="storefront-heading">Track your order.</h1>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              Enter your order ID to follow confirmation, shipping, and receipt in real time.
            </p>
          </div>

          <section className="storefront-card mb-8 p-6">
            <label htmlFor="order-id" className="text-sm font-medium text-foreground mb-2 block">
              Order ID
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                id="order-id"
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="Enter your order ID"
                className="storefront-input flex-1"
                data-testid="order-id-input"
              />
              <button
                type="button"
                onClick={() => lookup()}
                disabled={loading}
                className="storefront-button px-7"
                data-testid="lookup-order-btn"
              >
                <Search className="w-4 h-4" />
                {loading ? "Checking..." : "Confirm"}
              </button>
            </div>
            {error && <div className="mt-4 border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive" data-testid="status-error">{error}</div>}
          </section>

          {order && (
            <div className="grid lg:grid-cols-[1fr_360px] gap-8" data-testid="order-status-details">
              <section className="space-y-6">
                <div className="storefront-card p-6">
                  <h2 className="mb-4 font-serif text-3xl font-semibold">Order details</h2>
                  <div className="grid sm:grid-cols-2 gap-4 text-sm">
                    <Info label="Order ID" value={order.id} />
                    <Info label="Status" value={order.status} />
                    <Info label="Name" value={order.customer_name} />
                    <Info label="Email" value={order.customer_email} />
                    <Info label="Phone" value={order.customer_phone || "-"} />
                    <Info label="Facebook" value={order.facebook_account || "-"} />
                    <Info label="Waybill" value={order.waybill || "Not available yet"} />
                    <Info label="Address" value={order.customer_address || "-"} />
                    <Info label="Submitted" value={new Date(order.created_at).toLocaleString()} />
                  </div>
                </div>

                <div className="storefront-card p-6">
                  <h2 className="mb-4 font-serif text-3xl font-semibold">Items</h2>
                  <div className="space-y-3">
                    {order.items.map((item, idx) => (
                      <div key={`${item.id}-${idx}`} className="flex items-center justify-between border border-border bg-background p-3">
                        <div>
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-xs text-muted-foreground">Qty {item.quantity}{item.size ? ` • ${item.size}` : ""}</p>
                        </div>
                        <span className="font-medium text-sm">{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between pt-4 mt-3 border-t border-border font-medium">
                    <span>Total</span>
                    <span>{formatCurrency(order.total)}</span>
                  </div>
                </div>
              </section>

              <aside className="storefront-card h-fit p-6">
                <h2 className="mb-5 font-serif text-3xl font-semibold">Progress</h2>
                <div className="space-y-4 mb-6">
                  {STATUS_STEPS.map((step, index) => {
                    const active = order.status !== "rejected" && index <= STATUS_INDEX[order.status]
                    return (
                      <div key={step.key} className="flex items-center gap-3">
                        <div className={`flex h-9 w-9 items-center justify-center border ${active ? "border-foreground bg-foreground text-background" : "border-border bg-muted text-muted-foreground"}`}>
                          {index === 0 && <ClipboardList className="w-4 h-4" />}
                          {index === 1 && <CheckCircle2 className="w-4 h-4" />}
                          {index === 2 && <Truck className="w-4 h-4" />}
                          {index === 3 && <PackageCheck className="w-4 h-4" />}
                        </div>
                        <span className={active ? "text-foreground" : "text-muted-foreground"}>{step.label}</span>
                      </div>
                    )
                  })}
                </div>

                {order.status === "rejected" && (
                  <p className="mb-5 border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">This order was rejected. Please contact the store for help.</p>
                )}

                {order.status === "shipped" && (
                  <button
                    type="button"
                    onClick={markReceived}
                    disabled={receiving}
                    className="storefront-button w-full"
                    data-testid="order-received-btn"
                  >
                    <PackageCheck className="w-4 h-4" />
                    {receiving ? "Updating..." : "Order received"}
                  </button>
                )}

                {order.status === "received" && (
                  <p className="border border-foreground bg-background p-4 text-sm text-foreground">Thank you. This order has been marked as received.</p>
                )}

                <Link href="/shop" className="storefront-button-outline mt-4 w-full">
                  Continue Shopping
                </Link>
                <Link href={messengerUrl} className="storefront-button mt-4 w-full">
                  <MessageCircle className="w-4 h-4" />
                  Message Us
                </Link>
              </aside>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </main>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">{label}</div>
      <div className="text-foreground break-words">{value}</div>
    </div>
  )
}
