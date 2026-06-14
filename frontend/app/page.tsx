import HomePage from "./home-client"
import { storeJsonLd } from "@/lib/seo"

export default function Page() {
  return (
    <>
      <HomePage />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(storeJsonLd()) }}
      />
    </>
  )
}
