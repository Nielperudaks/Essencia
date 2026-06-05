import type { MetadataRoute } from "next"
import { absoluteUrl, getSeoProducts, imageUrl } from "@/lib/seo"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const products = await getSeoProducts()

  return [
    {
      url: absoluteUrl("/"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absoluteUrl("/shop"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    ...products.map((product) => ({
      url: absoluteUrl(`/product/${product.id}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
      images: [imageUrl(product.image)],
    })),
  ]
}
