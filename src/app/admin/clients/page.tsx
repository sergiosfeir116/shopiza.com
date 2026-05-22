import { ClientsManager } from "@/components/admin/clients-manager";
import { ButtonLink } from "@/components/ui/button";
import { getAdminClients } from "@/lib/services/admin";

export default async function AdminClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const currentPage = Math.max(1, Number(page ?? "1"));
  const { clients, totalPages } = await getAdminClients({
    page: currentPage,
    pageSize: 10,
  });

  const buildPageHref = (nextPage: number) => `/admin/clients?page=${nextPage}`;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[var(--pink-500)]">
          Clients
        </p>
        <h1 className="mt-2 display-title text-4xl font-semibold text-[var(--navy-950)]">
          Registered clients
        </h1>
        <p className="mt-3 text-sm leading-7 text-[var(--ink-700)]">
          View all client accounts ordered by most recent registration first.
        </p>
      </div>

      <ClientsManager clients={clients} />

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
