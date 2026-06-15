import { ProductsFilters } from "@/components/store/products-filters";
import { ProductCard } from "@/components/store/product-card";
import { EmptyState } from "@/components/ui/empty-state";
import { redirectAdminHome } from "@/lib/auth/current-user";
import { getStoreSections, listProducts } from "@/lib/services/catalog";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    section?: string;
  }>;
}) {
  await redirectAdminHome();

  const params = await searchParams;
  const [sections, result] = await Promise.all([
    getStoreSections(),
    listProducts({
      query: params.q?.trim(),
      sectionSlug: params.section,
    }),
  ]);

  return (
    <div className="container-shell space-y-10 py-12">
      <div className="glass-card rounded-[36px] p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[var(--pink-500)]">
          Shop
        </p>
        <h1 className="mt-3 display-title text-4xl font-semibold text-[var(--navy-950)]">
          Browse
        </h1>
        <ProductsFilters
          initialQuery={params.q}
          initialSection={params.section}
          sections={sections.map((section) => ({
            id: section.id,
            slug: section.slug,
            name: section.name,
          }))}
        />
      </div>

      {result.products.length === 0 ? (
        <EmptyState
          title="No products matched your filters"
          description="Try a broader search or switch to another section to explore the catalog."
          ctaLabel="Clear filters"
          ctaHref="/products"
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {result.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
