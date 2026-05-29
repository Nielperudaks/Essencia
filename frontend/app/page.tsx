import { Header } from "@/components/blocks/header";
import { Hero } from "@/components/blocks/hero";
import { TrustBadges } from "@/components/blocks/trust-badges";
import { FeatureSection } from "@/components/blocks/feature-section";
import { ProductGrid } from "@/components/blocks/product-grid";
import { Testimonials } from "@/components/blocks/testimonials";
import { CTABanner } from "@/components/blocks/cta-banner";
import { Newsletter } from "@/components/blocks/newsletter";
import { Footer } from "@/components/blocks/footer";

export default function HomePage() {
  return (
    <main>
      <Header />
      <Hero />
      <div className="relative">
        <div className=" w-full relative">
          {/* Dashed Grid */}
          <div
            className="absolute inset-0 -z-10 pointer-events-none"
            style={{
              backgroundImage: `
        linear-gradient(to right, #e7e5e4 1px, transparent 1px),
        linear-gradient(to bottom, #e7e5e4 1px, transparent 1px)
      `,
              backgroundSize: "20px 20px",
              backgroundPosition: "0 0, 0 0",
              maskImage: `
        repeating-linear-gradient(
          to right,
          black 0px,
          black 3px,
          transparent 3px,
          transparent 8px
        ),
        repeating-linear-gradient(
          to bottom,
          black 0px,
          black 3px,
          transparent 3px,
          transparent 8px
        )
      `,
              WebkitMaskImage: `
        repeating-linear-gradient(
          to right,
          black 0px,
          black 3px,
          transparent 3px,
          transparent 8px
        ),
        repeating-linear-gradient(
          to bottom,
          black 0px,
          black 3px,
          transparent 3px,
          transparent 8px
        )
      `,
              maskComposite: "intersect",
              WebkitMaskComposite: "source-in",
            }}
          />
          <TrustBadges />
          <ProductGrid />
        </div>
      </div>

      <FeatureSection />
      <div className="relative">
        <div className=" w-full relative">
          {/* Dashed Grid */}
          <div
            className="absolute inset-0 -z-10 pointer-events-none"
            style={{
              backgroundImage: `
        linear-gradient(to right, #e7e5e4 1px, transparent 1px),
        linear-gradient(to bottom, #e7e5e4 1px, transparent 1px)
      `,
              backgroundSize: "20px 20px",
              backgroundPosition: "0 0, 0 0",
              maskImage: `
        repeating-linear-gradient(
          to right,
          black 0px,
          black 3px,
          transparent 3px,
          transparent 8px
        ),
        repeating-linear-gradient(
          to bottom,
          black 0px,
          black 3px,
          transparent 3px,
          transparent 8px
        )
      `,
              WebkitMaskImage: `
        repeating-linear-gradient(
          to right,
          black 0px,
          black 3px,
          transparent 3px,
          transparent 8px
        ),
        repeating-linear-gradient(
          to bottom,
          black 0px,
          black 3px,
          transparent 3px,
          transparent 8px
        )
      `,
              maskComposite: "intersect",
              WebkitMaskComposite: "source-in",
            }}
          />
          <Testimonials />
        </div>
      </div>
      {/* <CTABanner /> */}
      <Newsletter />
      <Footer />
    </main>
  );
}
