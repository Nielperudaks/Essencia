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
  const gridRef = useRef<HTMLDivElement>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const requestIdRef = useRef(0)

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
    <main className="min-h-screen" data-testid="shop-page">
      <Header />
      <div className="pt-28 pb-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-sm tracking-[0.3em] uppercase text-primary mb-4 block">
              Our Collection
            </span>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-foreground mb-4 text-balance">
              Shop All Products
            </h1>
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              Discover our complete range of premium fragrances
            </p>
          </div>

          <div className="flex items-center justify-between mb-10 pb-6 border-b border-border/50">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden inline-flex items-center gap-2 text-sm text-foreground"
            >
              <SlidersHorizontal className="w-4 h-4" />
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
                    className={`px-4 py-2 rounded-full text-sm capitalize blocks-transition ${
                      selectedCategory === category
                        ? "bg-primary text-primary-foreground"
                        : "bg-card text-foreground/70 hover:text-foreground blocks-shadow"
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
                    className={`px-4 py-2 rounded-full text-sm blocks-transition ${
                      selectedGender === gender
                        ? "bg-foreground text-background"
                        : "bg-card text-foreground/70 hover:text-foreground blocks-shadow"
                    }`}
                  >
                    {gender === "all" ? "All" : gender}
                  </button>
                ))}
              </div>
            </div>

            <span className="text-sm text-muted-foreground" data-testid="product-count">
              {totalProducts} {totalProducts === 1 ? "product" : "products"}
            </span>
          </div>

          {showFilters && (
            <div className="lg:hidden fixed inset-0 z-50 bg-background">
              <div className="p-6">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="font-serif text-2xl text-foreground">Filters</h2>
                  <button
                    type="button"
                    onClick={() => setShowFilters(false)}
                    className="p-2 text-foreground/70 hover:text-foreground"
                  >
                    <X className="w-5 h-5" />
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
                      className={`w-full px-6 py-4 rounded-2xl text-left capitalize blocks-transition ${
                        selectedCategory === category
                          ? "bg-primary text-primary-foreground"
                          : "bg-card text-foreground blocks-shadow"
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
                        className={`w-full px-6 py-4 rounded-2xl text-left blocks-transition ${
                          selectedGender === gender
                            ? "bg-foreground text-background"
                            : "bg-card text-foreground blocks-shadow"
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

          <div ref={gridRef} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {loadingInitial ? (
              Array.from({ length: PRODUCTS_PER_BATCH }).map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-muted rounded-3xl animate-pulse" />
              ))
            ) : products.length === 0 ? (
              <div className="col-span-full text-center py-20 text-muted-foreground">
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
                  className="inline-flex items-center justify-center rounded-full border border-foreground/20 px-8 py-4 text-sm tracking-wide text-foreground blocks-transition hover:bg-foreground/5"
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
      className={`group transition-all duration-700 ease-out ${
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      <div className="bg-card rounded-3xl overflow-hidden blocks-shadow blocks-transition group-hover:scale-[1.02]">
        <div className="relative aspect-square bg-muted overflow-hidden">
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
            className={`object-cover blocks-transition group-hover:scale-105 transition-opacity duration-500 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
          />
          {product.badge && (
            <span
              className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs tracking-wide ${
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
          {isSoldOut && (
            <div className="absolute inset-0 z-10 bg-background/75 backdrop-blur-[1px] flex items-center justify-center">
              <span className="bg-foreground text-background px-4 py-2 rounded-full text-xs font-semibold tracking-[0.2em]">
                SOLD OUT
              </span>
            </div>
          )}
          <button
            type="button"
            disabled={isSoldOut}
            className="absolute bottom-4 right-4 z-20 w-12 h-12 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 blocks-transition blocks-shadow disabled:opacity-50 disabled:cursor-not-allowed"
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
            <ShoppingBag className="w-5 h-5 text-foreground" />
          </button>
        </div>
        <div className="p-6">
          <h3 className="font-serif text-xl text-foreground mb-1">{product.name}</h3>
          <p className="text-xs uppercase tracking-[0.18em] text-primary mb-2">{product.gender}</p>
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{product.description}</p>
          <div className="flex items-center gap-2">
            <span className="text-lg font-medium text-foreground">{formatCurrency(product.price)}</span>
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
