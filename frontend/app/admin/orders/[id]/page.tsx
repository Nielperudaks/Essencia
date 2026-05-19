"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, Check, Truck, X } from "lucide-react"
import { useAdminAuth } from "@/components/admin/admin-auth-context"
import { api, wsUrl, type Order } from "@/lib/api"

export default function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { token, loading: authLoading } = useAdminAuth()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [waybill, setWaybill] = useState("")
  const [shipmentFee, setShipmentFee] = useState("")

  useEffect(() => {
    if (authLoading) return
    if (!token) return
    api.getOrder(token, id)
      .then(setOrder)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false))
  }, [id, token, authLoading])

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

  if (authLoading || loading) {
    return <main className="min-h-screen flex items-center justify-center"><div className="text-muted-foreground">Loading...</div></main>
  }

  if (!order) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-destructive mb-3">{error || "Order not found"}</p>
          <Link href="/admin" className="text-primary underline">Back to dashboard</Link>
        </div>
      </main>
    )
  }

  async function action(kind: "confirm" | "reject") {
    if (!token) return
    setBusy(true)
    try {
      const updated = kind === "confirm"
        ? await api.confirmOrder(token, id)
        : await api.rejectOrder(token, id)
      setOrder(updated)
    } finally {
      setBusy(false)
    }
  }

  async function confirmShipping() {
    if (!token || !waybill.trim()) return
    const fee = Number.parseFloat(shipmentFee)
    if (!Number.isFinite(fee) || fee < 0) return
    setBusy(true)
    try {
      const updated = await api.confirmShipping(token, id, waybill.trim(), fee)
      setOrder(updated)
      setWaybill("")
      setShipmentFee("")
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="min-h-screen bg-background" data-testid="admin-order-detail">
      <header className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/admin" className="inline-flex items-center gap-2 text-sm hover:text-primary">
            <ChevronLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <button type="button" onClick={() => router.push("/admin")} className="text-sm text-muted-foreground">All Orders →</button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 lg:px-8 py-10">
        <h1 className="font-serif text-4xl mb-2">Order #{order.id.slice(0, 8)}</h1>
        <p className="text-muted-foreground mb-8">Submitted {new Date(order.created_at).toLocaleString()}</p>

        <div className="grid lg:grid-cols-[1fr_400px] gap-8">
          <section className="space-y-6">
            <div className="bg-card rounded-3xl p-6 blocks-shadow">
              <h2 className="font-serif text-2xl mb-4">Customer</h2>
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <Info label="Name" value={order.customer_name} />
                <Info label="Email" value={order.customer_email} />
                <Info label="Phone" value={order.customer_phone || "—"} />
                <Info label="Facebook" value={order.facebook_account || "—"} />
                <Info label="Shipping Mode" value={order.shipping_mode || "—"} />
                <Info label="Waybill" value={order.waybill || "—"} />
                <Info label="Shipment Fee" value={`$${(order.shipment_fee || 0).toFixed(2)}`} />
                <Info label="Province" value={order.province || "—"} />
                <Info label="Town/City" value={order.town_city || "—"} />
                <Info label="Barangay" value={order.barangay || "—"} />
                <Info label="Street/House No." value={order.street_house_no || "—"} />
                <Info label="Zipcode" value={order.zipcode || "—"} />
                <Info label="Full Address" value={order.customer_address || "—"} />
              </div>
            </div>

            <div className="bg-card rounded-3xl p-6 blocks-shadow">
              <h2 className="font-serif text-2xl mb-4">Items</h2>
              {order.items.map((i, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    {i.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={i.image} alt={i.name} className="w-14 h-14 rounded-lg object-cover bg-muted" />
                    )}
                    <div>
                      <p className="font-medium text-sm">{i.name}</p>
                      <p className="text-xs text-muted-foreground">Qty {i.quantity} × ${i.price}</p>
                    </div>
                  </div>
                  <span className="font-medium">${(i.price * i.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-between pt-4 mt-2 border-t border-border font-medium text-lg">
                <span>Total</span><span>${order.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-card rounded-3xl p-6 blocks-shadow">
              <h2 className="font-serif text-2xl mb-4">Payment Proof — {order.bank_name}</h2>
              {order.payment_proof ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={order.payment_proof} alt="payment proof" className="w-full max-h-[600px] object-contain rounded-2xl bg-background" data-testid="proof-image" />
              ) : (
                <p className="text-muted-foreground">No proof uploaded.</p>
              )}
            </div>
          </section>

          <aside className="bg-card rounded-3xl p-6 blocks-shadow h-fit sticky top-8">
            <h2 className="font-serif text-2xl mb-4">Status</h2>
            <div className={`inline-block px-4 py-2 rounded-full text-sm mb-5 ${
              order.status === "confirmed" ? "bg-green-100 text-green-800"
              : order.status === "shipped" ? "bg-blue-100 text-blue-800"
              : order.status === "received" ? "bg-teal-100 text-teal-800"
              : order.status === "rejected" ? "bg-red-100 text-red-800"
              : "bg-amber-100 text-amber-800"
            }`} data-testid="order-status">
              {order.status.toUpperCase()}
            </div>

            {order.status === "pending" ? (
              <div className="space-y-3">
                <button type="button" onClick={() => action("confirm")} disabled={busy} data-testid="confirm-btn" className="w-full inline-flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-full font-medium hover:bg-green-700 disabled:opacity-50">
                  <Check className="w-4 h-4" /> Confirm Payment
                </button>
                <button type="button" onClick={() => action("reject")} disabled={busy} data-testid="reject-btn" className="w-full inline-flex items-center justify-center gap-2 bg-destructive text-white py-3 rounded-full font-medium hover:opacity-90 disabled:opacity-50">
                  <X className="w-4 h-4" /> Reject
                </button>
              </div>
            ) : order.status === "confirmed" ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={waybill}
                  onChange={(e) => setWaybill(e.target.value)}
                  placeholder="Waybill *"
                  className="w-full px-4 py-3 rounded-full bg-background border border-border focus:outline-none focus:border-primary"
                  data-testid="shipping-waybill-input"
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={shipmentFee}
                  onChange={(e) => setShipmentFee(e.target.value)}
                  placeholder="Shipment Fee *"
                  className="w-full px-4 py-3 rounded-full bg-background border border-border focus:outline-none focus:border-primary"
                  data-testid="shipping-fee-input"
                />
                <button type="button" onClick={confirmShipping} disabled={busy || !waybill.trim() || !shipmentFee.trim() || Number.parseFloat(shipmentFee) < 0} data-testid="confirm-shipping-btn" className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-full font-medium hover:bg-blue-700 disabled:opacity-50">
                  <Truck className="w-4 h-4" /> Confirm Shipping
                </button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {order.received_at && `Received on ${new Date(order.received_at).toLocaleString()}`}
                {!order.received_at && order.shipped_at && `Shipped on ${new Date(order.shipped_at).toLocaleString()}`}
                {!order.received_at && !order.shipped_at && order.confirmed_at && `Confirmed on ${new Date(order.confirmed_at).toLocaleString()}`}
              </p>
            )}
          </aside>
        </div>
      </div>
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
