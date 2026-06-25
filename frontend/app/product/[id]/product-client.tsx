"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Award, Check, ChevronLeft, Heart, Leaf, Minus, Plus, Recycle, Star } from "lucide-react"
import { Header } from "@/components/blocks/header"
import { Footer } from "@/components/blocks/footer"
import { api, type Product } from "@/lib/api"
import { formatCurrency } from "@/lib/currency"
import { useCart } from "@/components/blocks/cart-context"
import { useStorefrontGsap } from "@/hooks/use-storefront-gsap"

const benefits = [
  { icon: Leaf, label: "Authentic" },
  { icon: Heart, label: "Long lasting" },
  { icon: Recycle, label: "Premium pack" },
  { icon: Award, label: "Top rated" },
]

export default function ProductPage() {
  const params = useParams()
  const productId = params.id as string
  const pageRef = useRef<HTMLElement>(null)
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [isAdded, setIsAdded] = useState(false)
  const { addItem, setIsOpen } = useCart()

  useStorefrontGsap(pageRef, ({ gsap }) => {
    gsap.from("[data-product-reveal]", {
      y: 34,
      opacity: 0,
      duration: 0.8,
      stagger: 0.08,
      ease: "power3.out",
    })

    gsap.to("[data-product-image]", {
      yPercent: -6,
      ease: "none",
      scrollTrigger: {
        trigger: pageRef.current,
        start: "top top",
        end: "bottom top",
        scrub: true,
      },
    })
  }, [product?.id])

  useEffect(() => {
    let cancelled = false

    api.getProduct(productId)
      .then((nextProduct) => {
        if (cancelled) return
        setProduct(nextProduct)
        setNotFound(false)
        setQuantity(1)
      })
      .catch(() => {
        if (cancelled) return
        setProduct(null)
        setNotFound(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    window.scrollTo(0, 0)

    return () => {
      cancelled = true
    }
  }, [productId])

  const handleAddToCart = () => {
    if (!product || product.stock <= 0) return
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        image: product.image,
        size: product.size,
      })
    }
    setIsAdded(true)
    setTimeout(() => setIsAdded(false), 2000)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <Header />
        <div className="storefront-shell pt-32 pb-20">
          <div className="grid gap-10 lg:grid-cols-2">
            <div className="aspect-square animate-pulse bg-muted" />
            <div className="space-y-4">
              <div className="h-16 animate-pulse bg-muted" />
              <div className="h-6 w-1/2 animate-pulse bg-muted" />
              <div className="h-32 animate-pulse bg-muted" />
            </div>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  if (notFound || !product) {
    return (
      <main className="min-h-screen bg-background">
        <Header />
        <div className="storefront-shell py-40 text-center">
          <h1 className="mb-5 font-serif text-5xl font-semibold">Product not found</h1>
          <Link href="/shop" className="storefront-button">Back to shop</Link>
        </div>
        <Footer />
      </main>
    )
  }

  const isSoldOut = product.stock <= 0

  return (
    <main ref={pageRef} className="min-h-screen bg-background" data-testid="product-detail-page">
      <Header />
      <div className="pt-32 pb-20">
        <div className="storefront-shell">
          <Link
            href="/shop"
            data-product-reveal
            className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft className="size-4" />
            Back to shop
          </Link>

          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
            <div data-product-reveal className="storefront-media aspect-[4/5] lg:sticky lg:top-28">
              <Image
                src={product.image || "/placeholder.svg"}
                alt={product.name}
                fill
                priority
                data-product-image
                className="object-cover"
              />
              {isSoldOut && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-[1px]">
                  <span className="bg-foreground px-5 py-3 text-xs font-semibold uppercase text-background" style={{ letterSpacing: "0.18em" }}>
                    Sold out
                  </span>
                </div>
              )}
            </div>

            <div className="lg:pt-10">
              <div data-product-reveal className="border-b border-border pb-8">
                <span className="storefront-kicker">{product.category}</span>
                
                <h1 className="mb-5 font-serif text-5xl font-semibold leading-none text-foreground sm:text-6xl lg:text-7xl" data-testid="product-name">
                  {product.name}
                </h1>
                <div className="mb-6 flex items-center gap-3">
                  
                  <span className="mb-3 block text-xs font-semibold uppercase text-muted-foreground" style={{ letterSpacing: "0.16em" }}>
                  {product.gender}
                </span>
                </div>
                <p className="max-w-xl text-base leading-7 text-muted-foreground">{product.description}</p>
              </div>

              <div data-product-reveal className="border-b border-border py-7">
                <div className="mb-6 flex items-baseline gap-3">
                  <span className="text-4xl font-semibold text-foreground" data-testid="product-price">{formatCurrency(product.price)}</span>
                  {product.originalPrice && (
                    <span className="text-xl text-muted-foreground line-through">{formatCurrency(product.originalPrice)}</span>
                  )}
                </div>

                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  {product.size && (
                    <InfoLine label="Size" value={product.size} />
                  )}
                  <InfoLine label="Stock" value={product.stock > 0 ? `${product.stock} available` : "Out of stock"} testId="product-stock" danger={isSoldOut} />
                </div>
              </div>

              <div data-product-reveal className="border-b border-border py-7">
                <label className="mb-3 block text-sm font-medium text-foreground">Quantity</label>
                <div className="inline-flex border border-border">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="flex size-12 items-center justify-center hover:bg-muted"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="size-4" />
                  </button>
                  <span className="flex h-12 min-w-14 items-center justify-center border-x border-border font-medium">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.min(product.stock || quantity + 1, quantity + 1))}
                    className="flex size-12 items-center justify-center hover:bg-muted"
                    aria-label="Increase quantity"
                  >
                    <Plus className="size-4" />
                  </button>
                </div>
              </div>

              <div data-product-reveal className="grid gap-3 py-7 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={isSoldOut}
                  data-testid="add-to-cart-btn"
                  className="storefront-button"
                >
                  {isAdded ? (<><Check className="size-4" /> Added to cart</>) : "Add to cart"}
                </button>
                {product.stock > 0 ? (
                  <Link
                    href="/payment"
                    onClick={() => {
                      addItem({
                        id: product.id,
                        name: product.name,
                        description: product.description,
                        price: product.price,
                        image: product.image,
                        size: product.size,
                      })
                      setIsOpen(false)
                    }}
                    data-testid="buy-now-btn"
                    className="storefront-button-outline"
                  >
                    Buy now
                  </Link>
                ) : (
                  <button type="button" disabled data-testid="buy-now-btn" className="storefront-button-outline">
                    Sold out
                  </button>
                )}
              </div>

              <div data-product-reveal className="grid grid-cols-2 gap-px overflow-hidden border border-border bg-border sm:grid-cols-4">
                {benefits.map((benefit) => (
                  <div key={benefit.label} className="bg-background p-4 text-center">
                    <benefit.icon className="mx-auto mb-3 size-5 text-foreground" strokeWidth={1.5} />
                    <span className="text-xs font-medium text-muted-foreground">{benefit.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}

function InfoLine({ label, value, testId, danger }: { label: string; value: string; testId?: string; danger?: boolean }) {
  return (
    <div className="border border-border p-4">
      <span className="mb-1 block text-xs uppercase text-muted-foreground" style={{ letterSpacing: "0.16em" }}>{label}</span>
      <span className={danger ? "font-medium text-destructive" : "font-medium text-foreground"} data-testid={testId}>{value}</span>
    </div>
  )
}
