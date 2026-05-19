'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { SelectField, TextField } from "@/components/ui/field";
import { formatCurrency } from "@/lib/utils";

function toDateTimeLocalValue(date: Date) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}

export function DiscountEditor({
  discount,
  products,
}: {
  discount?: {
    id: string;
    productId: string;
    type: "PERCENTAGE" | "FIXED_AMOUNT";
    value: number;
    startAt: Date;
    endAt: Date;
  };
  products: Array<{
    id: string;
    name: string;
    priceCents: number;
  }>;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [startImmediately, setStartImmediately] = useState(!discount);

  return (
    <form
      className="glass-card rounded-[36px] p-8"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setErrors({});

        const formData = new FormData(event.currentTarget);
        const productId = String(formData.get("productId") ?? "");
        const product = products.find((item) => item.id === productId);

        if (!product) {
          toast.error("Select a product.");
          setPending(false);
          return;
        }

        const payload = {
          productId,
          type: String(formData.get("type") ?? "PERCENTAGE"),
          value: Number(formData.get("value") ?? "0"),
          priceCents: product.priceCents,
          startAt: startImmediately ? "" : String(formData.get("startAt") ?? ""),
          endAt: String(formData.get("endAt") ?? ""),
          startImmediately,
          isActive: true,
        };

        const response = await fetch(
          discount ? `/api/admin/discounts/${discount.id}` : "/api/admin/discounts",
          {
            method: discount ? "PUT" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        );
        const data = (await response.json()) as {
          message?: string;
          errors?: Record<string, string[]>;
        };

        if (!response.ok) {
          const firstError = Object.values(data.errors ?? {}).flat()[0];
          setErrors(data.errors ?? {});
          toast.error(data.message ?? firstError ?? "Could not save the discount.");
          setPending(false);
          return;
        }

        toast.success(discount ? "Discount updated." : "Discount created.");
        router.push("/admin/discounts");
        router.refresh();
      }}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <SelectField
            label="Product"
            name="productId"
            defaultValue={discount?.productId ?? products[0]?.id ?? ""}
          >
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} ({formatCurrency(product.priceCents)})
              </option>
            ))}
          </SelectField>
          {errors.productId ? (
            <p className="mt-2 text-xs text-[var(--danger-500)]">{errors.productId[0]}</p>
          ) : null}
        </div>
        <div>
          <SelectField
            label="Discount type"
            name="type"
            defaultValue={discount?.type ?? "PERCENTAGE"}
          >
            <option value="PERCENTAGE">Percentage</option>
            <option value="FIXED_AMOUNT">Fixed amount</option>
          </SelectField>
          {errors.type ? (
            <p className="mt-2 text-xs text-[var(--danger-500)]">{errors.type[0]}</p>
          ) : null}
        </div>
        <div>
          <TextField
            label="Value"
            name="value"
            type="number"
            step="1"
            min="1"
            required
            defaultValue={
              discount
                ? discount.type === "FIXED_AMOUNT"
                  ? String(discount.value / 100)
                  : String(discount.value)
                : undefined
            }
          />
          {errors.value ? (
            <p className="mt-2 text-xs text-[var(--danger-500)]">{errors.value[0]}</p>
          ) : null}
        </div>
        {startImmediately ? null : (
          <div>
            <TextField
              label="Start at"
              name="startAt"
              type="datetime-local"
              required
              defaultValue={discount ? toDateTimeLocalValue(discount.startAt) : undefined}
            />
            {errors.startAt ? (
              <p className="mt-2 text-xs text-[var(--danger-500)]">{errors.startAt[0]}</p>
            ) : null}
          </div>
        )}
        <div>
          <TextField
            label="End at"
            name="endAt"
            type="datetime-local"
            required
            defaultValue={discount ? toDateTimeLocalValue(discount.endAt) : undefined}
          />
          {errors.endAt ? (
            <p className="mt-2 text-xs text-[var(--danger-500)]">{errors.endAt[0]}</p>
          ) : null}
        </div>
      </div>

      <label className="mt-4 inline-flex items-center gap-3 text-sm font-medium text-[var(--navy-950)]">
        <input
          type="checkbox"
          checked={startImmediately}
          onChange={(event) => setStartImmediately(event.currentTarget.checked)}
          className="h-4 w-4"
        />
        Active immediately
      </label>

      <div className="mt-8 flex gap-3">
        <Button type="submit" disabled={pending || products.length === 0}>
          {pending ? "Saving..." : discount ? "Update discount" : "Create discount"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={pending}
          onClick={() => router.push("/admin/discounts")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
