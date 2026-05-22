import { AdminLiveSearch } from "@/components/admin/admin-live-search";
import { SectionsManager } from "@/components/admin/sections-manager";
import { ButtonLink } from "@/components/ui/button";
import { getAdminSections } from "@/lib/services/admin";

export default async function AdminSectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; query?: string | string[] }>;
}) {
  const { page, query } = await searchParams;
  const currentPage = Math.max(1, Number(page ?? "1"));
  const searchQuery = Array.isArray(query) ? query[0] ?? "" : (query ?? "");
  const { sections, totalPages } = await getAdminSections({
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
    return `/admin/sections?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[var(--pink-500)]">
          Catalog
        </p>
        <h1 className="mt-2 display-title text-4xl font-semibold text-[var(--navy-950)]">
          Manage sections
        </h1>
      </div>

      <div className="flex flex-col gap-4 min-[600px]:flex-row min-[600px]:items-end">
        <div className="flex-1">
          <AdminLiveSearch key={searchQuery} defaultValue={searchQuery} />
        </div>
        <ButtonLink href="/admin/sections/new">Add section</ButtonLink>
      </div>

      <SectionsManager sections={sections} />

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
