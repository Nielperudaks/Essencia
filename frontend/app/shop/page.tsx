"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import { ShoppingBag, SlidersHorizontal, X } from "lucide-react"
import { Header } from "@/components/blocks/header"
import { Footer } from "@/components/blocks/footer"
import { api, type Product } from "@/lib/api"
import { formatCurrency } from "@/lib/currency"
import { useCart } from "@/components/blocks/cart-context"
import { useStorefrontGsap } from "@/hooks/use-storefront-gsap"

const PRODUCTS_PER_BATCH = 9
const categoriesList = ["all", "Perfumes", "Makeup", "Skincare"]
const genderList = ["all", "Male", "Female", "All Genders"]
type ProductPageState = {
  products: Product[]
  totalProducts: number
  hasMore: boolean
  category: string
  gender: string
  loadingInitial: boolean
}

export default function ShopPage() {
  const [productPage, setProductPage] = useState<ProductPageState>({
    products: [],
    totalProducts: 0,
    hasMore: false,
    category: "all",
    gender: "all",
    loadingInitial: true,
  })
  const [loadingMore, setLoadingMore] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedGender, setSelectedGender] = useState("all")
  const [showFilters, setShowFilters] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const pageRef = useRef<HTMLElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const requestIdRef = useRef(0)

  useStorefrontGsap(pageRef, ({ gsap }) => {
    gsap.from("[data-shop-reveal]", {
      y: 32,
      opacity: 0,
      duration: 0.75,
      stagger: 0.08,
      ease: "power3.out",
    })
  })

  useEffect(() => {
    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId

    api.listProductPage({
      category: selectedCategory,
      gender: selectedGender,
      limit: PRODUCTS_PER_BATCH,
      offset: 0,
    })
      .then((page) => {
        if (requestIdRef.current !== requestId) return
        setProductPage({
          products: page.items,
          totalProducts: page.total,
          hasMore: page.hasMore,
          category: selectedCategory,
          gender: selectedGender,
          loadingInitial: false,
        })
        setLoadingMore(false)
      })
      .catch(() => {
        if (requestIdRef.current !== requestId) return
        setProductPage({
          products: [],
          totalProducts: 0,
          hasMore: false,
          category: selectedCategory,
          gender: selectedGender,
          loadingInitial: false,
        })
        setLoadingMore(false)
      })
  }, [selectedCategory, selectedGender])

  const filtersMatchPage = productPage.category === selectedCategory && productPage.gender === selectedGender
  const products = useMemo(
    () => (filtersMatchPage ? productPage.products : []),
    [filtersMatchPage, productPage.products]
  )
  const totalProducts = filtersMatchPage ? productPage.totalProducts : 0
  const hasMore = filtersMatchPage ? productPage.hasMore : false
  const loadingInitial = productPage.loadingInitial || !filtersMatchPage

  const loadMoreProducts = useCallback(() => {
    if (loadingInitial || loadingMore || !hasMore) return

    const requestId = requestIdRef.current
    const offset = products.length
    setLoadingMore(true)

    api.listProductPage({
      category: selectedCategory,
      gender: selectedGender,
      limit: PRODUCTS_PER_BATCH,
      offset,
      })
      .then((page) => {
        if (requestIdRef.current !== requestId) return
        setProductPage((current) => {
          const existingIds = new Set(current.products.map((product) => product.id))
          const nextProducts = page.items.filter((product) => !existingIds.has(product.id))
          return {
            products: [...current.products, ...nextProducts],
            totalProducts: page.total,
            hasMore: page.hasMore,
            category: selectedCategory,
            gender: selectedGender,
            loadingInitial: false,
          }
        })
      })
      .catch(() => {
        if (requestIdRef.current !== requestId) return
        setProductPage((current) => ({
          ...current,
          hasMore: false,
        }))
      })
      .finally(() => {
        if (requestIdRef.current === requestId) setLoadingMore(false)
      })
  }, [hasMore, loadingInitial, loadingMore, products.length, selectedCategory, selectedGender])

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setIsVisible(true)
    }, { threshold: 0.1 })
    if (gridRef.current) observer.observe(gridRef.current)
    return () => observer.disconnect()
  }, [products])

  useEffect(() => {
    const hideTimer = setTimeout(() => setIsVisible(false), 0)
    const showTimer = setTimeout(() => setIsVisible(true), 50)
    return () => {
      clearTimeout(hideTimer)
      clearTimeout(showTimer)
    }
  }, [selectedCategory, selectedGender])

  useEffect(() => {
    if (!hasMore || loadingInitial || loadingMore) return

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) loadMoreProducts()
    }, { rootMargin: "600px 0px" })

    if (loadMoreRef.current) observer.observe(loadMoreRef.current)
    return () => observer.disconnect()
  }, [hasMore, loadMoreProducts, loadingInitial, loadingMore])

  return (
    <main ref={pageRef} className="min-h-screen bg-background" data-testid="shop-page">
      <Header />
      <div className="pt-32 pb-20">
        <div className="storefront-shell">
          <div data-shop-reveal className="mb-12 grid gap-6 lg:grid-cols-[1fr_420px] lg:items-end">
            <div>
              <span className="storefront-kicker">Collection</span>
              <h1 className="storefront-display">
                Shop the edit.
              </h1>
            </div>
            <p className="storefront-copy lg:justify-self-end">
              Discover a precise selection of fragrance, makeup, and skincare essentials in a clean monochrome catalog.
            </p>
          </div>

          <div data-shop-reveal className="mb-10 flex items-center justify-between border-y border-border py-5">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="storefront-button-outline min-h-10 px-4 py-2 lg:hidden"
            >
              <SlidersHorizontal className="size-4" />
              Filters
            </button>

            <div className="hidden lg:flex items-center gap-5">
              <div className="flex items-center gap-2">
                {categoriesList.map((category) => (
                  <button
                    key={category}
                    type="button"
                    data-testid={`shop-category-${category}`}
                    onClick={() => setSelectedCategory(category)}
                    className={`min-h-10 px-4 py-2 text-sm capitalize transition-colors ${
                      selectedCategory === category
                        ? "bg-foreground text-background"
                        : "border border-border bg-background text-foreground/70 hover:text-foreground"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                {genderList.map((gender) => (
                  <button
                    key={gender}
                    type="button"
                    data-testid={`shop-gender-${gender}`}
                    onClick={() => setSelectedGender(gender)}
                    className={`min-h-10 px-4 py-2 text-sm transition-colors ${
                      selectedGender === gender
                        ? "bg-foreground text-background"
                        : "border border-border bg-background text-foreground/70 hover:text-foreground"
                    }`}
                  >
                    {gender === "all" ? "All" : gender}
                  </button>
                ))}
              </div>
            </div>

            <span className="text-sm font-medium text-muted-foreground" data-testid="product-count">
              {totalProducts} {totalProducts === 1 ? "product" : "products"}
            </span>
          </div>

          {showFilters && (
            <div className="lg:hidden fixed inset-0 z-50 bg-background">
              <div className="p-6">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="font-serif text-4xl font-semibold text-foreground">Filters</h2>
                  <button
                    type="button"
                    onClick={() => setShowFilters(false)}
                    className="storefront-icon-button"
                    aria-label="Close filters"
                  >
                    <X className="size-5" />
                  </button>
                </div>
                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Category</div>
                  {categoriesList.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(category)
                        setShowFilters(false)
                      }}
                      className={`w-full border px-5 py-4 text-left capitalize transition-colors ${
                        selectedCategory === category
                          ? "bg-primary text-primary-foreground"
                          : "border-border bg-background text-foreground"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                  </div>
                  <div className="space-y-3">
                    <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Gender</div>
                    {genderList.map((gender) => (
                      <button
                        key={gender}
                        type="button"
                        onClick={() => {
                        setSelectedGender(gender)
                        setShowFilters(false)
                      }}
                        className={`w-full border px-5 py-4 text-left transition-colors ${
                          selectedGender === gender
                            ? "bg-foreground text-background"
                            : "border-border bg-background text-foreground"
                        }`}
                      >
                        {gender === "all" ? "All" : gender}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={gridRef} className="grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {loadingInitial ? (
              Array.from({ length: PRODUCTS_PER_BATCH }).map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-muted animate-pulse" />
              ))
            ) : products.length === 0 ? (
              <div className="col-span-full bg-background py-20 text-center text-muted-foreground">
                No products found.
              </div>
            ) : products.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                index={index}
                isVisible={isVisible}
              />
            ))}
          </div>

          {!loadingInitial && products.length > 0 && (
            <div ref={loadMoreRef} className="mt-12 flex justify-center">
              {loadingMore ? (
                <div className="grid grid-cols-3 gap-3" aria-label="Loading more products">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <span key={i} className="h-3 w-3 rounded-full bg-muted animate-pulse" />
                  ))}
                </div>
              ) : hasMore ? (
                <button
                  type="button"
                  onClick={loadMoreProducts}
                  className="storefront-button-outline"
                >
                  Load more
                </button>
              ) : (
                <span className="text-sm text-muted-foreground">All products loaded</span>
              )}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </main>
  )
}

