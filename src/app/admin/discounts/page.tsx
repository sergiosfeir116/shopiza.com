import { AdminLiveSearch } from "@/components/admin/admin-live-search";
import { DiscountsManager } from "@/components/admin/discounts-manager";
import { ButtonLink } from "@/components/ui/button";
import { getAdminDiscounts } from "@/lib/services/admin";

export default async function AdminDiscountsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; query?: string | string[] }>;
}) {
  const { page, query } = await searchParams;
  const currentPage = Math.max(1, Number(page ?? "1"));
  const searchQuery = Array.isArray(query) ? query[0] ?? "" : (query ?? "");
  const { discounts, totalPages } = await getAdminDiscounts({
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
    return `/admin/discounts?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[var(--pink-500)]">
          Promotions
        </p>
        <h1 className="mt-2 display-title text-4xl font-semibold text-[var(--navy-950)]">
          Manage discounts
        </h1>
      </div>

      <div className="flex flex-col gap-4 min-[600px]:flex-row min-[600px]:items-end">
        <div className="flex-1">
          <AdminLiveSearch key={searchQuery} defaultValue={searchQuery} />
        </div>
        <ButtonLink href="/admin/discounts/new">Add discount</ButtonLink>
      </div>

      <DiscountsManager discounts={discounts} />

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
