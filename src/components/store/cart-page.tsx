'use client';

import Image from "next/image";
import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { useCart } from "@/components/store/cart-provider";
import { QuantityStepper } from "@/components/store/quantity-stepper";
import { Button, ButtonLink } from "@/components/ui/button";
import { formatCurrency, isUploadedProductImageUrl } from "@/lib/utils";

export function CartPageClient() {
  const { cart, isReady, isMutating, setQuantity, clearCart } = useCart();

  if (!isReady) {
    return (
      <div className="container-shell py-12">
        <div className="grid gap-4">
          <div className="skeleton h-24 rounded-[28px]" />
          <div className="skeleton h-56 rounded-[28px]" />
          <div className="skeleton h-56 rounded-[28px]" />
        </div>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="container-shell py-12">
        <EmptyState
          title="Your cart is empty"
          description="Browse products and add your favorites before checking out."
          ctaLabel="Browse products"
          ctaHref="/products"
        />
      </div>
    );
  }

  return (
    <div className="container-shell grid gap-8 py-12 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="space-y-4">
        {cart.items.map((item) => (
          <article
            key={item.id}
            className="glass-card grid gap-4 rounded-[32px] p-5 sm:grid-cols-[120px_1fr_auto]"
          >
            <div className="relative aspect-square overflow-hidden rounded-[24px] bg-[rgba(19,24,47,0.05)]">
              {item.product.mainImage ? (
                <Image
                  src={item.product.mainImage.imageUrl}
                  alt={item.product.mainImage.altText ?? item.product.name}
                  fill
                  className="object-cover"
                  sizes="120px"
                  unoptimized={isUploadedProductImageUrl(item.product.mainImage.imageUrl)}
                />
              ) : null}
            </div>
            <div className="space-y-2">
              <Link
                href={`/products/${item.product.slug}`}
                className="display-title text-2xl font-semibold text-[var(--navy-950)]"
              >
                {item.product.name}
              </Link>
              <p className="text-sm text-[var(--ink-700)]">
                Unit price: {formatCurrency(item.unitPriceCents)}
              </p>
              <p className="text-sm text-[var(--ink-500)]">
                Available now: {item.product.stock}
              </p>
              <QuantityStepper
                value={item.quantity}
                max={Math.max(item.quantity + item.product.stock, 1)}
                onChange={(next) => void setQuantity(item.product.id, next)}
              />
            </div>
            <div className="flex flex-col items-start justify-between gap-3 sm:items-end">
              <p className="text-xl font-semibold text-[var(--navy-950)]">
                {formatCurrency(item.totalPriceCents)}
              </p>
              <button
                type="button"
                className="text-sm font-semibold text-[var(--danger-500)]"
                onClick={() => void setQuantity(item.product.id, 0)}
              >
                Remove
              </button>
            </div>
          </article>
        ))}
      </section>

      <aside className="glass-card h-fit rounded-[36px] p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[var(--pink-500)]">
          Order summary
        </p>
        <h1 className="mt-3 display-title text-3xl font-semibold text-[var(--navy-950)]">
          Cart overview
        </h1>
        <div className="mt-8 space-y-4 text-sm text-[var(--ink-700)]">
          <div className="flex justify-between">
            <span>Items</span>
            <span>{cart.itemCount}</span>
          </div>
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-semibold text-[var(--navy-950)]">
              {formatCurrency(cart.subtotalCents)}
            </span>
          </div>
        </div>
        <div className="mt-8 grid gap-3">
          <ButtonLink href="/checkout">Proceed to checkout</ButtonLink>
          <Button
            type="button"
            variant="secondary"
            disabled={isMutating}
            onClick={() => void clearCart()}
          >
            Clear cart
          </Button>
        </div>
      </aside>
    </div>
  );
}
