"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { useStorefrontGsap } from "@/hooks/use-storefront-gsap";
import { api, type Product } from "@/lib/api";
import { formatCurrency } from "@/lib/currency";
import { useCart } from "./cart-context";

type Category = "Perfumes" | "Makeup" | "Skincare";

const categories = [
  { value: "Perfumes" as Category, label: "Perfume" },
  { value: "Makeup" as Category, label: "Makeup" },
  { value: "Skincare" as Category, label: "Skin" },
];

export function ProductGrid() {
  const [productsByCategory, setProductsByCategory] = useState<
    Partial<Record<Category, Product[]>>
  >({});
  const [selectedCategory, setSelectedCategory] =
    useState<Category>("Perfumes");
  const sectionRef = useRef<HTMLElement>(null);
  const { addItem } = useCart();

  useStorefrontGsap(sectionRef, ({ gsap }) => {
    gsap.from("[data-product-heading]", {
      y: 34,
      opacity: 0,
      duration: 0.8,
      ease: "power3.out",
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top 72%",
      },
    });
  });

  useStorefrontGsap(
    sectionRef,
    ({ gsap }) => {
      gsap.from("[data-featured-product]", {
        y: 42,
        opacity: 0,
        duration: 0.75,
        stagger: 0.08,
        ease: "power3.out",
        scrollTrigger: {
          trigger: "[data-testid='products-grid']",
          start: "top 82%",
        },
      });
    },
    [selectedCategory, productsByCategory[selectedCategory]?.length ?? 0],
  );

  useEffect(() => {
    if (productsByCategory[selectedCategory]) return;

    let cancelled = false;

    api
      .listProductPage({ category: selectedCategory, limit: 4, offset: 0 })
      .then((page) => {
        if (cancelled) return;
        setProductsByCategory((current) => ({
          ...current,
          [selectedCategory]: page.items,
        }));
      })
      .catch(() => {
        if (cancelled) return;
        setProductsByCategory((current) => ({
          ...current,
          [selectedCategory]: [],
        }));
      });

    return () => {
      cancelled = true;
    };
  }, [productsByCategory, selectedCategory]);

  const filteredProducts = productsByCategory[selectedCategory] ?? [];
  const loading = !productsByCategory[selectedCategory];

  return (
    <section
      ref={sectionRef}
      className="storefront-section bg-transparent"
      data-testid="product-grid-section"
    >
      <div className="storefront-shell">
        <div
          data-product-heading
          className="mb-12 grid gap-6 lg:grid-cols-[1fr_420px] lg:items-end"
        >
          <div>
            <span className="storefront-kicker">Curated Collection</span>
            <h2 className="storefront-heading">Gentle Essentials.</h2>
          </div>
          <p className="storefront-copy lg:justify-self-end">
            From nourishing skincare essentials to luxurious
            beauty must-haves, each item is carefully made to bring comfort,
            confidence, and a touch of indulgence to your everyday routine.
           
          </p>
        </div>

        <div className="mb-10 flex flex-col gap-5 border-y border-border py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.value}
                type="button"
                data-testid={`category-tab-${category.value.toLowerCase()}`}
                onClick={() => setSelectedCategory(category.value)}
                className={
                  selectedCategory === category.value
                    ? "storefront-button min-h-10 px-5 py-2"
                    : "storefront-button-outline min-h-10 px-5 py-2"
                }
              >
                {category.label}
              </button>
            ))}
          </div>
          <Link
            href="/shop"
            data-testid="view-all-products-btn"
            className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-muted-foreground"
          >
            View all products
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <div
          className="grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-2 lg:grid-cols-4"
          data-testid="products-grid"
        >
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse bg-muted" />
            ))
          ) : filteredProducts.length === 0 ? (
            <div
              className="col-span-full bg-background py-16 text-center text-muted-foreground"
              data-testid="no-products"
            >
              No products in this category yet.
            </div>
          ) : (
            filteredProducts.map((product) => (
              <Link
                key={`${selectedCategory}-${product.id}`}
                href={`/product/${product.id}`}
                data-testid={`product-card-${product.id}`}
                data-featured-product
                className="group bg-background"
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-muted">
                  <Image
                    src={product.image || "/placeholder.svg"}
                    alt={product.name}
                    fill
                    loading="lazy"
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover grayscale transition duration-700 group-hover:scale-105 group-hover:grayscale-0"
                  />
                  {product.badge && (
                    <span
                      className="absolute left-4 top-4 border border-white/40 bg-black px-3 py-1 text-[10px] font-semibold uppercase text-white"
                      style={{ letterSpacing: "0.16em" }}
                    >
                      {product.badge}
                    </span>
                  )}
                  {product.stock <= 0 && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-[1px]">
                      <span
                        className="bg-foreground px-4 py-2 text-xs font-semibold uppercase text-background"
                        style={{ letterSpacing: "0.18em" }}
                      >
                        Sold out
                      </span>
                    </div>
                  )}
                  <button
                    type="button"
                    data-testid={`quick-add-${product.id}`}
                    disabled={product.stock <= 0}
                    className="absolute bottom-4 right-4 z-20 inline-flex size-11 items-center justify-center bg-background text-foreground opacity-0 transition group-hover:opacity-100 disabled:opacity-50"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (product.stock <= 0) return;
                      addItem({
                        id: product.id,
                        name: product.name,
                        description: product.description,
                        price: product.price,
                        image: product.image,
                        size: product.size,
                      });
                    }}
                    aria-label="Add to cart"
                  >
                    <ShoppingBag className="size-4" />
                  </button>
                </div>
                <div className="p-5">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <h3 className="font-serif text-2xl font-semibold leading-tight text-foreground">
                      {product.name}
                    </h3>
                    <span className="whitespace-nowrap text-sm font-medium text-foreground">
                      {formatCurrency(product.price)}
                    </span>
                  </div>
                  <p
                    className="mb-3 text-xs font-medium uppercase text-muted-foreground"
                    style={{ letterSpacing: "0.16em" }}
                  >
                    {product.gender}
                  </p>
                  <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
                    {product.description}
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
