"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { Package, CreditCard, ClipboardList, LogOut, Plus, Pencil, Trash2, Check, X, Eye, Bell, Truck } from "lucide-react"
import { useAdminAuth } from "@/components/admin/admin-auth-context"
import { api, fileToBase64, wsUrl, type Product, type Bank, type Order } from "@/lib/api"
import { formatCurrency } from "@/lib/currency"

type Tab = "products" | "banks" | "orders"

export default function AdminDashboard() {
  const { admin, token, logout, loading } = useAdminAuth()
  const [tab, setTab] = useState<Tab>("orders")
  const [products, setProducts] = useState<Product[]>([])
  const [banks, setBanks] = useState<Bank[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [refreshTick, setRefreshTick] = useState(0)

  const refresh = useCallback(() => setRefreshTick((t) => t + 1), [])

  useEffect(() => {
    if (!token) return
    api.listProducts().then(setProducts).catch(() => {})
    api.listBanks().then(setBanks).catch(() => {})
    api.listOrders(token).then(setOrders).catch(() => {})
  }, [token, refreshTick])

  useEffect(() => {
    if (!token) return
    let active = true
    const socket = new WebSocket(wsUrl(`/ws/admin?token=${encodeURIComponent(token)}`))
    socket.onmessage = (event) => {
      if (!active) return
      const message = JSON.parse(event.data) as { type?: string }
      if (message.type?.startsWith("order.")) {
        api.listOrders(token).then(setOrders).catch(() => {})
      }
      if (message.type === "products.changed") {
        api.listProducts().then(setProducts).catch(() => {})
      }
      if (message.type === "banks.changed") {
        api.listBanks().then(setBanks).catch(() => {})
      }
    }
    return () => {
      active = false
      socket.close()
    }
  }, [token])

  if (loading || !token || !admin) return null

  const pendingCount = orders.filter((o) => o.status === "pending").length

  return (
    <main className="min-h-screen bg-background" data-testid="admin-dashboard">
      {/* Top bar */}
      <header className="border-b border-border bg-card sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/admin" className="font-serif text-2xl tracking-wider text-foreground">
            Essencia <span className="text-primary text-sm tracking-widest uppercase ml-2">admin</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground hidden sm:block">
              View Store →
            </Link>
            <span className="text-sm text-foreground hidden md:block">Hi, {admin.name}</span>
            <button
              type="button"
              onClick={logout}
              data-testid="admin-logout-btn"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm bg-muted hover:bg-muted/70 blocks-transition"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8" data-testid="admin-tabs">
          <TabButton active={tab === "orders"} onClick={() => setTab("orders")} icon={<ClipboardList className="w-4 h-4" />} label="Orders" badge={pendingCount} testid="tab-orders" />
          <TabButton active={tab === "products"} onClick={() => setTab("products")} icon={<Package className="w-4 h-4" />} label="Products" testid="tab-products" />
          <TabButton active={tab === "banks"} onClick={() => setTab("banks")} icon={<CreditCard className="w-4 h-4" />} label="Banks" testid="tab-banks" />
        </div>

        {tab === "orders" && <OrdersPanel orders={orders} token={token} onRefresh={refresh} />}
        {tab === "products" && <ProductsPanel products={products} token={token} onRefresh={refresh} />}
        {tab === "banks" && <BanksPanel banks={banks} token={token} onRefresh={refresh} />}
      </div>
    </main>
  )
}

function TabButton({ active, onClick, icon, label, badge, testid }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; badge?: number; testid: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testid}
      className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium blocks-transition ${
        active ? "bg-foreground text-background" : "bg-card text-foreground hover:bg-muted"
      }`}
    >
      {icon}
      {label}
      {!!badge && badge > 0 && (
        <span className="ml-1 inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-[10px] rounded-full bg-destructive text-white" data-testid={`${testid}-badge`}>
          {badge}
        </span>
      )}
    </button>
  )
}

/* ---------- ORDERS ---------- */
function OrdersPanel({ orders, token, onRefresh }: { orders: Order[]; token: string; onRefresh: () => void }) {
  const [selected, setSelected] = useState<Order | null>(null)
  const [busy, setBusy] = useState(false)

  async function confirm(id: string) {
    setBusy(true)
    try {
      await api.confirmOrder(token, id)
      onRefresh()
      setSelected(null)
    } finally {
      setBusy(false)
    }
  }
  async function reject(id: string) {
    setBusy(true)
    try {
      await api.rejectOrder(token, id)
      onRefresh()
      setSelected(null)
    } finally {
      setBusy(false)
    }
  }
  async function ship(id: string, waybill: string, shipmentFee: number) {
    setBusy(true)
    try {
      await api.confirmShipping(token, id, waybill, shipmentFee)
      onRefresh()
      setSelected(null)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div data-testid="orders-panel">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-serif text-3xl">Orders</h2>
        <div className="text-sm text-muted-foreground inline-flex items-center gap-2">
          <Bell className="w-4 h-4" />
          {orders.filter(o => o.status === "pending").length} pending
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-card rounded-3xl p-16 text-center text-muted-foreground">
          No orders yet.
        </div>
      ) : (
        <div className="bg-card rounded-3xl overflow-hidden blocks-shadow">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr className="text-left">
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Items</th>
                <th className="px-5 py-3 font-medium">Total</th>
                <th className="px-5 py-3 font-medium">Bank</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-border" data-testid={`order-row-${o.id}`}>
                  <td className="px-5 py-4">
                    <div className="font-medium text-foreground">{o.customer_name}</div>
                    <div className="text-xs text-muted-foreground">{o.customer_email}</div>
                  </td>
                  <td className="px-5 py-4">{o.items.reduce((s, i) => s + i.quantity, 0)}</td>
                  <td className="px-5 py-4 font-medium">{formatCurrency(o.total)}</td>
                  <td className="px-5 py-4">{o.bank_name}</td>
                  <td className="px-5 py-4">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => setSelected(o)}
                      data-testid={`view-order-${o.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-foreground text-background hover:opacity-90"
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <OrderDrawer
          order={selected}
          onClose={() => setSelected(null)}
          onConfirm={() => confirm(selected.id)}
          onReject={() => reject(selected.id)}
          onShip={(waybill, shipmentFee) => ship(selected.id, waybill, shipmentFee)}
          busy={busy}
        />
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800",
    confirmed: "bg-green-100 text-green-800",
    shipped: "bg-blue-100 text-blue-800",
    received: "bg-teal-100 text-teal-800",
    rejected: "bg-red-100 text-red-800",
  }
  return <span className={`px-2.5 py-1 rounded-full text-xs ${map[status] || "bg-muted text-foreground"}`}>{status}</span>
}

