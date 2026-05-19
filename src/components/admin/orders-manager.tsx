'use client';

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { cn, formatCurrency, formatDateTime } from "@/lib/utils";

type OrderItem = {
  id: string;
  orderNumber: string;
  clientName: string;
  clientEmail: string;
  destinationLocation: string;
  totalPriceCents: number;
  status: keyof typeof ORDER_STATUS_LABELS;
  createdAt: Date;
  items: Array<{
    id: string;
    productNameSnapshot: string;
    quantity: number;
  }>;
};

const FILTER_OPTIONS = [
  { value: "OPEN", label: "Not Delivered" },
  { value: "ALL", label: "All" },
  ...Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => ({
    value,
    label,
  })),
] as const;

export function OrdersManager({
  orders,
  statusFilter,
}: {
  orders: OrderItem[];
  statusFilter: keyof typeof ORDER_STATUS_LABELS | "ALL" | "OPEN";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const buildFilterHref = (value: (typeof FILTER_OPTIONS)[number]["value"]) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value === "OPEN") {
      params.delete("status");
    } else if (value === "ALL") {
      params.set("status", "all");
    } else {
      params.set("status", value);
    }

    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((option) => {
          const isActive = option.value === statusFilter;

          return (
            <Link
              key={option.value}
              href={buildFilterHref(option.value)}
              className={cn(
                "inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5",
                isActive
                  ? "border-transparent bg-[var(--navy-950)] text-white"
                  : "border-[var(--line-soft)] bg-white text-[var(--navy-950)] hover:border-[rgba(244,71,161,0.35)] hover:text-[var(--pink-500)]",
              )}
            >
              {option.label}
            </Link>
          );
        })}
      </div>

      {orders.length === 0 ? (
        <div className="glass-card rounded-[32px] p-10 text-center">
          <h2 className="display-title text-2xl font-semibold text-[var(--navy-950)]">
            No orders found
          </h2>
          <p className="mt-3 text-sm leading-7 text-[var(--ink-700)]">
            No orders match the current status filter.
          </p>
        </div>
      ) : null}

      <div className="grid gap-4">
        {orders.map((order) => (
          <article key={order.id} className="glass-card rounded-[32px] p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--pink-500)]">
                  {order.orderNumber}
                </p>
                <h2 className="mt-2 display-title text-2xl font-semibold text-[var(--navy-950)]">
                  {order.clientName}
                </h2>
                <p className="mt-2 text-sm text-[var(--ink-700)]">
                  {order.clientEmail} | {order.destinationLocation}
                </p>
                <p className="mt-2 text-sm text-[var(--ink-500)]">
                  {formatDateTime(order.createdAt)}
                </p>
              </div>
              <div className="space-y-3">
                <p className="text-right text-xl font-semibold text-[var(--navy-950)]">
                  {formatCurrency(order.totalPriceCents)}
                </p>
                <select
                  defaultValue={order.status}
                  onChange={async (event) => {
                    const response = await fetch(`/api/admin/orders/${order.id}`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ status: event.target.value }),
                    });
                    const data = (await response.json()) as { message?: string };
                    if (!response.ok) {
                      toast.error(data.message ?? "Could not update the order.");
                      return;
                    }
                    toast.success("Order status updated.");
                    router.refresh();
                  }}
                  className="rounded-full border border-[var(--line-soft)] bg-white px-4 py-2 text-sm font-semibold text-[var(--navy-950)]"
                >
                  {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
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
    </div>
  );
}
