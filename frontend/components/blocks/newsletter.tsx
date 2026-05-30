"use client"

import { FormEvent, useState } from "react"
import { ArrowRight, Check } from "lucide-react"

export function Newsletter() {
  const [email, setEmail] = useState("")
  const [isSubscribed, setIsSubscribed] = useState(false)

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!email.trim()) return
    setIsSubscribed(true)
    setEmail("")
  }

  return (
    <section className="border-y border-border bg-foreground py-20 text-background sm:py-24">
      <div className="storefront-shell">
        <div className="grid gap-10 lg:grid-cols-[1fr_440px] lg:items-end">
          <div>
            <span className="storefront-kicker text-background/60">Contact</span>
            <h2 className="max-w-4xl font-serif text-5xl font-semibold leading-[0.95] text-background sm:text-6xl lg:text-8xl">
              Keep the ritual close.
            </h2>
          </div>

          <div>
            <p className="mb-8 text-base leading-7 text-background/70">
              Join the Essencia list for exclusive drops, product updates, and quiet notes on better daily essentials.
            </p>
            {isSubscribed ? (
              <div className="inline-flex min-h-12 items-center gap-3 border border-background/25 px-5 py-3 text-sm text-background">
                <Check className="size-4" />
                You are on the list.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Email address"
                  className="min-h-12 border border-background/25 bg-transparent px-4 py-3 text-sm text-background placeholder:text-background/45 focus:border-background focus:outline-none"
                  required
                />
                <button type="submit" className="storefront-button bg-background text-foreground hover:bg-background/85">
                  Join
                  <ArrowRight className="size-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
