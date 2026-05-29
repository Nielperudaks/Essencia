"use client"

import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import type { RefObject } from "react"

gsap.registerPlugin(ScrollTrigger, useGSAP)

export function prefersReducedMotion() {
  if (typeof window === "undefined") return true
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

type StorefrontGsapSetup = (context: {
  gsap: typeof gsap
  ScrollTrigger: typeof ScrollTrigger
}) => void

export function useStorefrontGsap(
  scope: RefObject<HTMLElement | null>,
  setup: StorefrontGsapSetup,
  dependencies: unknown[] = [],
) {
  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      setup({ gsap, ScrollTrigger })
    },
    { scope, dependencies },
  )
}

export { gsap, ScrollTrigger }
