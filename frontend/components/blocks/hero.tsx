"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useStorefrontGsap } from "@/hooks/use-storefront-gsap";
import { GooeyText } from "../ui/gooey-text-morphing";

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const heroTexts = ["Elegance", "Perfection", "Simplicity"];

  useStorefrontGsap(sectionRef, ({ gsap }) => {
    gsap.from("[data-hero-reveal]", {
      y: 42,
      opacity: 0,
      duration: 1,
      stagger: 0.12,
      ease: "power3.out",
    });

    gsap.to("[data-hero-media]", {
      yPercent: 12,
      scale: 1.08,
      ease: "none",
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top top",
        end: "bottom top",
        scrub: true,
      },
    });
  });

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen overflow-hidden bg-black text-white"
    >
      <div className="absolute inset-0" data-hero-media>
        <video
          autoPlay
          muted
          loop
          playsInline
          className="h-full w-full object-cover grayscale"
          poster="/images/hero-model.jpg"
        >
          <source
            src="https://4fisedqbxckj3iqj.public.blob.vercel-storage.com/HeroSpray"
            type="video/mp4"
          />
        </video>
      </div>
      <div className="absolute inset-0 bg-black/54" />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-black to-transparent" />

      <div className="storefront-shell relative z-10 flex min-h-screen items-end pb-20 pt-32  sm:pb-24 lg:pb-28">
        <div className="grid w-full gap-12 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <span
              data-hero-reveal
              className="mb-6 block text-xs font-medium uppercase text-white/70"
              style={{ letterSpacing: "0.18em" }}
            >
              Essencia Originals
            </span>
            <h1
              data-hero-reveal
              className="max-w-5xl  font-serif text-[clamp(4rem,13vw,12rem)] font-black leading-[0.82]  tracking-normal text-white"
            >
              Defined by
            </h1>
            <div className="md:h-[10rem] h-[6rem] relative">
                <GooeyText
                texts={heroTexts}
                morphTime={2}
                cooldownTime={1}
                className="font-extralight opacity-80"
              />
            </div>
          </div>

          <div className="min-w-0 max-w-[20rem] sm:max-w-sm lg:justify-self-end">
            <p
              data-hero-reveal
              className="max-w-full text-base leading-7 text-white/78"
            >
              A sharper ritual for fragrance, makeup, and skincare. Minimal by
              design, memorable on skin.
            </p>
            <div
              data-hero-reveal
              className="mt-8 flex flex-col gap-3 sm:flex-row lg:flex-col"
            >
              <Link
                href="/shop"
                className="storefront-button bg-white text-black hover:bg-white/86"
              >
                Explore collection
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/status"
                className="storefront-button-outline border-white/40 text-white hover:bg-white hover:text-black"
              >
                Track order
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-3 text-white/70 sm:flex">
        <span
          className="text-[10px] font-semibold uppercase"
          style={{ letterSpacing: "0.22em" }}
        >
          Scroll
        </span>
        <span className="h-14 w-px bg-white/30">
          <span className="block h-5 w-px animate-pulse bg-white" />
        </span>
      </div>
    </section>
  );
}
