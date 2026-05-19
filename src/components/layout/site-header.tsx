import { type CurrentUser } from "@/lib/auth/current-user";
import { CartIconLink } from "@/components/store/cart-icon-link";
import { ShopizaLogo } from "@/components/brand/shopiza-logo";
import { NavLink } from "@/components/layout/nav-link";
import { ButtonLink } from "@/components/ui/button";
import { LogoutButton } from "@/components/layout/logout-button";

export function SiteHeader({ user }: { user: CurrentUser }) {
  if (user?.role === "ADMIN") {
    return (
      <header className="sticky top-0 z-40 border-b border-white/50 bg-[rgba(245,247,251,0.72)] backdrop-blur-xl">
        <div className="container-shell grid grid-cols-[auto_1fr_auto] items-center gap-6 py-4">
          <div className="flex items-center">
            <ShopizaLogo href="/admin" />
          </div>

          <nav className="hidden items-center justify-center gap-6 text-sm font-medium text-[var(--ink-700)] md:flex">
              <NavLink href="/admin" exact>
                Home
              </NavLink>
              <NavLink href="/admin/products">
                Products
              </NavLink>
              <NavLink href="/admin/sections">
                Sections
              </NavLink>
              <NavLink href="/admin/discounts">
                Discounts
              </NavLink>
              <NavLink href="/admin/orders">
                Orders
              </NavLink>
          </nav>

          <div className="flex flex-col items-center gap-2 justify-self-end md:flex-row md:items-center md:gap-3">
            <p className="order-2 hidden text-sm font-semibold text-[var(--navy-950)] md:block md:order-none md:text-right">
              {user.username}
            </p>
            <div className="order-1 md:order-none">
              <LogoutButton />
            </div>
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
            <NavLink href="/" exact>
              Home
            </NavLink>
            <NavLink href="/products">
              Shop
            </NavLink>
            <NavLink href="/contact" exact>
              Contact
            </NavLink>
            {user ? (
              <NavLink href="/account/orders">
                My orders
              </NavLink>
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
