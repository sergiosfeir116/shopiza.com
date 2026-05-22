'use client';

import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button, ButtonLink } from "@/components/ui/button";
import { formatCurrency, isUploadedProductImageUrl } from "@/lib/utils";

type ProductListItem = {
  id: string;
  name: string;
  slug: string;
  stock: number;
  priceCents: number;
  archived: boolean;
  mainImage: {
    imageUrl: string;
    altText: string | null;
  } | null;
  section: {
    name: string;
  } | null;
};

export function ProductListManager({ products }: { products: ProductListItem[] }) {
  const router = useRouter();

  if (products.length === 0) {
    return (
      <div className="glass-card rounded-[32px] p-8 text-center">
        <p className="text-sm text-[var(--ink-700)]">No products found.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
        {products.map((product) => (
          <article key={product.id} className="glass-card rounded-[30px] p-5">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div className="flex flex-1 items-start gap-4">
                <div className="relative h-24 w-24 overflow-hidden rounded-[22px] border border-[var(--line-soft)] bg-[rgba(19,24,47,0.04)]">
                  {product.mainImage ? (
                    <Image
                      src={product.mainImage.imageUrl}
                      alt={product.mainImage.altText ?? product.name}
                      fill
                      className="object-cover"
                      sizes="96px"
                      unoptimized={isUploadedProductImageUrl(product.mainImage.imageUrl)}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs font-semibold uppercase tracking-[0.24em] text-[var(--ink-500)]">
                      No image
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="display-title text-2xl font-semibold text-[var(--navy-950)]">
                    {product.name}
                  </h2>
                  <p className="mt-2 text-sm text-[var(--ink-700)]">
                    {product.section?.name ?? "Unassigned"} • {formatCurrency(product.priceCents)} • {product.stock} in stock
                  </p>
                  {product.archived ? (
                    <p className="mt-2 text-xs uppercase tracking-[0.28em] text-[var(--danger-500)]">
                      Archived
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="flex gap-3">
                <ButtonLink href={`/admin/products/${product.id}`} variant="secondary">
                  Edit
                </ButtonLink>
                <Button
                  type="button"
                  variant="danger"
                  onClick={async () => {
                    if (!window.confirm("Delete this product permanently?")) {
                      return;
                    }
                    const response = await fetch(`/api/admin/products/${product.id}`, {
                      method: "DELETE",
                    });
                    const data = (await response.json()) as { message?: string };
                    if (!response.ok) {
                      toast.error(data.message ?? "Could not delete the product.");
                      return;
                    }
                    toast.success("Product deleted.");
                    router.refresh();
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          </article>
        ))}
    </div>
  );
}
