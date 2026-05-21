import Link from "next/link";

import { ShopizaLogo } from "@/components/brand/shopiza-logo";

export function SiteFooter({ supportEmail }: { supportEmail: string }) {
  return (
    <footer className="mt-16 border-t border-[rgba(19,24,47,0.08)] bg-white/70">
      <div className="container-shell grid gap-10 py-14 md:grid-cols-[1.5fr_1fr_1fr]">
        <div className="space-y-4">
          <ShopizaLogo />
        </div>
        <div>
          <h3 className="display-title text-lg font-semibold text-[var(--navy-950)]">
            Explore
          </h3>
          <div className="mt-4 flex flex-col gap-3 text-sm text-[var(--ink-700)]">
            <Link href="/products">All products</Link>
            <Link href="/account/orders">My orders</Link>
          </div>
        </div>
        <div>
          <h3 className="display-title text-lg font-semibold text-[var(--navy-950)]">
            Support
          </h3>
          <div className="mt-4 flex flex-col gap-3 text-sm text-[var(--ink-700)]">
            <a href={`mailto:${supportEmail}`}>{supportEmail}</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
