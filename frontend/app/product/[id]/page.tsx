"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ChevronLeft, Minus, Plus, Leaf, Heart, Award, Recycle, Star, Check } from "lucide-react"
import { Header } from "@/components/blocks/header"
import { Footer } from "@/components/blocks/footer"
import { api, type Product } from "@/lib/api"
import { formatCurrency } from "@/lib/currency"
import { useCart } from "@/components/blocks/cart-context"

const benefits = [
  { icon: Leaf, label: "Authentic" },
  { icon: Heart, label: "Long Lasting" },
  { icon: Recycle, label: "Premium Pack" },
  { icon: Award, label: "Top Rated" },
]

export default function ProductPage() {
  const params = useParams()
  const productId = params.id as string
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [isAdded, setIsAdded] = useState(false)
  const { addItem, setIsOpen } = useCart()

  useEffect(() => {
    setLoading(true)
    api.getProduct(productId)
      .then((p) => setProduct(p))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
    window.scrollTo(0, 0)
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
      <main className="min-h-screen">
        <Header />
        <div className="pt-28 pb-20 max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            <div className="aspect-square bg-muted rounded-3xl animate-pulse" />
            <div className="space-y-4">
              <div className="h-10 bg-muted rounded animate-pulse" />
              <div className="h-6 bg-muted rounded animate-pulse w-1/2" />
              <div className="h-24 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  if (notFound || !product) {
    return (
      <main className="min-h-screen">
        <Header />
        <div className="pt-40 pb-32 text-center">
          <h1 className="font-serif text-4xl mb-4">Product not found</h1>
          <Link href="/shop" className="text-primary underline">Back to shop</Link>
        </div>
        <Footer />
      </main>
    )
  }

  return (
    <main className="min-h-screen" data-testid="product-detail-page">
      <Header />
      <div className="pt-28 pb-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground blocks-transition mb-8"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Shop
          </Link>

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
            <div className="relative aspect-square rounded-3xl overflow-hidden bg-card blocks-shadow">
              <Image
                src={product.image || "/placeholder.svg"}
                alt={product.name}
                fill
                className="object-cover"
                priority
              />
              {product.stock <= 0 && (
                <div className="absolute inset-0 bg-background/75 backdrop-blur-[1px] flex items-center justify-center">
                  <span className="bg-foreground text-background px-5 py-2.5 rounded-full text-sm font-semibold tracking-[0.2em]">
                    SOLD OUT
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col">
              <div className="mb-8">
                <span className="text-sm tracking-[0.3em] uppercase text-primary mb-2 block">
                  {product.category}
                </span>
                <span className="text-xs tracking-[0.25em] uppercase text-muted-foreground mb-3 block">
                  {product.gender}
                </span>
                <h1 className="font-serif text-4xl md:text-5xl text-foreground mb-3" data-testid="product-name">
                  {product.name}
                </h1>
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">(128 reviews)</span>
                </div>
                <p className="text-foreground/80 leading-relaxed">
                  {product.description}
                </p>
              </div>

              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl font-medium text-foreground" data-testid="product-price">{formatCurrency(product.price)}</span>
                {product.originalPrice && (
                  <span className="text-xl text-muted-foreground line-through">
                    {formatCurrency(product.originalPrice)}
                  </span>
                )}
              </div>

              <div className="mb-6 flex gap-6 text-sm">
                {product.size && (
                  <div>
                    <span className="text-muted-foreground">Size: </span>
                    <span className="font-medium text-foreground">{product.size}</span>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Stock: </span>
                  <span className={`font-medium ${product.stock > 0 ? 'text-foreground' : 'text-destructive'}`} data-testid="product-stock">
                    {product.stock > 0 ? `${product.stock} available` : 'Out of stock'}
                  </span>
                </div>
              </div>

              <div className="mb-8">
                <label className="text-sm font-medium text-foreground mb-3 block">Quantity</label>
                <div className="inline-flex items-center gap-4 bg-card rounded-full px-2 py-2 blocks-shadow">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-foreground/60 hover:text-foreground blocks-transition"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-medium text-foreground">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.min(product.stock || quantity + 1, quantity + 1))}
                    className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-foreground/60 hover:text-foreground blocks-transition"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={product.stock <= 0}
                  data-testid="add-to-cart-btn"
                  className={`flex-1 inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full text-sm tracking-wide blocks-transition blocks-shadow disabled:opacity-50 disabled:cursor-not-allowed ${
                    isAdded
                      ? "bg-primary/80 text-primary-foreground"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  }`}
                >
                  {isAdded ? (<><Check className="w-4 h-4" /> Added to Cart</>) : "Add to Cart"}
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
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-transparent border border-foreground/20 text-foreground px-8 py-4 rounded-full text-sm tracking-wide blocks-transition hover:bg-foreground/5"
                  >
                    Buy Now
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled
                    data-testid="buy-now-btn"
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-transparent border border-foreground/20 text-foreground px-8 py-4 rounded-full text-sm tracking-wide opacity-50 cursor-not-allowed"
                  >
                    Sold Out
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {benefits.map((benefit) => (
                  <div
                    key={benefit.label}
                    className="flex flex-col items-center gap-2 p-4 rounded-md"
                  >
                    <benefit.icon className="w-5 h-5 text-primary" />
                    <span className="text-xs text-muted-foreground text-center">{benefit.label}</span>
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
