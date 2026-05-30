"use client";

import { useRef } from "react";
import Image from "next/image";
import { Award, Leaf, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import { useStorefrontGsap } from "@/hooks/use-storefront-gsap";

const features = [
  {
    icon: ShieldCheck,
    title: "Skin-aware",
    description: "Carefully crafted to be gentle on all skin types.",
  },
  {
    icon: Leaf,
    title: "100% Clean",
    description: "No synthetic chemicals or parabens, just pure, effective care.",
  },
  {
    icon: TrendingUp,
    title: "Long-Lasting Performance",
    description: "Formulated to keep you fresh and radiant all day long.",
  },
  {
    icon: Sparkles,
    title: "Occasion ready",
    description: "From quiet mornings to all-out evenings.",
  },
];

export function FeatureSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useStorefrontGsap(sectionRef, ({ gsap }) => {
    gsap.from("[data-story-copy]", {
      y: 42,
      opacity: 0,
      duration: 0.8,
      ease: "power3.out",
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top 70%",
      },
    });

    gsap.to("[data-story-media='large']", {
      yPercent: -8,
      ease: "none",
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      },
    });

    gsap.from("[data-feature-item]", {
      y: 26,
      opacity: 0,
      stagger: 0.08,
      duration: 0.65,
      ease: "power3.out",
      scrollTrigger: {
        trigger: "[data-feature-list]",
        start: "top 78%",
      },
    });
  });

  return (
    <section
      ref={sectionRef}
      className="storefront-section overflow-hidden border-y border-border bg-foreground text-background relative"
    >
      <div className="storefront-shell">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div data-story-copy>
            <span className="storefront-kicker text-background/60">
              Why Essencia
            </span>
            <h2 className="max-w-3xl font-serif text-5xl font-semibold leading-[0.95] text-background sm:text-6xl lg:text-8xl">
              Care that lives.
            </h2>
            <p className="mt-8 max-w-lg text-base leading-7 text-background/70 sm:text-lg">
              Discover a curated collection of luxurious fragrances, skincare
              essentials, and beauty products designed to enhance your
              confidence and style. From timeless perfumes to everyday beauty
              must-haves, we bring you quality products that help you look and
              feel your best.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div
              className="storefront-media aspect-[4/5] border-background/20 bg-background/10 sm:mt-16"
              data-story-media="large"
            >
              <Image
                src="https://4fisedqbxckj3iqj.public.blob.vercel-storage.com/2.png"
                alt="Essencia ritual"
                fill
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="object-cover "
              />
            </div>
            <div className="space-y-4 ">
              <div className="storefront-media aspect-[4/3] border-background/20 bg-background/10 grayscale hover:grayscale-0 hover:scale-125 duration-500 hover:z-10">
                <Image
                  src="https://4fisedqbxckj3iqj.public.blob.vercel-storage.com/1.png"
                  alt="Natural ingredient texture"
                  fill
                  sizes="(min-width: 1024px) 25vw, 100vw"
                  className="object-cover"
                />
              </div>
              <video
                autoPlay
                muted
                loop
                playsInline
                className="aspect-[4/5] w-full border border-background/20 object-cover grayscale hover:grayscale-0 hover:scale-125 duration-500"
              >
                <source
                  src="https://4fisedqbxckj3iqj.public.blob.vercel-storage.com/feature-WOHu9u8Rlj90v6ytwrsmnNluBvDtTE"
                  type="video/mp4"
                />
              </video>
            </div>
          </div>
        </div>

        <div
          data-feature-list
          className="mt-16 grid gap-px overflow-hidden border border-background/20 bg-background/20 sm:grid-cols-2 lg:grid-cols-4"
        >
          {features.map((feature) => (
            <div
              key={feature.title}
              data-feature-item
              className="bg-foreground p-6 text-background"
            >
              <feature.icon
                className="mb-8 size-5 text-background"
                strokeWidth={1.5}
              />
              <h3 className="mb-3 font-serif text-2xl font-semibold">
                {feature.title}
              </h3>
              <p className="text-sm leading-6 text-background/65">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
