import { type CurrentUser } from "@/lib/auth/current-user";
import { CartIconLink } from "@/components/store/cart-icon-link";
import { ShopizajLogo } from "@/components/brand/shopizaj-logo";
import { MobileHeaderMenu } from "@/components/layout/mobile-header-menu";
import { NavLink } from "@/components/layout/nav-link";
import { ButtonLink } from "@/components/ui/button";
import { LogoutButton } from "@/components/layout/logout-button";

const adminNavItems = [
  { href: "/admin", label: "Home", exact: true },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/sections", label: "Sections" },
  { href: "/admin/discounts", label: "Discounts" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/clients", label: "Clients" },
] as const;

const clientNavItems = [
  { href: "/", label: "Home", exact: true },
  { href: "/products", label: "Shop" },
] as const;

export function SiteHeader({ user }: { user: CurrentUser }) {
  if (user?.role === "ADMIN") {
    return (
      <header className="sticky top-0 z-40 border-b border-white/50 bg-[rgba(245,247,251,0.72)] backdrop-blur-xl">
        <div className="container-shell grid grid-cols-[auto_1fr_auto] items-center gap-6 py-4">
          <div className="flex items-center">
            <ShopizajLogo href="/admin" />
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
              <NavLink href="/admin/clients">
                Clients
              </NavLink>
          </nav>

          <div className="flex items-center gap-3 justify-self-end">
            <MobileHeaderMenu
              homeHref="/admin"
              items={[...adminNavItems]}
              user={{ username: user.username }}
            />
            <p className="order-2 hidden text-sm font-semibold text-[var(--navy-950)] md:block md:order-none md:text-right">
              {user.username}
            </p>
            <div className="hidden md:block">
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
          <ShopizajLogo />
          <nav className="hidden items-center gap-6 text-sm font-medium text-[var(--ink-700)] md:flex">
            <NavLink href="/" exact>
              Home
            </NavLink>
            <NavLink href="/products">
              Shop
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
          <MobileHeaderMenu
            homeHref="/"
            items={user ? [...clientNavItems, { href: "/account/orders", label: "My orders" }] : [...clientNavItems]}
            user={user ? { username: user.username } : null}
          />
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
