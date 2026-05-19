import { DiscountEditor } from "@/components/admin/discount-editor";
import { getDiscountFormProducts } from "@/lib/services/admin";

export default async function NewDiscountPage() {
  const products = await getDiscountFormProducts();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[var(--pink-500)]">
          Promotions
        </p>
        <h1 className="mt-2 display-title text-4xl font-semibold text-[var(--navy-950)]">
          Create discount
        </h1>
      </div>
      <DiscountEditor products={products} />
    </div>
  );
}
