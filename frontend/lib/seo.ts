import type { Metadata } from "next"
import type { Product } from "@/lib/api"

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://essencia.beauty"
).replace(/\/$/, "")

export const SITE_NAME = "Essencia"

export const DEFAULT_DESCRIPTION =
  "Shop Essencia for perfumes, makeup, skincare, and clothing curated for everyday elegance."

export const storefrontKeywords = [
  "Essencia",
  "perfume shop",
  "makeup shop",
  "skincare shop",
  "clothing shop",
  "fragrance",
  "beauty products",
  "skin care",
  "online beauty store",
]

export const defaultOgImage = "/images/hero-model.jpg"

export function absoluteUrl(path = "/") {
  if (/^https?:\/\//i.test(path)) return path
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`
}

export function imageUrl(src?: string | null) {
  if (!src || src.startsWith("data:")) return absoluteUrl(defaultOgImage)
  return absoluteUrl(src)
}

export function createMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path = "/",
  image = defaultOgImage,
  type = "website",
  robots,
}: {
  title: string
  description?: string
  path?: string
  image?: string | null
  type?: "website"
  robots?: Metadata["robots"]
}): Metadata {
  const url = absoluteUrl(path)

  return {
    title,
    description,
    keywords: storefrontKeywords,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      images: [
        {
          url: imageUrl(image),
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} beauty storefront`,
        },
      ],
      locale: "en_PH",
      type,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl(image)],
    },
    robots,
  }
}

export function noIndexMetadata(title: string, description: string): Metadata {
  return createMetadata({
    title,
    description,
    robots: {
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
      },
    },
  })
}

export function storeJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Store",
    name: SITE_NAME,
    url: SITE_URL,
    description: DEFAULT_DESCRIPTION,
    image: imageUrl(defaultOgImage),
    sameAs: ["https://www.facebook.com/essencia"],
    department: [
      { "@type": "Store", name: "Perfumes" },
      { "@type": "Store", name: "Makeup" },
      { "@type": "Store", name: "Skincare" },
      { "@type": "Store", name: "Clothing" },
    ],
  }
}

export function collectionJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Essencia Shop",
    url: absoluteUrl("/shop"),
    description:
      "Browse Essencia perfumes, makeup, skincare, and clothing in one curated collection.",
  }
}

export function productJsonLd(product: Product) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: imageUrl(product.image),
    category: product.category,
    brand: {
      "@type": "Brand",
      name: SITE_NAME,
    },
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/product/${product.id}`),
      priceCurrency: "PHP",
      price: product.price,
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    },
  }
}

function apiBaseUrl() {
  const base = process.env.NEXT_PUBLIC_BACKEND_URL || ""
  return /^https?:\/\//i.test(base) ? base.replace(/\/$/, "") : ""
}

export async function getSeoProduct(id: string): Promise<Product | null> {
  const base = apiBaseUrl()
  if (!base) return null

  try {
    const response = await fetch(`${base}/api/products/${encodeURIComponent(id)}`, {
      cache: "no-store",
    })
    if (!response.ok) return null
    return (await response.json()) as Product
  } catch {
    return null
  }
}

export async function getSeoProducts(): Promise<Product[]> {
  const base = apiBaseUrl()
  if (!base) return []

  try {
    const params = new URLSearchParams({ limit: "500", offset: "0" })
    const response = await fetch(`${base}/api/products?${params.toString()}`, {
      cache: "no-store",
    })
    if (!response.ok) return []
    const data = (await response.json()) as Product[] | { items?: Product[] }
    return Array.isArray(data) ? data : data.items || []
  } catch {
    return []
  }
}
