"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { CheckCircle2, ClipboardList, PackageCheck, Search, Truck } from "lucide-react"
import { Header } from "@/components/blocks/header"
import { Footer } from "@/components/blocks/footer"
import { api, type Order } from "@/lib/api"

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

export default function StatusPage() {
  return (
    <Suspense fallback={<main className="min-h-screen"><Header /><div className="pt-40 text-center text-muted-foreground">Loading...</div><Footer /></main>}>
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
    <main className="min-h-screen" data-testid="status-page">
      <Header />
      <div className="pt-28 pb-24">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="text-sm tracking-[0.3em] uppercase text-primary mb-3 block">Order Status</span>
            <h1 className="font-serif text-4xl md:text-5xl text-foreground">Track Your Order</h1>
          </div>

          <section className="bg-card rounded-3xl p-6 blocks-shadow mb-8">
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
                className="flex-1 px-4 py-3 rounded-full bg-background border border-border focus:outline-none focus:border-primary"
                data-testid="order-id-input"
              />
              <button
                type="button"
                onClick={() => lookup()}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-7 py-3 rounded-full font-medium hover:bg-primary/90 disabled:opacity-50"
                data-testid="lookup-order-btn"
              >
                <Search className="w-4 h-4" />
                {loading ? "Checking..." : "Confirm"}
              </button>
            </div>
            {error && <div className="mt-4 text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-2xl" data-testid="status-error">{error}</div>}
          </section>

          {order && (
            <div className="grid lg:grid-cols-[1fr_360px] gap-8" data-testid="order-status-details">
              <section className="space-y-6">
                <div className="bg-card rounded-3xl p-6 blocks-shadow">
                  <h2 className="font-serif text-2xl mb-4">Order Details</h2>
                  <div className="grid sm:grid-cols-2 gap-4 text-sm">
                    <Info label="Order ID" value={order.id} />
                    <Info label="Status" value={order.status} />
                    <Info label="Name" value={order.customer_name} />
                    <Info label="Email" value={order.customer_email} />
                    <Info label="Phone" value={order.customer_phone || "-"} />
                    <Info label="Facebook" value={order.facebook_account || "-"} />
                    <Info label="Shipping Mode" value={order.shipping_mode} />
                    <Info label="Waybill" value={order.waybill || "Not available yet"} />
                    <Info label="Address" value={order.customer_address || "-"} />
                    <Info label="Submitted" value={new Date(order.created_at).toLocaleString()} />
                  </div>
                </div>

                <div className="bg-card rounded-3xl p-6 blocks-shadow">
                  <h2 className="font-serif text-2xl mb-4">Items</h2>
                  <div className="space-y-3">
                    {order.items.map((item, idx) => (
                      <div key={`${item.id}-${idx}`} className="flex items-center justify-between bg-background rounded-2xl p-3">
                        <div>
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-xs text-muted-foreground">Qty {item.quantity}{item.size ? ` • ${item.size}` : ""}</p>
                        </div>
                        <span className="font-medium text-sm">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between pt-4 mt-3 border-t border-border font-medium">
                    <span>Total</span>
                    <span>${order.total.toFixed(2)}</span>
                  </div>
                </div>
              </section>

              <aside className="bg-card rounded-3xl p-6 blocks-shadow h-fit">
                <h2 className="font-serif text-2xl mb-5">Progress</h2>
                <div className="space-y-4 mb-6">
                  {STATUS_STEPS.map((step, index) => {
                    const active = order.status !== "rejected" && index <= STATUS_INDEX[order.status]
                    return (
                      <div key={step.key} className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center ${active ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
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
                  <p className="text-sm text-destructive bg-destructive/10 p-4 rounded-2xl mb-5">This order was rejected. Please contact the store for help.</p>
                )}

                {order.status === "shipped" && (
                  <button
                    type="button"
                    onClick={markReceived}
                    disabled={receiving}
                    className="w-full inline-flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-full font-medium hover:bg-green-700 disabled:opacity-50"
                    data-testid="order-received-btn"
                  >
                    <PackageCheck className="w-4 h-4" />
                    {receiving ? "Updating..." : "Order received"}
                  </button>
                )}

                {order.status === "received" && (
                  <p className="text-sm text-green-700 bg-green-100 p-4 rounded-2xl">Thank you. This order has been marked as received.</p>
                )}

                <Link href="/shop" className="mt-4 inline-flex w-full items-center justify-center border border-border py-3 rounded-full text-sm hover:bg-muted">
                  Continue Shopping
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
