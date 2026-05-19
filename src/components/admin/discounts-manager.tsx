'use client';

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button, ButtonLink } from "@/components/ui/button";
import { formatCurrency, formatDateTime } from "@/lib/utils";

type DiscountItem = {
  id: string;
  type: "PERCENTAGE" | "FIXED_AMOUNT";
  value: number;
  discountedPriceCents: number;
  startAt: Date;
  endAt: Date;
  isActive: boolean;
  product: {
    id: string;
    name: string;
    priceCents: number;
  };
};

export function DiscountsManager({
  discounts,
}: {
  discounts: DiscountItem[];
}) {
  const router = useRouter();

  if (discounts.length === 0) {
    return (
      <div className="glass-card rounded-[32px] p-8 text-center">
        <p className="text-sm text-[var(--ink-700)]">No discounts found.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {discounts.map((discount) => (
        <article
          key={discount.id}
          className="glass-card rounded-[32px] p-6"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="display-title text-2xl font-semibold text-[var(--navy-950)]">
                {discount.product.name}
              </h3>
              <p className="mt-2 text-sm text-[var(--ink-700)]">
                Now {formatCurrency(discount.discountedPriceCents)} |{" "}
                {discount.type === "PERCENTAGE"
                  ? `${discount.value}% off`
                  : `${formatCurrency(discount.value)} off`}
              </p>
              <p className="mt-2 text-xs uppercase tracking-[0.26em] text-[var(--ink-500)]">
                {formatDateTime(discount.startAt)} to {formatDateTime(discount.endAt)}
              </p>
            </div>
            <div className="flex gap-3">
              <ButtonLink href={`/admin/discounts/${discount.id}`} variant="secondary">
                Edit
              </ButtonLink>
              <Button
                type="button"
                variant="danger"
                onClick={async () => {
                  if (!window.confirm("Delete this discount?")) {
                    return;
                  }

                  const response = await fetch(`/api/admin/discounts/${discount.id}`, {
                    method: "DELETE",
                  });
                  const data = (await response.json()) as { message?: string };
                  if (!response.ok) {
                    toast.error(data.message ?? "Could not delete the discount.");
                    return;
                  }
                  toast.success("Discount deleted.");
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
