import Image from "next/image";
import Link from "next/link";

import { AddToCartButton } from "@/components/store/add-to-cart-button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, isUploadedProductImageUrl } from "@/lib/utils";

type ProductCardProps = {
  product: {
    id: string;
    name: string;
    slug: string;
    description: string;
    stock: number;
    priceCents: number;
    effectivePriceCents: number;
    mainImage: {
      imageUrl: string;
      altText: string | null;
    } | null;
    activeDiscount: {
      discountedPriceCents: number;
      endAt: Date;
    } | null;
    section: {
      name: string;
      slug: string;
    } | null;
  };
};

export function ProductCard({ product }: ProductCardProps) {
  return (
    <article className="glass-card group flex h-full flex-col overflow-hidden rounded-[30px] p-4 animate-float-up">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-[4/4.3] overflow-hidden rounded-[24px] bg-[rgba(19,24,47,0.04)]">
          {product.mainImage ? (
            <Image
              src={product.mainImage.imageUrl}
              alt={product.mainImage.altText ?? product.name}
              fill
              className="object-cover transition duration-300 group-hover:scale-[1.03]"
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 33vw, 25vw"
              unoptimized={isUploadedProductImageUrl(product.mainImage.imageUrl)}
            />
          ) : null}
          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            {product.activeDiscount ? <Badge tone="discount">Sale</Badge> : null}
            {product.stock <= 0 ? <Badge tone="danger">Out of stock</Badge> : null}
          </div>
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-4 px-2 pt-5">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--ink-500)]">
            {product.section?.name ?? "Unassigned"}
          </p>
          <Link href={`/products/${product.slug}`}>
            <h3 className="display-title text-xl font-semibold text-[var(--navy-950)]">
              {product.name}
            </h3>
          </Link>
          <p className="line-clamp-3 text-sm leading-7 text-[var(--ink-700)]">
            {product.description}
          </p>
        </div>
        <div className="mt-auto space-y-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xl font-semibold text-[var(--navy-950)]">
                  {formatCurrency(product.effectivePriceCents)}
                </p>
                {product.activeDiscount ? (
                  <p className="text-sm text-[var(--ink-500)] line-through">
                    {formatCurrency(product.priceCents)}
                  </p>
                ) : null}
              </div>
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--ink-500)]">
                {product.stock > 0 ? `${product.stock} in stock` : "Currently unavailable"}
              </p>
            </div>
          </div>
          <AddToCartButton
            productId={product.id}
            disabled={product.stock <= 0}
            fullWidth
          />
        </div>
      </div>
    </article>
  );
}
