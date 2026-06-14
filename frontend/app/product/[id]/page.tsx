import type { Metadata } from "next"
import ProductPage from "./product-client"
import {
  createMetadata,
  getSeoProduct,
  productJsonLd,
} from "@/lib/seo"

type ProductPageProps = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { id } = await params
  const product = await getSeoProduct(id)

  if (!product) {
    return createMetadata({
      title: "Product",
      description:
        "View Essencia perfumes, makeup, skincare, and clothing products.",
      path: `/product/${id}`,
    })
  }

  return createMetadata({
    title: product.name,
    description: product.description,
    path: `/product/${product.id}`,
    image: product.image,
  })
}

export default async function Page({ params }: ProductPageProps) {
  const { id } = await params
  const product = await getSeoProduct(id)

  return (
    <>
      <ProductPage />
      {product && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(productJsonLd(product)),
          }}
        />
      )}
    </>
  )
}