function ProductCard({ product, index, isVisible }: { product: Product; index: number; isVisible: boolean }) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const { addItem } = useCart()
  const isSoldOut = product.stock <= 0
  return (
    <Link
      href={`/product/${product.id}`}
      data-testid={`shop-product-${product.id}`}
      className={`group bg-background transition-all duration-700 ease-out ${
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      <div>
        <div className="relative aspect-[4/5] bg-muted overflow-hidden">
          <div
            className={`absolute inset-0 bg-gradient-to-br from-muted via-muted/50 to-muted animate-pulse transition-opacity duration-500 ${
              imageLoaded ? 'opacity-0' : 'opacity-100'
            }`}
          />
          <Image
            src={product.image || "/placeholder.svg"}
            alt={product.name}
            fill
            loading="lazy"
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className={`object-cover grayscale transition duration-700 group-hover:scale-105 group-hover:grayscale-0 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
          />
          {product.badge && (
            <span
              className="absolute top-4 left-4 bg-black px-3 py-1 text-[10px] font-semibold uppercase text-white"
              style={{ letterSpacing: "0.16em" }}
            >
              {product.badge}
            </span>
          )}
          {isSoldOut && (
            <div className="absolute inset-0 z-10 bg-background/75 backdrop-blur-[1px] flex items-center justify-center">
              <span className="bg-foreground text-background px-4 py-2 text-xs font-semibold uppercase" style={{ letterSpacing: "0.16em" }}>
                SOLD OUT
              </span>
            </div>
          )}
          <button
            type="button"
            disabled={isSoldOut}
            className="absolute bottom-4 right-4 z-20 flex size-12 items-center justify-center bg-background text-foreground opacity-0 transition group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              if (isSoldOut) return
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
            <ShoppingBag className="size-5" />
          </button>
        </div>
        <div className="p-5">
          <div className="mb-4 flex items-start justify-between gap-4">
            <h3 className="font-serif text-2xl font-semibold leading-tight text-foreground">{product.name}</h3>
            <span className="whitespace-nowrap text-sm font-medium text-foreground">{formatCurrency(product.price)}</span>
          </div>
          <p className="mb-3 text-xs font-medium uppercase text-muted-foreground" style={{ letterSpacing: "0.16em" }}>{product.gender}</p>
          <p className="mb-4 line-clamp-2 text-sm leading-6 text-muted-foreground">{product.description}</p>
          <div className="flex items-center gap-2">
            {product.originalPrice && (
              <span className="text-sm text-muted-foreground line-through">
                {formatCurrency(product.originalPrice)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
