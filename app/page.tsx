import { Header } from "@/components/blocks/header"
import { Hero } from "@/components/blocks/hero"
import { TrustBadges } from "@/components/blocks/trust-badges"
import { FeatureSection } from "@/components/blocks/feature-section"
import { ProductGrid } from "@/components/blocks/product-grid"
import { Testimonials } from "@/components/blocks/testimonials"
import { CTABanner } from "@/components/blocks/cta-banner"
import { Newsletter } from "@/components/blocks/newsletter"
import { Footer } from "@/components/blocks/footer"

export default function HomePage() {
  return (
    <main>
      <Header />
      <Hero />
      <TrustBadges />
      <ProductGrid />
      <FeatureSection />
      <Testimonials />
      <CTABanner />
      <Newsletter />
      <Footer />
    </main>
  )
}
