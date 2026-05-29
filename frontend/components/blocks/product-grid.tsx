"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { ShoppingBag } from "lucide-react"
import { useCart } from "./cart-context"
import { api, type Product } from "@/lib/api"
import { formatCurrency } from "@/lib/currency"

type Category = "Perfumes" | "Makeup" | "Skincare"

const categories = [
  { value: "Perfumes" as Category, label: "Perfumes" },
  { value: "Makeup" as Category, label: "Makeup" },
  { value: "Skincare" as Category, label: "Skincare" },
]

export function ProductGrid() {
  const [productsByCategory, setProductsByCategory] = useState<Partial<Record<Category, Product[]>>>({})
  const [selectedCategory, setSelectedCategory] = useState<Category>("Perfumes")
  const [isVisible, setIsVisible] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [headerVisible, setHeaderVisible] = useState(false)
  const gridRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const { addItem } = useCart()

  useEffect(() => {
    if (productsByCategory[selectedCategory]) return

    let cancelled = false

    api.listProductPage({ category: selectedCategory, limit: 4, offset: 0 })
      .then((page) => {
        if (cancelled) return
        setProductsByCategory((current) => ({
          ...current,
          [selectedCategory]: page.items,
        }))
      })
      .catch(() => {
        if (cancelled) return
        setProductsByCategory((current) => ({
          ...current,
          [selectedCategory]: [],
        }))
      })

    return () => {
      cancelled = true
    }
  }, [productsByCategory, selectedCategory])

  const filteredProducts = productsByCategory[selectedCategory] ?? []
  const loading = !productsByCategory[selectedCategory]

  const handleCategoryChange = (category: Category) => {
    if (category !== selectedCategory) {
      setIsTransitioning(true)
      setTimeout(() => {
        setSelectedCategory(category)
        setTimeout(() => setIsTransitioning(false), 50)
      }, 300)
    }
  }

  useEffect(() => {
    const gridObserver = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setIsVisible(true)
    }, { threshold: 0.1 })
    const headerObserver = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setHeaderVisible(true)
    }, { threshold: 0.1 })
    if (gridRef.current) gridObserver.observe(gridRef.current)
    if (headerRef.current) headerObserver.observe(headerRef.current)
    return () => {
      gridObserver.disconnect()
      headerObserver.disconnect()
    }
  }, [])

  return (
    <section className="py-24 bg-card" data-testid="product-grid-section">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div ref={headerRef} className="text-center mb-16">
          <span className={`text-sm tracking-[0.3em] uppercase text-primary mb-4 block ${headerVisible ? 'animate-blur-in opacity-0' : 'opacity-0'}`} style={headerVisible ? { animationDelay: '0.2s', animationFillMode: 'forwards' } : {}}>
            Our Collection
          </span>
          <h2 className={`font-serif leading-tight text-foreground mb-4 text-balance text-7xl ${headerVisible ? 'animate-blur-in opacity-0' : 'opacity-0'}`} style={headerVisible ? { animationDelay: '0.4s', animationFillMode: 'forwards' } : {}}>
            Gentle essentials
          </h2>
          <p className={`text-lg text-muted-foreground max-w-md mx-auto ${headerVisible ? 'animate-blur-in opacity-0' : 'opacity-0'}`} style={headerVisible ? { animationDelay: '0.6s', animationFillMode: 'forwards' } : {}}>
            Thoughtfully crafted products for your daily ritual
          </p>
        </div>

        <div className="flex justify-center mb-12">
          <div className="inline-flex bg-background rounded-full p-1 gap-1 relative">
            <div
              className="absolute top-1 bottom-1 bg-foreground rounded-full transition-all duration-300 ease-out shadow-sm"
              style={{
                left: selectedCategory === 'Perfumes' ? '4px' : selectedCategory === 'Makeup' ? 'calc(33.333% + 2px)' : 'calc(66.666%)',
                width: 'calc(33.333% - 4px)'
              }}
            />
            {categories.map((category) => (
              <button
                key={category.value}
                type="button"
                data-testid={`category-tab-${category.value.toLowerCase()}`}
                onClick={() => handleCategoryChange(category.value)}
                className={`relative z-10 px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  selectedCategory === category.value
                    ? "text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        <div ref={gridRef} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6" data-testid="products-grid">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-square bg-muted rounded-3xl animate-pulse" />
            ))
          ) : filteredProducts.length === 0 ? (
            <div className="col-span-full text-center py-16 text-muted-foreground" data-testid="no-products">
              No products in this category yet.
            </div>
          ) : filteredProducts.map((product, index) => (
            <Link
              key={`${selectedCategory}-${product.id}`}
              href={`/product/${product.id}`}
              data-testid={`product-card-${product.id}`}
              className={`group transition-all duration-500 ease-out ${
                isVisible && !isTransitioning ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              }`}
              style={{ transitionDelay: isTransitioning ? '0ms' : `${index * 80}ms` }}
            >
              <div className="bg-background rounded-3xl overflow-hidden blocks-shadow blocks-transition group-hover:scale-[1.02]">
                <div className="relative aspect-square bg-muted overflow-hidden">
                  <Image
                    src={product.image || "/placeholder.svg"}
                    alt={product.name}
                    fill
                    loading="lazy"
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover blocks-transition group-hover:scale-105"
                  />
                  {product.badge && (
                    <span
                      className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs tracking-wide bg-white text-black ${
                        product.badge === "Sale"
                          ? "bg-destructive/10 text-destructive"
                          : product.badge === "New"
                          ? "bg-primary/10 text-primary"
                          : "bg-accent text-accent-foreground"
                      }`}
                    >
                      {product.badge}
                    </span>
                  )}
                  {product.stock <= 0 && (
                    <div className="absolute inset-0 z-10 bg-background/75 backdrop-blur-[1px] flex items-center justify-center">
                      <span className="bg-foreground text-background px-4 py-2 rounded-full text-xs font-semibold tracking-[0.2em]">
                        SOLD OUT
                      </span>
                    </div>
                  )}
                  <button
                    type="button"
                    data-testid={`quick-add-${product.id}`}
                    disabled={product.stock <= 0}
                    className="absolute bottom-4 right-4 z-20 w-10 h-10 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 blocks-transition blocks-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      if (product.stock <= 0) return
                      addItem({
                        id: product.id,
                        name: product.name,
                        description: product.description,
                        price: product.price,
                        image: product.image,
                        size: product.size,
                      })
                    }}
                    aria-label="Add to cart"
                  >
                    <ShoppingBag className="w-4 h-4 text-foreground" />
                  </button>
                </div>
                <div className="p-5">
                  <h3 className="font-serif text-lg text-foreground mb-1">{product.name}</h3>
                  <p className="text-xs uppercase tracking-[0.18em] text-primary mb-2">{product.gender}</p>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{product.description}</p>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{formatCurrency(product.price)}</span>
                    {product.originalPrice && (
                      <span className="text-sm text-muted-foreground line-through">
                        {formatCurrency(product.originalPrice)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            href="/shop"
            data-testid="view-all-products-btn"
            className="inline-flex items-center justify-center gap-2 bg-transparent border border-foreground/20 text-foreground px-8 py-4 rounded-full text-sm tracking-wide blocks-transition hover:bg-foreground/5"
          >
            View All Products
          </Link>
        </div>
      </div>
    </section>
  )
}
