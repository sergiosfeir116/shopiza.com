import Link from "next/link";

import { type CurrentUser } from "@/lib/auth/current-user";
import { CartIconLink } from "@/components/store/cart-icon-link";
import { ShopizaLogo } from "@/components/brand/shopiza-logo";
import { ButtonLink } from "@/components/ui/button";
import { LogoutButton } from "@/components/layout/logout-button";

export function SiteHeader({ user }: { user: CurrentUser }) {
  if (user?.role === "ADMIN") {
    return (
      <header className="sticky top-0 z-40 border-b border-white/50 bg-[rgba(245,247,251,0.72)] backdrop-blur-xl">
        <div className="container-shell flex items-center justify-between gap-6 py-4">
          <div className="flex items-center gap-8">
            <ShopizaLogo href="/admin" />
            <nav className="hidden items-center gap-6 text-sm font-medium text-[var(--ink-700)] md:flex">
              <Link href="/admin" className="hover:text-[var(--pink-500)]">
                Admin dashboard
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right md:block">
              <p className="text-sm font-semibold text-[var(--navy-950)]">
                {user.fullName}
              </p>
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--ink-500)]">
                {user.role}
              </p>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/50 bg-[rgba(245,247,251,0.72)] backdrop-blur-xl">
      <div className="container-shell flex items-center justify-between gap-6 py-4">
        <div className="flex items-center gap-8">
          <ShopizaLogo />
          <nav className="hidden items-center gap-6 text-sm font-medium text-[var(--ink-700)] md:flex">
            <Link href="/" className="hover:text-[var(--pink-500)]">
              Home
            </Link>
            <Link href="/products" className="hover:text-[var(--pink-500)]">
              Shop
            </Link>
            <Link href="/contact" className="hover:text-[var(--pink-500)]">
              Contact
            </Link>
            {user ? (
              <Link href="/account/orders" className="hover:text-[var(--pink-500)]">
                My orders
              </Link>
            ) : null}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <CartIconLink />
          {user ? (
            <div className="hidden items-center gap-3 md:flex">
              <div className="text-right">
                <p className="text-sm font-semibold text-[var(--navy-950)]">
                  {user.fullName}
                </p>
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--ink-500)]">
                  {user.role}
                </p>
              </div>
              <LogoutButton />
            </div>
          ) : (
            <div className="hidden items-center gap-3 md:flex">
              <ButtonLink href="/login" variant="secondary">
                Login
              </ButtonLink>
              <ButtonLink href="/register">Create account</ButtonLink>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
