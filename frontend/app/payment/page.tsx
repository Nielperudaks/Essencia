"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronDown, Upload, Check, Trash2, Minus, Plus } from "lucide-react"
import { Header } from "@/components/blocks/header"
import { Footer } from "@/components/blocks/footer"
import { useCart } from "@/components/blocks/cart-context"
import { api, fileToBase64, type Bank } from "@/lib/api"

type ShippingMode = "LBC" | "J&T"

const SHIPPING_MODES: ShippingMode[] = ["LBC", "J&T"]

export default function PaymentPage() {
  const router = useRouter()
  const { items, subtotal, removeItem, updateQuantity, clearCart } = useCart()
  const [banks, setBanks] = useState<Bank[]>([])
  const [loadingBanks, setLoadingBanks] = useState(true)
  const [openBankId, setOpenBankId] = useState<string | null>(null)
  const [proofByBank, setProofByBank] = useState<Record<string, { name: string; base64: string }>>({})
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [province, setProvince] = useState("")
  const [townCity, setTownCity] = useState("")
  const [barangay, setBarangay] = useState("")
  const [streetHouseNo, setStreetHouseNo] = useState("")
  const [zipcode, setZipcode] = useState("")
  const [facebookAccount, setFacebookAccount] = useState("")
  const [shippingMode, setShippingMode] = useState<ShippingMode>("LBC")
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.listBanks()
      .then((data) => {
        setBanks(data)
        if (data.length > 0) setOpenBankId(data[0].id)
      })
      .catch(() => setBanks([]))
      .finally(() => setLoadingBanks(false))
  }, [])

  const total = subtotal // free shipping

  async function handleFile(bankId: string, file: File | null) {
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB")
      return
    }
    const b64 = await fileToBase64(file)
    setProofByBank((prev) => ({ ...prev, [bankId]: { name: file.name, base64: b64 } }))
    setError(null)
  }

  async function handleSubmit(bankId: string, bankName: string) {
    setError(null)
    if (items.length === 0) {
      setError("Your cart is empty")
      return
    }
    const requiredFields = [
      name,
      email,
      phone,
      province,
      townCity,
      barangay,
      streetHouseNo,
      zipcode,
      facebookAccount,
      shippingMode,
    ]
    if (requiredFields.some((field) => !field.trim())) {
      setError("Please complete all required customer and shipping fields")
      return
    }
    const proof = proofByBank[bankId]
    if (!proof) {
      setError("Please upload your payment proof")
      return
    }
    setSubmitting(true)
    try {
      const order = await api.createOrder({
        customer_name: name,
        customer_email: email,
        customer_phone: phone,
        province,
        town_city: townCity,
        barangay,
        street_house_no: streetHouseNo,
        zipcode,
        facebook_account: facebookAccount,
        shipping_mode: shippingMode,
        items: items.map((i) => ({
          id: i.id,
          name: i.name,
          description: i.description,
          price: i.price,
          quantity: i.quantity,
          image: i.image,
          size: i.size || "",
        })),
        subtotal,
        total,
        bank_id: bankId,
        bank_name: bankName,
        payment_proof: proof.base64,
      })
      setSuccess(order.id)
      clearCart()
      setTimeout(() => router.push(`/payment/success/${order.id}`), 1200)
    } catch (e) {
      const err = e as Error
      setError(err.message || "Submission failed")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen" data-testid="payment-page">
      <Header />
      <div className="pt-28 pb-24">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground blocks-transition mb-8"
          >
            <ChevronLeft className="w-4 h-4" />
            Continue Shopping
          </Link>

          <div className="text-center mb-12">
            <span className="text-sm tracking-[0.3em] uppercase text-primary mb-3 block">Checkout</span>
            <h1 className="font-serif text-4xl md:text-5xl text-foreground">Complete Your Order</h1>
          </div>

          {success && (
            <div className="mb-6 p-5 rounded-2xl bg-green-100 border border-green-300 text-green-800 flex items-center gap-3" data-testid="payment-success">
              <Check className="w-5 h-5" />
              <div>
                <p className="font-medium">Payment submitted!</p>
                <p className="text-sm opacity-80">Order ID: {success}. The admin has been notified by email.</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-destructive/10 text-destructive text-sm" data-testid="payment-error">
              {error}
            </div>
          )}

          <div className="grid lg:grid-cols-[1fr_420px] gap-10">
            {/* LEFT: cart + customer info + banks */}
            <div className="space-y-8">
              {/* Cart items */}
              <section className="bg-card rounded-3xl p-6 blocks-shadow" data-testid="payment-cart">
                <h2 className="font-serif text-2xl mb-4">Your Items ({items.length})</h2>
                {items.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p className="mb-3">Your cart is empty.</p>
                    <Link href="/shop" className="text-primary underline">Browse products</Link>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {items.map((item) => (
                      <div key={item.id} className="flex gap-4 items-center" data-testid={`cart-item-${item.id}`}>
                        <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                          <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-serif text-base truncate">{item.name}</h3>
                          {item.size && <p className="text-xs text-muted-foreground">Size: {item.size}</p>}
                          <div className="flex items-center gap-3 mt-2">
                            <div className="flex items-center border border-border rounded-full">
                              <button type="button" onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1.5 hover:bg-muted rounded-l-full"><Minus className="w-3 h-3" /></button>
                              <span className="px-3 text-sm">{item.quantity}</span>
                              <button type="button" onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1.5 hover:bg-muted rounded-r-full"><Plus className="w-3 h-3" /></button>
                            </div>
                            <button type="button" onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="text-right font-medium">${(item.price * item.quantity).toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Customer info */}
              <section className="bg-card rounded-3xl p-6 blocks-shadow">
                <h2 className="font-serif text-2xl mb-4">Customer Information</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <input type="text" placeholder="Full name *" value={name} onChange={(e) => setName(e.target.value)} className="px-4 py-3 rounded-full bg-background border border-border focus:outline-none focus:border-primary" data-testid="input-customer-name" />
                  <input type="email" placeholder="Email *" value={email} onChange={(e) => setEmail(e.target.value)} className="px-4 py-3 rounded-full bg-background border border-border focus:outline-none focus:border-primary" data-testid="input-customer-email" />
                  <input type="text" placeholder="Phone *" value={phone} onChange={(e) => setPhone(e.target.value)} className="px-4 py-3 rounded-full bg-background border border-border focus:outline-none focus:border-primary" data-testid="input-customer-phone" />
                  <input type="text" placeholder="Facebook account *" value={facebookAccount} onChange={(e) => setFacebookAccount(e.target.value)} className="px-4 py-3 rounded-full bg-background border border-border focus:outline-none focus:border-primary" data-testid="input-facebook-account" />
                  <input type="text" placeholder="Province *" value={province} onChange={(e) => setProvince(e.target.value)} className="px-4 py-3 rounded-full bg-background border border-border focus:outline-none focus:border-primary" data-testid="input-province" />
                  <input type="text" placeholder="Town/City *" value={townCity} onChange={(e) => setTownCity(e.target.value)} className="px-4 py-3 rounded-full bg-background border border-border focus:outline-none focus:border-primary" data-testid="input-town-city" />
                  <input type="text" placeholder="Barangay *" value={barangay} onChange={(e) => setBarangay(e.target.value)} className="px-4 py-3 rounded-full bg-background border border-border focus:outline-none focus:border-primary" data-testid="input-barangay" />
                  <input type="text" placeholder="Street/house no. *" value={streetHouseNo} onChange={(e) => setStreetHouseNo(e.target.value)} className="px-4 py-3 rounded-full bg-background border border-border focus:outline-none focus:border-primary" data-testid="input-street-house-no" />
                  <input type="text" placeholder="Zipcode *" value={zipcode} onChange={(e) => setZipcode(e.target.value)} className="px-4 py-3 rounded-full bg-background border border-border focus:outline-none focus:border-primary" data-testid="input-zipcode" />
                  <div className="sm:col-span-2">
                    <label htmlFor="shipping-mode" className="text-sm font-medium text-foreground mb-2 block">
                      Shipping Mode *
                    </label>
                    <select
                      id="shipping-mode"
                      value={shippingMode}
                      onChange={(e) => setShippingMode(e.target.value as ShippingMode)}
                      className="w-full px-4 py-3 rounded-full bg-background border border-border focus:outline-none focus:border-primary"
                      data-testid="select-shipping-mode"
                    >
                      {SHIPPING_MODES.map((mode) => (
                        <option key={mode} value={mode}>{mode}</option>
                      ))}
                    </select>
                    <p className="mt-2 text-xs text-muted-foreground" data-testid="shipping-mode-note">
                      {shippingMode === "LBC"
                        ? "Shipping fee will be COD or COP."
                        : "Shipping fee will be COD."}
                    </p>
                  </div>
                </div>
              </section>

              {/* Banks accordion */}
              <section className="bg-card rounded-3xl p-6 blocks-shadow" data-testid="banks-section">
                <h2 className="font-serif text-2xl mb-4">Choose Payment Method</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Scan the bank&apos;s QR code, complete your payment, then upload your proof of payment.
                </p>

                {loadingBanks ? (
                  <div className="space-y-3">
                    {Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-14 bg-muted rounded-2xl animate-pulse" />)}
                  </div>
                ) : banks.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground bg-background rounded-2xl">
                    No banks configured yet. Please ask the store admin to add bank payment options.
                  </div>
                ) : (
                  <div className="space-y-3" data-testid="banks-accordion">
                    {banks.map((bank) => {
                      const isOpen = openBankId === bank.id
                      const proof = proofByBank[bank.id]
                      return (
                        <div key={bank.id} className="border border-border rounded-2xl overflow-hidden bg-background" data-testid={`bank-item-${bank.id}`}>
                          <button
                            type="button"
                            onClick={() => setOpenBankId(isOpen ? null : bank.id)}
                            data-testid={`bank-toggle-${bank.id}`}
                            className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-muted/30 blocks-transition"
                          >
                            <div>
                              <div className="font-medium text-foreground">{bank.name}</div>
                              {bank.account_number && (
                                <div className="text-xs text-muted-foreground mt-0.5">
                                  {bank.account_name} • {bank.account_number}
                                </div>
                              )}
                            </div>
                            <ChevronDown className={`w-5 h-5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                          </button>
                          {isOpen && (
                            <div className="px-5 pb-5 pt-3 border-t border-border grid md:grid-cols-2 gap-6">
                              {/* LEFT inside accordion: dropdown/upload */}
                              <div className="space-y-4 order-2 md:order-1">
                                <div>
                                  <label className="text-sm font-medium text-foreground mb-2 block">
                                    Upload Payment Proof
                                  </label>
                                  <label
                                    htmlFor={`proof-${bank.id}`}
                                    className="cursor-pointer inline-flex items-center justify-center gap-2 w-full px-4 py-3 rounded-full bg-card border border-dashed border-border hover:border-primary text-sm blocks-transition"
                                    data-testid={`proof-upload-label-${bank.id}`}
                                  >
                                    <Upload className="w-4 h-4" />
                                    {proof ? proof.name : "Choose screenshot"}
                                  </label>
                                  <input
                                    id={`proof-${bank.id}`}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    data-testid={`proof-upload-${bank.id}`}
                                    onChange={(e) => handleFile(bank.id, e.target.files?.[0] || null)}
                                  />
                                  {proof && (
                                    <div className="mt-3 relative w-full h-40 rounded-xl overflow-hidden bg-muted">
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img src={proof.base64} alt="payment proof" className="w-full h-full object-contain" />
                                    </div>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleSubmit(bank.id, bank.name)}
                                  disabled={submitting || items.length === 0}
                                  data-testid={`submit-payment-${bank.id}`}
                                  className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3.5 rounded-full font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed blocks-transition"
                                >
                                  {submitting ? "Submitting..." : "Submit Payment Proof"}
                                </button>
                              </div>

                              {/* RIGHT inside accordion: QR */}
                              <div className="order-1 md:order-2 flex flex-col items-center">
                                <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">QR Code</div>
                                <div className="relative w-56 h-56 rounded-2xl overflow-hidden bg-white border border-border flex items-center justify-center">
                                  {bank.qr_image ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={bank.qr_image} alt={`${bank.name} QR`} className="w-full h-full object-contain" />
                                  ) : (
                                    <span className="text-xs text-muted-foreground p-4 text-center">No QR uploaded yet</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </section>
            </div>

            {/* RIGHT: order summary */}
            <aside className="bg-card rounded-3xl p-6 blocks-shadow h-fit sticky top-28" data-testid="order-summary">
              <h2 className="font-serif text-2xl mb-5">Order Summary</h2>
              <div className="space-y-2 text-sm mb-5">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal ({items.length} items)</span>
                  <span data-testid="summary-subtotal">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span>COD / COP</span>
                </div>
                <div className="border-t border-border pt-3 flex justify-between text-base font-medium text-foreground">
                  <span>Total</span>
                  <span data-testid="summary-total">${total.toFixed(2)}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Choose a bank below, scan the QR code, complete the transfer, then upload your payment screenshot to finalize the order. Admin will confirm shortly after.
              </p>
            </aside>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
