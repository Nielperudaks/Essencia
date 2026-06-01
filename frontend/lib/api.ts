export const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || ""
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL || ""

export type Product = {
  id: string
  name: string
  description: string
  price: number
  originalPrice: number | null
  image: string
  badge: string | null
  category: string
  gender: "Male" | "Female" | "All Genders"
  stock: number
  size: string
}

export type ProductPage = {
  items: Product[]
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

export type ProductListOptions = {
  category?: string
  gender?: string
  limit?: number
  offset?: number
}

export type Bank = {
  id: string
  name: string
  account_name: string
  account_number: string
  qr_image: string
}

export type OrderItem = {
  id: string
  name: string
  description?: string
  price: number
  quantity: number
  image: string
  size?: string
}

export type Order = {
  id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  customer_address: string
  province: string
  town_city: string
  barangay: string
  street_house_no: string
  zipcode: string
  facebook_account: string
  waybill: string
  shipping_mode: "LBC" | "J&T"
  shipment_fee: number
  items: OrderItem[]
  subtotal: number
  total: number
  bank_id: string | null
  bank_name: string
  payment_proof: string
  status: "pending" | "confirmed" | "rejected" | "shipped" | "received"
  created_at: string
  confirmed_at: string | null
  shipped_at: string | null
  received_at: string | null
}

async function http<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
    cache: "no-store",
  })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    let detail = text
    try {
      detail = JSON.parse(text)?.detail || text
    } catch {}
    throw new Error(typeof detail === "string" ? detail : "Request failed")
  }
  return res.json() as Promise<T>
}

function authHeaders(token: string | null): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export const api = {
  // public
  listProducts: (category?: string, gender?: string) => {
    const params = new URLSearchParams()
    if (category && category !== "all") params.set("category", category)
    if (gender && gender !== "all") params.set("gender", gender)
    const query = params.toString()
    return http<Product[]>(`/api/products${query ? `?${query}` : ""}`)
  },
  listProductPage: ({ category, gender, limit = 9, offset = 0 }: ProductListOptions = {}) => {
    const params = new URLSearchParams()
    if (category && category !== "all") params.set("category", category)
    if (gender && gender !== "all") params.set("gender", gender)
    params.set("limit", String(limit))
    params.set("offset", String(offset))
    return http<ProductPage>(`/api/products?${params.toString()}`)
  },
  getProduct: (id: string) => http<Product>(`/api/products/${id}`),
  listBanks: () => http<Bank[]>(`/api/banks`),
  createOrder: (payload: Record<string, unknown>) =>
    http<Order>(`/api/orders`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getPublicOrder: (id: string) => http<Order>(`/api/orders/${id}`),
  markOrderReceived: (id: string) =>
    http<Order>(`/api/orders/${id}/receive`, { method: "POST" }),

  // admin
  login: (email: string, password: string) =>
    http<{ access_token: string; admin: { id: string; email: string; name: string } }>(
      `/api/admin/login`,
      { method: "POST", body: JSON.stringify({ email, password }) }
    ),
  me: (token: string) =>
    http<{ id: string; email: string; name: string }>(`/api/admin/me`, {
      headers: authHeaders(token),
    }),
  createProduct: (token: string, p: Partial<Product>) =>
    http<Product>(`/api/admin/products`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(p),
    }),
  updateProduct: (token: string, id: string, p: Partial<Product>) =>
    http<Product>(`/api/admin/products/${id}`, {
      method: "PUT",
      headers: authHeaders(token),
      body: JSON.stringify(p),
    }),
  deleteProduct: (token: string, id: string) =>
    http<{ deleted: boolean }>(`/api/admin/products/${id}`, {
      method: "DELETE",
      headers: authHeaders(token),
    }),
  createBank: (token: string, b: Partial<Bank>) =>
    http<Bank>(`/api/admin/banks`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(b),
    }),
  updateBank: (token: string, id: string, b: Partial<Bank>) =>
    http<Bank>(`/api/admin/banks/${id}`, {
      method: "PUT",
      headers: authHeaders(token),
      body: JSON.stringify(b),
    }),
  deleteBank: (token: string, id: string) =>
    http<{ deleted: boolean }>(`/api/admin/banks/${id}`, {
      method: "DELETE",
      headers: authHeaders(token),
    }),
  listOrders: (token: string) =>
    http<Order[]>(`/api/admin/orders`, { headers: authHeaders(token) }),
  getOrder: (token: string, id: string) =>
    http<Order>(`/api/admin/orders/${id}`, { headers: authHeaders(token) }),
  confirmOrder: (token: string, id: string) =>
    http<Order>(`/api/admin/orders/${id}/confirm`, {
      method: "POST",
      headers: authHeaders(token),
    }),
  confirmShipping: (token: string, id: string, waybill: string) =>
    http<Order>(`/api/admin/orders/${id}/ship`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({ waybill }),
    }),
  rejectOrder: (token: string, id: string) =>
    http<Order>(`/api/admin/orders/${id}/reject`, {
      method: "POST",
      headers: authHeaders(token),
    }),
}

export function wsUrl(path: string): string {
  const explicit = WS_URL.replace(/\/$/, "")
  if (explicit) return `${explicit}${path}`
  if (API_URL.startsWith("http")) return `${API_URL.replace(/^http/, "ws").replace(/\/$/, "")}${path}`
  if (typeof window !== "undefined") {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
    return `${protocol}//${window.location.host}${path}`
  }
  return path
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
