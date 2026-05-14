"use client"

import React from "react"

import { useState } from "react"
import { ArrowRight, Check } from "lucide-react"

export function Newsletter() {
  const [email, setEmail] = useState("")
  const [isSubscribed, setIsSubscribed] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      setIsSubscribed(true)
      setEmail("")
    }
  }

  return (
    <section className="py-24 bg-primary">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-serif text-4xl leading-tight text-primary-foreground mb-4 text-balance md:text-7xl font-light">
            Keep in touch with <span className="font-bold">Essencia</span>
          </h2>
          <p className="text-lg text-primary-foreground/80 mb-10">
            Contact us for exclusive offers, skincare tips, and the latest news on our natural products. We promise to keep your inbox fresh and inspiring.
          </p>

          {isSubscribed ? (
            <div className="inline-flex items-center gap-3 bg-primary-foreground/10 backdrop-blur-sm rounded-full px-8 py-4">
              <Check className="w-5 h-5 text-primary-foreground" />
              <span className="text-primary-foreground">Welcome to the blocks family!</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 rounded-full px-6 py-4 text-primary-foreground placeholder:text-primary-foreground/50 focus:outline-none focus:border-primary-foreground/40 blocks-transition"
                required
              />
              <button
                type="submit"
                className="group inline-flex items-center justify-center gap-2 bg-primary-foreground text-primary px-8 py-4 rounded-full text-sm tracking-wide blocks-transition hover:bg-primary-foreground/90"
              >
                Email now!
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 blocks-transition" />
              </button>
            </form>
          )}

          <p className="text-sm text-primary-foreground/60 mt-6">
            We’re here to help you on your journey to radiant, natural beauty.
          </p>
        </div>
      </div>
    </section>
  )
}
