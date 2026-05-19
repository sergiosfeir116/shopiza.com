import { type OrderStatus } from "@prisma/client";

import { OrdersManager } from "@/components/admin/orders-manager";
import { ButtonLink } from "@/components/ui/button";
import { getAdminOrders } from "@/lib/services/orders";

const ORDER_STATUS_VALUES = [
  "PENDING",
  "IN_PROGRESS",
  "ON_THE_WAY",
  "DELIVERED",
] as const satisfies readonly OrderStatus[];

type AdminOrdersPageProps = {
  searchParams: Promise<{
    page?: string;
    status?: string | string[];
  }>;
};

function resolveStatusFilter(
  value: string | string[] | undefined,
): OrderStatus | "ALL" | "OPEN" {
  const candidate = Array.isArray(value) ? value[0] : value;

  if (!candidate) {
    return "OPEN";
  }

  if (candidate === "all") {
    return "ALL";
  }

  return ORDER_STATUS_VALUES.includes(candidate as OrderStatus)
    ? (candidate as OrderStatus)
    : "OPEN";
}

export default async function AdminOrdersPage({
  searchParams,
}: AdminOrdersPageProps) {
  const { page, status } = await searchParams;
  const statusFilter = resolveStatusFilter(status);
  const currentPage = Math.max(1, Number(page ?? "1"));
  const { orders, totalPages } = await getAdminOrders(
    statusFilter === "ALL"
      ? { page: currentPage, pageSize: 5 }
      : statusFilter === "OPEN"
        ? { excludeStatus: "DELIVERED", page: currentPage, pageSize: 5 }
        : { status: statusFilter, page: currentPage, pageSize: 5 },
  );

  const buildPageHref = (nextPage: number) => {
    const params = new URLSearchParams();
    params.set("page", String(nextPage));
    if (statusFilter === "ALL") {
      params.set("status", "all");
    } else if (statusFilter !== "OPEN") {
      params.set("status", statusFilter);
    }
    return `/admin/orders?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[var(--pink-500)]">
          Orders
        </p>
        <h1 className="mt-2 display-title text-4xl font-semibold text-[var(--navy-950)]">
          Track and update orders
        </h1>
      </div>
      <OrdersManager orders={orders} statusFilter={statusFilter} />
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
