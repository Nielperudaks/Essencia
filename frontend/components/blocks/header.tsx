"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, ShoppingBag, Truck, X } from "lucide-react"
import { CartDrawer } from "./cart-drawer"
import { useCart } from "./cart-context"

const navLinks = [
  { href: "/shop", label: "Shop" },
  { href: "/", label: "About" },
]

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { setIsOpen, itemCount } = useCart()

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5">
      <nav className="storefront-shell border border-white/20 bg-background/70 py-0 backdrop-blur-xl supports-[backdrop-filter]:bg-background/50">
        <div className="flex h-12 items-center justify-between">
          <button
            type="button"
            className="storefront-icon-button lg:hidden"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>

          <div className="hidden items-center gap-7 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-xs font-medium uppercase text-foreground/70 transition-colors hover:text-foreground"
                style={{ letterSpacing: "0.16em" }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <Link href="/" className="absolute left-1/2 -translate-x-1/2">
            <span className="font-serif text-xl font-semibold text-foreground sm:text-xl">Essencia</span>
          </Link>

          <div className="flex items-center gap-2">
            <Link href="/status" className="storefront-icon-button hidden sm:inline-flex" aria-label="Track order">
              <Truck className="size-4" />
            </Link>
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="storefront-icon-button relative"
              aria-label="Cart"
            >
              <ShoppingBag className="size-4" />
              {itemCount > 0 && (
                <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-foreground text-[10px] font-semibold text-background">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        <CartDrawer />

        <div className={`overflow-hidden transition-[max-height,padding] duration-300 lg:hidden ${isMenuOpen ? "max-h-56 pb-5" : "max-h-0"}`}>
          <div className="border-t border-border pt-4">
            <div className="grid gap-2">
              {[...navLinks, { href: "/status", label: "Track" }].map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="border border-border px-4 py-3 text-sm font-medium uppercase text-foreground"
                  style={{ letterSpacing: "0.14em" }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </nav>
    </header>
  )
}
