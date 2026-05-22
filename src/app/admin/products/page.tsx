import { AdminLiveSearch } from "@/components/admin/admin-live-search";
import { ButtonLink } from "@/components/ui/button";
import { ProductListManager } from "@/components/admin/product-list-manager";
import { getAdminProducts } from "@/lib/services/catalog";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; query?: string | string[] }>;
}) {
  const { page, query } = await searchParams;
  const currentPage = Math.max(1, Number(page ?? "1"));
  const searchQuery = Array.isArray(query) ? query[0] ?? "" : (query ?? "");
  const { products, totalPages } = await getAdminProducts({
    page: currentPage,
    pageSize: 5,
    query: searchQuery || undefined,
  });

  const buildPageHref = (nextPage: number) => {
    const params = new URLSearchParams();
    params.set("page", String(nextPage));
    if (searchQuery) {
      params.set("query", searchQuery);
    }
    return `/admin/products?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[var(--pink-500)]">
          Catalog
        </p>
        <h1 className="mt-2 display-title text-4xl font-semibold text-[var(--navy-950)]">
          Manage products
        </h1>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex-1">
          <AdminLiveSearch key={searchQuery} defaultValue={searchQuery} />
        </div>
        <ButtonLink href="/admin/products/new">Add product</ButtonLink>
      </div>

      <ProductListManager
        products={products.map((product) => ({
          id: product.id,
          name: product.name,
          slug: product.slug,
          stock: product.stock,
          priceCents: product.priceCents,
          archived: product.archived,
          mainImage: product.mainImage
            ? {
                imageUrl: product.mainImage.imageUrl,
                altText: product.mainImage.altText,
              }
            : null,
          section: product.section
            ? {
                name: product.section.name,
              }
            : null,
        }))}
      />

      <div className="flex items-center justify-between">
        <ButtonLink
          href={buildPageHref(Math.max(1, currentPage - 1))}
          variant="secondary"
          className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
        >
          Previous
        </ButtonLink>
        <p className="text-sm text-[var(--ink-700)]">
          Page {currentPage} of {totalPages}
        </p>
        <ButtonLink
          href={buildPageHref(Math.min(totalPages, currentPage + 1))}
          variant="secondary"
          className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
        >
          Next
        </ButtonLink>
      </div>
    </div>
  );
}
