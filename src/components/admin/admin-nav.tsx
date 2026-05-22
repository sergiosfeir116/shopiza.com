'use client';

import Link from "next/link";
import { ClipboardList, Layers3, LayoutGrid, Package2, Tags } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const ADMIN_ORDERS_SEEN_AT_KEY = "shopizaj_admin_orders_seen_at";
const POLL_INTERVAL_MS = 30_000;

const items = [
  { href: "/admin", label: "Home", icon: LayoutGrid },
  { href: "/admin/products", label: "Products", icon: Package2 },
  { href: "/admin/sections", label: "Sections", icon: Layers3 },
  { href: "/admin/discounts", label: "Discounts", icon: Tags },
  { href: "/admin/orders", label: "Orders", icon: ClipboardList },
] as const;

function isOrdersPath(pathname: string) {
  return pathname === "/admin/orders" || pathname.startsWith("/admin/orders/");
}

function readSeenAt() {
  return window.localStorage.getItem(ADMIN_ORDERS_SEEN_AT_KEY);
}

function writeSeenAt(value: string) {
  window.localStorage.setItem(ADMIN_ORDERS_SEEN_AT_KEY, value);
}

export function AdminNav() {
  const pathname = usePathname();
  const [unseenCount, setUnseenCount] = useState(0);

  useEffect(() => {
    if (isOrdersPath(pathname)) {
      writeSeenAt(new Date().toISOString());
      return;
    }

    const seenAt = readSeenAt();
    if (!seenAt) {
      writeSeenAt(new Date().toISOString());
      return;
    }

    let cancelled = false;

    const refreshCount = async () => {
      try {
        const response = await fetch(
          `/api/admin/orders/unseen-count?since=${encodeURIComponent(readSeenAt() ?? seenAt)}`,
          { cache: "no-store" },
        );

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as { count?: number };
        if (!cancelled) {
          setUnseenCount(data.count ?? 0);
        }
      } catch {
        if (!cancelled) {
          setUnseenCount(0);
        }
      }
    };

    void refreshCount();

    const intervalId = window.setInterval(() => {
      void refreshCount();
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [pathname]);

  return (
    <nav className="grid w-full max-w-[220px] justify-items-center gap-2">
      {items.map((item) => {
        const isActive =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        const showOrdersBadge =
          item.href === "/admin/orders" &&
          !isOrdersPath(pathname) &&
          unseenCount > 0;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative inline-flex w-full items-center justify-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition",
              isActive
                ? "bg-[rgba(244,71,161,0.08)] text-[var(--pink-500)]"
                : "text-[var(--ink-700)] hover:bg-[rgba(244,71,161,0.08)] hover:text-[var(--pink-500)]",
            )}
          >
            <item.icon className="h-4 w-4" />
            <span className="relative">
              {item.label}
              {showOrdersBadge ? (
                <span className="absolute -right-4 -top-3 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[var(--pink-500)] px-1 text-[10px] font-semibold leading-none text-white">
                  {unseenCount}
                </span>
              ) : null}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
