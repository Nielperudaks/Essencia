"use client"

import { useRef } from "react"
import { Dna, Repeat, Sparkles, TrendingUp } from "lucide-react"
import { useStorefrontGsap } from "@/hooks/use-storefront-gsap"

const badges = [
  {
    icon: Dna,
    title: "Skin-Friendly Formula ",
    description: "Dermatologically tested",
  },
  {
    icon: TrendingUp,
    title: "Long lasting",
    description: "Always stay fresh and radiant",
  },
  {
    icon: Sparkles,
    title: "Superior Ingredients",
    description: "Carefully hand-picked ingredients",
  },
  {
    icon: Repeat,
    title: "Unrivalled Versatility",
    description: "Perfect for any Occasions",
  },
]

export function TrustBadges() {
  const sectionRef = useRef<HTMLElement>(null)

  useStorefrontGsap(sectionRef, ({ gsap }) => {
    gsap.from("[data-trust-card]", {
      y: 28,
      opacity: 0,
      duration: 1.5,
      stagger: 0.08,
      ease: "power3.out",
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top 70%",
      },
    })
  })

  return (
    <section ref={sectionRef} className="border-b border-border bg-transparent py-10">
      
      <div className="storefront-shell">
        <div className="grid grid-cols-2 gap-px overflow-hidden border border-border bg-border lg:grid-cols-4">
          {badges.map((badge) => (
            <div key={badge.title} data-trust-card className="bg-background p-5 sm:p-7">
              <badge.icon className="mb-6 size-5 text-foreground" strokeWidth={1.5} />
              <h3 className="mb-2 font-serif text-2xl font-semibold text-foreground">{badge.title}</h3>
              <p className="max-w-48 text-sm leading-6 text-muted-foreground">{badge.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