function OrderDrawer({
  order,
  onClose,
  onConfirm,
  onReject,
  onShip,
  busy,
}: {
  order: Order
  onClose: () => void
  onConfirm: () => void
  onReject: () => void
  onShip: (waybill: string, shipmentFee: number) => void
  busy: boolean
}) {
  const [shippingWaybill, setShippingWaybill] = useState(order.waybill || "")
  const [shippingFee, setShippingFee] = useState("")
  const [shippingError, setShippingError] = useState<string | null>(null)

  function submitShipping() {
    const trimmed = shippingWaybill.trim()
    if (!trimmed) {
      setShippingError("Waybill is required")
      return
    }
    const fee = Number.parseFloat(shippingFee)
    if (!Number.isFinite(fee) || fee < 0) {
      setShippingError("Shipment fee is required")
      return
    }
    setShippingError(null)
    onShip(trimmed, fee)
  }

  return (
    <div className="fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center p-4" onClick={onClose} data-testid="order-detail-modal">
      <div className="bg-card rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <h3 className="font-serif text-2xl">Order Details</h3>
          <button type="button" onClick={onClose} className="p-2 hover:bg-muted rounded-full"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <Field label="Order ID" value={order.id} />
            <Field label="Status" value={order.status} />
            <Field label="Customer" value={order.customer_name} />
            <Field label="Email" value={order.customer_email} />
            <Field label="Phone" value={order.customer_phone || "—"} />
            <Field label="Facebook" value={order.facebook_account || "—"} />
            <Field label="Bank" value={order.bank_name} />
            <Field label="Shipping Mode" value={order.shipping_mode || "—"} />
            <Field label="Waybill" value={order.waybill || "—"} />
            <Field label="Shipment Fee" value={formatCurrency(order.shipment_fee || 0)} />
            <Field label="Province" value={order.province || "—"} />
            <Field label="Town/City" value={order.town_city || "—"} />
            <Field label="Barangay" value={order.barangay || "—"} />
            <Field label="Street/House No." value={order.street_house_no || "—"} />
            <Field label="Zipcode" value={order.zipcode || "—"} />
            <Field label="Full Address" value={order.customer_address || "—"} />
            <Field label="Created" value={new Date(order.created_at).toLocaleString()} />
          </div>

          <div>
            <h4 className="font-medium mb-3">Items</h4>
            <div className="space-y-2">
              {order.items.map((i, idx) => (
                <div key={idx} className="flex items-center justify-between bg-background rounded-2xl p-3">
                  <div className="flex items-center gap-3">
                    {i.image && (
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={i.image} alt={i.name} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-sm">{i.name}</div>
                      <div className="text-xs text-muted-foreground">Qty: {i.quantity}</div>
                    </div>
                  </div>
                  <div className="font-medium text-sm">{formatCurrency(i.price * i.quantity)}</div>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-3 pt-3 border-t border-border font-medium">
              <span>Total</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-3">Payment Proof</h4>
            {order.payment_proof ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={order.payment_proof} alt="payment proof" className="w-full max-h-96 object-contain rounded-2xl bg-background" data-testid="order-proof-image" />
            ) : (
              <p className="text-sm text-muted-foreground">No proof uploaded.</p>
            )}
          </div>

          {order.status === "pending" && (
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onConfirm}
                disabled={busy}
                data-testid="confirm-payment-btn"
                className="flex-1 inline-flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-full font-medium hover:bg-green-700 disabled:opacity-50"
              >
                <Check className="w-4 h-4" /> Confirm Payment
              </button>
              <button
                type="button"
                onClick={onReject}
                disabled={busy}
                data-testid="reject-payment-btn"
                className="flex-1 inline-flex items-center justify-center gap-2 bg-destructive text-white py-3 rounded-full font-medium hover:opacity-90 disabled:opacity-50"
              >
                <X className="w-4 h-4" /> Reject
              </button>
            </div>
          )}

          {order.status === "confirmed" && (
            <div className="bg-background rounded-2xl p-4 space-y-3">
              <h4 className="font-medium">Shipment</h4>
              <input
                type="text"
                value={shippingWaybill}
                onChange={(e) => setShippingWaybill(e.target.value)}
                placeholder="Waybill *"
                className="w-full px-4 py-3 rounded-full bg-card border border-border focus:outline-none focus:border-primary"
                data-testid="shipping-waybill-input"
              />
              <input
                type="number"
                min="0"
                step="0.01"
                value={shippingFee}
                onChange={(e) => setShippingFee(e.target.value)}
                placeholder="Shipment Fee *"
                className="w-full px-4 py-3 rounded-full bg-card border border-border focus:outline-none focus:border-primary"
                data-testid="shipping-fee-input"
              />
              {shippingError && <p className="text-sm text-destructive">{shippingError}</p>}
              <button
                type="button"
                onClick={submitShipping}
                disabled={busy}
                data-testid="confirm-shipping-btn"
                className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-full font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                <Truck className="w-4 h-4" /> Confirm Shipping
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">{label}</div>
      <div className="text-foreground break-words">{value}</div>
    </div>
  )
}

/* ---------- PRODUCTS ---------- */
function ProductsPanel({ products, token, onRefresh }: { products: Product[]; token: string; onRefresh: () => void }) {
  const [editing, setEditing] = useState<Product | null>(null)
  const [creating, setCreating] = useState(false)

  async function remove(id: string) {
    if (!confirm("Delete this product?")) return
    await api.deleteProduct(token, id)
    onRefresh()
  }

  return (
    <div data-testid="products-panel">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-serif text-3xl">Products</h2>
        <button
          type="button"
          onClick={() => setCreating(true)}
          data-testid="add-product-btn"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-sm font-medium hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      <div className="bg-card rounded-3xl overflow-hidden blocks-shadow">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr className="text-left">
              <th className="px-5 py-3 font-medium">Image</th>
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Category</th>
              <th className="px-5 py-3 font-medium">Gender</th>
              <th className="px-5 py-3 font-medium">Price</th>
              <th className="px-5 py-3 font-medium">Stock</th>
              <th className="px-5 py-3 font-medium">Size</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-10 text-muted-foreground">No products yet.</td></tr>
            ) : products.map((p) => (
              <tr key={p.id} className="border-t border-border" data-testid={`product-row-${p.id}`}>
                <td className="px-5 py-3">
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted">
                    {p.image && <Image src={p.image} alt={p.name} fill className="object-cover" />}
                  </div>
                </td>
                <td className="px-5 py-3">{p.name}</td>
                <td className="px-5 py-3">{p.category}</td>
                <td className="px-5 py-3">{p.gender}</td>
                <td className="px-5 py-3">{formatCurrency(p.price)}</td>
                <td className="px-5 py-3">
                  <span className={p.stock <= 0 ? "text-destructive" : ""}>{p.stock}</span>
                </td>
                <td className="px-5 py-3">{p.size}</td>
                <td className="px-5 py-3 text-right space-x-2">
                  <button type="button" onClick={() => setEditing(p)} data-testid={`edit-product-${p.id}`} className="p-2 rounded-full hover:bg-muted">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => remove(p.id)} data-testid={`delete-product-${p.id}`} className="p-2 rounded-full hover:bg-destructive/10 text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(creating || editing) && (
        <ProductForm
          token={token}
          initial={editing}
          onClose={() => { setCreating(false); setEditing(null) }}
          onSaved={() => { setCreating(false); setEditing(null); onRefresh() }}
        />
      )}
    </div>
  )
}

function ProductForm({ token, initial, onClose, onSaved }: { token: string; initial: Product | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(initial?.name || "")
  const [description, setDescription] = useState(initial?.description || "")
  const [price, setPrice] = useState(initial?.price?.toString() || "")
  const [stock, setStock] = useState(initial?.stock?.toString() || "0")
  const [size, setSize] = useState(initial?.size || "")
  const [category, setCategory] = useState(initial?.category || "Perfumes")
  const [gender, setGender] = useState<Product["gender"]>(initial?.gender || "All Genders")
  const [badge, setBadge] = useState(initial?.badge || "")
  const [image, setImage] = useState(initial?.image || "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleImage(file: File | null) {
    if (!file) return
    if (file.size > 4 * 1024 * 1024) { setError("Image must be under 4MB"); return }
    const b64 = await fileToBase64(file)
    setImage(b64)
  }

  async function save() {
    setError(null)
    if (!name || !price) { setError("Name and price are required"); return }
    setSaving(true)
    try {
      const payload = {
        name,
        description,
        price: parseFloat(price),
        stock: parseInt(stock) || 0,
        size,
        category,
        gender,
        badge: badge || null,
        image,
      }
      if (initial) await api.updateProduct(token, initial.id, payload)
      else await api.createProduct(token, payload)
      onSaved()
    } catch (e) {
      const err = e as Error
      setError(err.message || "Save failed")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center p-4" onClick={onClose} data-testid="product-form-modal">
      <div className="bg-card rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <h3 className="font-serif text-2xl">{initial ? "Edit Product" : "New Product"}</h3>
          <button type="button" onClick={onClose} className="p-2 hover:bg-muted rounded-full"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <input data-testid="product-name-input" className="w-full px-4 py-3 rounded-full bg-background border border-border focus:outline-none focus:border-primary" placeholder="Product name *" value={name} onChange={(e) => setName(e.target.value)} />
          <textarea data-testid="product-description-input" className="w-full px-4 py-3 rounded-2xl bg-background border border-border focus:outline-none focus:border-primary min-h-24" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
          <div className="grid sm:grid-cols-2 gap-3">
            <input data-testid="product-price-input" type="number" step="0.01" className="px-4 py-3 rounded-full bg-background border border-border" placeholder="Price *" value={price} onChange={(e) => setPrice(e.target.value)} />
            <input data-testid="product-stock-input" type="number" className="px-4 py-3 rounded-full bg-background border border-border" placeholder="Stock" value={stock} onChange={(e) => setStock(e.target.value)} />
            <input data-testid="product-size-input" className="px-4 py-3 rounded-full bg-background border border-border" placeholder="Size (e.g. 100ml)" value={size} onChange={(e) => setSize(e.target.value)} />
            <select data-testid="product-category-input" className="px-4 py-3 rounded-full bg-background border border-border" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="Perfumes">Perfumes</option>
              <option value="Makeup">Makeup</option>
              <option value="Skincare">Skincare</option>
              <option value="Others">Others</option>
            </select>
            <select data-testid="product-gender-input" className="px-4 py-3 rounded-full bg-background border border-border" value={gender} onChange={(e) => setGender(e.target.value as Product["gender"])}>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="All Genders">All Genders</option>
            </select>
            <select data-testid="product-badge-input" className="px-4 py-3 rounded-full bg-background border border-border sm:col-span-2" value={badge} onChange={(e) => setBadge(e.target.value)}>
              <option value="">No badge</option>
              <option value="Bestseller">Bestseller</option>
              <option value="New">New</option>
              <option value="Sale">Sale</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium block mb-2">Product Image</label>
            <label htmlFor="product-image-file" data-testid="product-image-upload-label" className="cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-background border border-dashed border-border hover:border-primary text-sm">
              <Plus className="w-4 h-4" /> Upload image
            </label>
            <input id="product-image-file" type="file" accept="image/*" className="hidden" onChange={(e) => handleImage(e.target.files?.[0] || null)} data-testid="product-image-upload" />
            {image && (
              <div className="mt-3 relative w-40 h-40 rounded-2xl overflow-hidden bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image} alt="preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {error && <div className="text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-2xl">{error}</div>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-full border border-border hover:bg-muted">Cancel</button>
            <button type="button" onClick={save} disabled={saving} data-testid="product-save-btn" className="flex-1 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50">
              {saving ? "Saving..." : "Save Product"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------- BANKS ---------- */
function BanksPanel({ banks, token, onRefresh }: { banks: Bank[]; token: string; onRefresh: () => void }) {
  const [editing, setEditing] = useState<Bank | null>(null)
  const [creating, setCreating] = useState(false)

  async function remove(id: string) {
    if (!confirm("Delete this bank?")) return
    await api.deleteBank(token, id)
    onRefresh()
  }

  return (
    <div data-testid="banks-panel">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-serif text-3xl">Banks &amp; QR Codes</h2>
        <button
          type="button"
          onClick={() => setCreating(true)}
          data-testid="add-bank-btn"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-sm font-medium hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" /> Add Bank
        </button>
      </div>

      {banks.length === 0 ? (
        <div className="bg-card rounded-3xl p-16 text-center text-muted-foreground">
          No banks yet. Add your first payment option.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {banks.map((b) => (
            <div key={b.id} className="bg-card rounded-3xl p-5 blocks-shadow" data-testid={`bank-card-${b.id}`}>
              <div className="aspect-square rounded-2xl bg-background border border-border mb-4 flex items-center justify-center overflow-hidden">
                {b.qr_image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={b.qr_image} alt={b.name} className="w-full h-full object-contain" />
                ) : (
                  <span className="text-xs text-muted-foreground">No QR uploaded</span>
                )}
              </div>
              <h3 className="font-medium text-lg">{b.name}</h3>
              <p className="text-xs text-muted-foreground">{b.account_name}</p>
              <p className="text-xs text-muted-foreground font-mono">{b.account_number}</p>
              <div className="flex gap-2 mt-4">
                <button type="button" onClick={() => setEditing(b)} data-testid={`edit-bank-${b.id}`} className="flex-1 py-2 rounded-full text-xs bg-muted hover:bg-muted/70 inline-flex items-center justify-center gap-1">
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
                <button type="button" onClick={() => remove(b.id)} data-testid={`delete-bank-${b.id}`} className="flex-1 py-2 rounded-full text-xs bg-destructive/10 text-destructive hover:bg-destructive/20 inline-flex items-center justify-center gap-1">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {(creating || editing) && (
        <BankForm
          token={token}
          initial={editing}
          onClose={() => { setCreating(false); setEditing(null) }}
          onSaved={() => { setCreating(false); setEditing(null); onRefresh() }}
        />
      )}
    </div>
  )
}

function BankForm({ token, initial, onClose, onSaved }: { token: string; initial: Bank | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(initial?.name || "")
  const [accountName, setAccountName] = useState(initial?.account_name || "")
  const [accountNumber, setAccountNumber] = useState(initial?.account_number || "")
  const [qr, setQr] = useState(initial?.qr_image || "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleQr(file: File | null) {
    if (!file) return
    if (file.size > 4 * 1024 * 1024) { setError("Image must be under 4MB"); return }
    const b64 = await fileToBase64(file)
    setQr(b64)
  }

  async function save() {
    setError(null)
    if (!name) { setError("Bank name is required"); return }
    setSaving(true)
    try {
      const payload = { name, account_name: accountName, account_number: accountNumber, qr_image: qr }
      if (initial) await api.updateBank(token, initial.id, payload)
      else await api.createBank(token, payload)
      onSaved()
    } catch (e) {
      const err = e as Error
      setError(err.message || "Save failed")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center p-4" onClick={onClose} data-testid="bank-form-modal">
      <div className="bg-card rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <h3 className="font-serif text-2xl">{initial ? "Edit Bank" : "New Bank"}</h3>
          <button type="button" onClick={onClose} className="p-2 hover:bg-muted rounded-full"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <input data-testid="bank-name-input" className="w-full px-4 py-3 rounded-full bg-background border border-border" placeholder="Bank name * (e.g. BDO)" value={name} onChange={(e) => setName(e.target.value)} />
          <input data-testid="bank-account-name-input" className="w-full px-4 py-3 rounded-full bg-background border border-border" placeholder="Account holder name" value={accountName} onChange={(e) => setAccountName(e.target.value)} />
          <input data-testid="bank-account-number-input" className="w-full px-4 py-3 rounded-full bg-background border border-border" placeholder="Account number" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
          <div>
            <label className="text-sm font-medium block mb-2">QR Code Image</label>
            <label htmlFor="bank-qr-file" data-testid="bank-qr-upload-label" className="cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-background border border-dashed border-border hover:border-primary text-sm">
              <Plus className="w-4 h-4" /> Upload QR
            </label>
            <input id="bank-qr-file" type="file" accept="image/*" className="hidden" onChange={(e) => handleQr(e.target.files?.[0] || null)} data-testid="bank-qr-upload" />
            {qr && (
              <div className="mt-3 relative w-40 h-40 rounded-2xl overflow-hidden bg-white border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qr} alt="qr preview" className="w-full h-full object-contain" />
              </div>
            )}
          </div>

          {error && <div className="text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-2xl">{error}</div>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-full border border-border hover:bg-muted">Cancel</button>
            <button type="button" onClick={save} disabled={saving} data-testid="bank-save-btn" className="flex-1 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50">
              {saving ? "Saving..." : "Save Bank"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
