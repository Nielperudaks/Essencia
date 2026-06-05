import type { Metadata } from "next"
import ShopPage from "./shop-client"
import { collectionJsonLd, createMetadata } from "@/lib/seo"

export const metadata: Metadata = createMetadata({
  title: "Shop Perfumes, Makeup, Skincare and Clothing",
  description:
    "Browse Essencia perfumes, makeup, skincare, and clothing curated for elegant everyday routines.",
  path: "/shop",
})

export default function Page() {
  return (
    <>
      <ShopPage />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd()) }}
      />
    </>
  )
}
