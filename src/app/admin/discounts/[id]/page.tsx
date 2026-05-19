import { notFound } from "next/navigation";

import { DiscountEditor } from "@/components/admin/discount-editor";
import { getAdminDiscountById, getDiscountFormProducts } from "@/lib/services/admin";

export default async function EditDiscountPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [discount, products] = await Promise.all([
    getAdminDiscountById(id),
    getDiscountFormProducts(id),
  ]);

  if (!discount) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[var(--pink-500)]">
          Promotions
        </p>
        <h1 className="mt-2 display-title text-4xl font-semibold text-[var(--navy-950)]">
          Edit discount
        </h1>
      </div>
      <DiscountEditor
        discount={{
          id: discount.id,
          productId: discount.productId,
          type: discount.type,
          value: discount.value,
          startAt: discount.startAt,
          endAt: discount.endAt,
        }}
        products={products}
      />
    </div>
  );
}
