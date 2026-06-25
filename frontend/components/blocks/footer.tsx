"use client"

import Link from "next/link"
import { Facebook } from "lucide-react"

const footerLinks = {
  shop: [
    { name: "All Products", href: "/shop" },
    { name: "Perfumes", href: "/shop?category=perfumes" },
    { name: "Makeup", href: "/shop?category=makeup" },
    { name: "Skin Care", href: "/shop?category=skincare" },
  ],
  support: [
    { name: "Track Order", href: "/status" },
    { name: "Checkout", href: "/payment" },

  ],
}

export function Footer() {
  return (
    <footer className="bg-background py-12">
      <div className="storefront-shell">
        <div className="border-b border-border pb-12">
          <div className="grid gap-10 md:grid-cols-[1.2fr_1fr_1fr]">
            <div>
              <h2 className="mb-4 font-serif text-5xl font-semibold text-foreground">Essencia</h2>
              <p className="max-w-sm text-sm leading-6 text-muted-foreground">
                Your one and only fragrance, makeup, and skincare essentials for modern rituals.
              </p>
              <a
                href="https://www.facebook.com/essencia.edp"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex size-10 items-center justify-center border border-border text-foreground transition-colors hover:bg-foreground hover:text-background"
                aria-label="Facebook"
              >
                <Facebook className="size-4" />
              </a>
            </div>

            <FooterColumn title="Shop" links={footerLinks.shop} />
            <FooterColumn title="Support" links={footerLinks.support} />
          </div>
        </div>

        <div className="flex flex-col gap-4 pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Essencia. All rights reserved.</p>
          <div className="flex gap-5">
            <Link href="/" className="hover:text-foreground">Privacy</Link>
            <Link href="/" className="hover:text-foreground">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({ title, links }: { title: string; links: { name: string; href: string }[] }) {
  return (
    <div>
      <h3 className="mb-4 text-xs font-semibold uppercase text-foreground" style={{ letterSpacing: "0.16em" }}>{title}</h3>
      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link.name}>
            <Link href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              {link.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
