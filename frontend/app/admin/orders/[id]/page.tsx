"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, Check, X } from "lucide-react"
import { useAdminAuth } from "@/components/admin/admin-auth-context"
import { api, type Order } from "@/lib/api"

export default function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { token, loading: authLoading } = useAdminAuth()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return
    if (!token) return
    api.getOrder(token, id)
      .then(setOrder)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false))
  }, [id, token, authLoading])

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
                <Info label="Address" value={order.customer_address || "—"} />
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
            ) : (
              <p className="text-sm text-muted-foreground">
                {order.confirmed_at && `Confirmed on ${new Date(order.confirmed_at).toLocaleString()}`}
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
