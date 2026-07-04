"use client";

import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { formatCurrency } from "@/lib/currency";
import { useCart } from "./cart-context";

export function CartDrawer() {
  const {
    items,
    removeItem,
    updateQuantity,
    isOpen,
    setIsOpen,
    itemCount,
    subtotal,
  } = useCart();

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen} direction="right">
      <DrawerContent className="h-full w-full border-l border-border bg-background sm:max-w-[460px]">
        <DrawerHeader className="border-b border-border p-6">
          <DrawerTitle className="font-serif text-4xl font-semibold">
            Cart
          </DrawerTitle>
          <DrawerDescription className="text-sm text-muted-foreground">
            {itemCount} {itemCount === 1 ? "item" : "items"} in your cart
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-5 flex size-16 items-center justify-center border border-border">
                <ShoppingBag className="size-6 text-muted-foreground" />
              </div>
              <p className="font-serif text-2xl font-semibold text-foreground">
                Your cart is empty
              </p>
              <p className="mt-2 max-w-56 text-sm leading-6 text-muted-foreground">
                Start with a precise essential from the collection.
              </p>
              <DrawerClose asChild>
                <Link href="/shop" className="storefront-button mt-6">
                  Continue shopping
                </Link>
              </DrawerClose>
            </div>
          ) : (
            <div className="space-y-px border border-border bg-border">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[60px_1fr] md:grid-cols-[88px_1fr] gap-4 bg-background p-4"
                >
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    <Image
                      src={item.image || "/placeholder.svg"}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex flex-col md:flex-row gap-2">
                        <div className="">
                          <h3 className="font-serif text-xl font-semibold leading-tight text-foreground">
                            {item.name}
                          </h3>
                          {item.size && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              Size: {item.size}
                            </p>
                          )}
                        </div>
                        <div className="">
                          <p className="whitespace-nowrap text-sm font-medium text-foreground">
                            {formatCurrency(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">
                      {item.description}
                    </p>

                    <div className="mt-4 flex items-center gap-2">
                      <div className="inline-flex border border-border">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                          className="flex size-9 items-center justify-center hover:bg-muted"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="size-3" />
                        </button>
                        <span className="flex h-9 min-w-9 items-center justify-center border-x border-border text-sm font-medium">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          className="flex size-9 items-center justify-center hover:bg-muted"
                          aria-label="Increase quantity"
                        >
                          <Plus className="size-3" />
                        </button>
                      </div>

                      {/* <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="storefront-icon-button size-9"
                        aria-label="Remove item"
                      >
                        <Trash2 className="size-4" />
                      </button> */}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <DrawerFooter className="border-t border-border p-6">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span>Via J&T</span>
              </div>
              <div className="flex justify-between border-t border-border pt-4 text-base font-semibold text-foreground">
                <span>Total</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
            </div>

            <Link
              href="/payment"
              onClick={() => setIsOpen(false)}
              data-testid="checkout-btn"
              className="storefront-button mt-2 w-full"
            >
              Checkout
            </Link>

            <DrawerClose asChild>
              <button
                type="button"
                className="storefront-button-outline w-full"
              >
                Continue shopping
              </button>
            </DrawerClose>
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  );
}
