import { redirect } from "next/navigation";

import { EmptyState } from "@/components/ui/empty-state";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getOrdersByUserId } from "@/lib/services/orders";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/button";
import { ORDER_STATUS_LABELS } from "@/lib/constants";

export default async function AccountOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  if (user.role === "ADMIN") {
    redirect("/admin");
  }

  const { page } = await searchParams;
  const currentPage = Math.max(1, Number(page ?? "1"));
  const { orders, totalPages } = await getOrdersByUserId({
    userId: user.id,
    page: currentPage,
    pageSize: 6,
  });

  return (
    <div className="container-shell space-y-8 py-12">
      <div className="glass-card rounded-[36px] p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[var(--pink-500)]">
          Account
        </p>
        <h1 className="mt-3 display-title text-4xl font-semibold text-[var(--navy-950)]">
          Your orders
        </h1>
        <p className="mt-3 text-sm leading-7 text-[var(--ink-700)]">
          Orders are shown from most recent to oldest, with live status tracking.
        </p>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          title="No orders yet"
          description="Add products to your cart and complete checkout to see your order history here."
          ctaLabel="Browse products"
          ctaHref="/products"
        />
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <article key={order.id} className="glass-card rounded-[32px] p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--pink-500)]">
                    {order.orderNumber}
                  </p>
                  <h2 className="mt-2 display-title text-2xl font-semibold text-[var(--navy-950)]">
                    {ORDER_STATUS_LABELS[order.status]}
                  </h2>
                  <p className="mt-2 text-sm text-[var(--ink-700)]">
                    {formatDateTime(order.createdAt)} • {order.destinationLocation}
                  </p>
                </div>
                <p className="text-xl font-semibold text-[var(--navy-950)]">
                  {formatCurrency(order.totalPriceCents)}
                </p>
              </div>
              <div className="mt-5 grid gap-2 text-sm text-[var(--ink-700)]">
                {order.items.map((item) => (
                  <p key={item.id}>
                    {item.productNameSnapshot} x{item.quantity}
                  </p>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <ButtonLink
          href={`/account/orders?page=${Math.max(1, currentPage - 1)}`}
          variant="secondary"
          className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
        >
          Previous
        </ButtonLink>
        <p className="text-sm text-[var(--ink-700)]">
          Page {currentPage} of {totalPages}
        </p>
        <ButtonLink
          href={`/account/orders?page=${Math.min(totalPages, currentPage + 1)}`}
          variant="secondary"
          className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
        >
          Next
        </ButtonLink>
      </div>
    </div>
  );
}
