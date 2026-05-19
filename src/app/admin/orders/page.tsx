import { type OrderStatus } from "@prisma/client";

import { OrdersManager } from "@/components/admin/orders-manager";
import { getAdminOrders } from "@/lib/services/orders";

const ORDER_STATUS_VALUES = [
  "PENDING",
  "IN_PROGRESS",
  "ON_THE_WAY",
  "DELIVERED",
] as const satisfies readonly OrderStatus[];

type AdminOrdersPageProps = {
  searchParams: Promise<{
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
  const { status } = await searchParams;
  const statusFilter = resolveStatusFilter(status);
  const orders = await getAdminOrders(
    statusFilter === "ALL"
      ? undefined
      : statusFilter === "OPEN"
        ? { excludeStatus: "DELIVERED" }
        : { status: statusFilter },
  );

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
    </div>
  );
}
