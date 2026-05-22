import { Package2, ClipboardList, Layers3, Tags } from "lucide-react";

import { APP_NAME } from "@/lib/constants";
import { getAdminDashboardSnapshot } from "@/lib/services/catalog";
import { formatCurrency, formatDateTime } from "@/lib/utils";

const icons = [Package2, Layers3, ClipboardList, Tags];

export default async function AdminOverviewPage() {
  const { counts, recentOrders } = await getAdminDashboardSnapshot();
  const entries = [
    ["Products", counts.products],
    ["Sections", counts.sections],
    ["Orders", counts.orders],
    ["Discounts", counts.discounts],
  ] as const;

  return (
    <div className="space-y-8">
      <div className="glass-card rounded-[36px] p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[var(--pink-500)]">
          Overview
        </p>
        <h1 className="mt-3 display-title text-4xl font-semibold text-[var(--navy-950)]">
          {APP_NAME} admin
        </h1>
        <p className="mt-3 text-sm leading-7 text-[var(--ink-700)]">
          Review core storefront activity, recent orders, and catalog coverage at a glance.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {entries.map(([label, value], index) => {
          const Icon = icons[index];
          return (
            <article key={label} className="glass-card rounded-[30px] p-6">
              <Icon className="h-8 w-8 text-[var(--pink-500)]" />
              <p className="mt-5 text-sm uppercase tracking-[0.3em] text-[var(--ink-500)]">
                {label}
              </p>
              <p className="mt-2 display-title text-4xl font-semibold text-[var(--navy-950)]">
                {value}
              </p>
            </article>
          );
        })}
      </div>

      <div className="glass-card rounded-[36px] p-8">
        <h2 className="display-title text-3xl font-semibold text-[var(--navy-950)]">
          Recent orders
        </h2>
        <div className="mt-6 grid gap-4">
          {recentOrders.map((order) => (
            <article key={order.id} className="rounded-[24px] border border-[var(--line-soft)] bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--pink-500)]">
                    {order.orderNumber}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-[var(--navy-950)]">
                    {order.clientName}
                  </h3>
                  <p className="mt-2 text-sm text-[var(--ink-700)]">
                    {order.destinationLocation}
                  </p>
                  <p className="mt-2 text-sm text-[var(--ink-500)]">
                    {formatDateTime(order.createdAt)}
                  </p>
                </div>
                <p className="text-xl font-semibold text-[var(--navy-950)]">
                  {formatCurrency(order.totalPriceCents)}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
