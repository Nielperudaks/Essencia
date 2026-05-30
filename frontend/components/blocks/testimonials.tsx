"use client";

import { useRef } from "react";
import { useStorefrontGsap } from "@/hooks/use-storefront-gsap";
import { TextRevealByWord } from "../ui/text-reveal";

const testimonials = [
  {
    id: 1,
    name: "Sarah M.",
    location: "New York",
    text: "The scent wears cleanly and quietly. It feels polished without trying too hard.",
    product: "Signature Perfume",
  },
  {
    id: 2,
    name: "Emma L.",
    location: "Los Angeles",
    text: "I like that the products feel edited. Everything has a purpose and a finish.",
    product: "Daily Ritual Set",
  },
  {
    id: 3,
    name: "Jessica R.",
    location: "Chicago",
    text: "Simple packaging, beautiful texture, and a formula that works with my skin.",
    product: "Skin Essential",
  },
];

export function Testimonials() {
  const sectionRef = useRef<HTMLElement>(null);

  useStorefrontGsap(sectionRef, ({ gsap }) => {
    gsap.from("[data-testimonial]", {
      y: 36,
      opacity: 0,
      duration: 1,
      stagger: 0.3,
      ease: "power3.out",
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top 80%",
      },
    });
  });

  return (
    <section ref={sectionRef} className="storefront-section bg-transparent">
      <div className="storefront-shell">
        <div className="mb-12 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <span className="storefront-kicker">Kind Words</span>
            {/* <h2 className="storefront-heading">Worn quietly. Remembered clearly.</h2> */}
            <TextRevealByWord text="Don't just take our word for it—hear from the people who've experienced the difference." />
          </div>
          <p className="storefront-copy text-lg md:text-2xl">
            Their experiences reflect our
            commitment to quality, authenticity, and exceptional customer
            service. Discover why beauty lovers keep coming back to us for
            products that make them feel confident and radiant.
          </p>
        </div>

        <div className="grid gap-px overflow-hidden border border-border bg-border lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <article
              key={testimonial.id}
              data-testimonial
              className="bg-background p-6 sm:p-8"
            >
              <p className="mb-10 font-serif text-3xl font-semibold leading-tight text-foreground">
                &ldquo;{testimonial.text}&rdquo;
              </p>
              <div className="flex items-end justify-between gap-4 border-t border-border pt-5">
                <div>
                  <p className="font-medium text-foreground">
                    {testimonial.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {testimonial.location}
                  </p>
                </div>
                <span
                  className="text-right text-[10px] font-semibold uppercase text-muted-foreground"
                  style={{ letterSpacing: "0.16em" }}
                >
                  {testimonial.product}
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
