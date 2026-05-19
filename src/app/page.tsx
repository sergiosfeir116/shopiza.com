import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles, Truck } from "lucide-react";

import { ProductCard } from "@/components/store/product-card";
import { ButtonLink } from "@/components/ui/button";
import { getHomepageData } from "@/lib/services/catalog";

const trustPillars = [
  {
    icon: ShieldCheck,
    title: "Easy ordering",
    description: "Pick what you love and place your order without extra steps.",
  },
  {
    icon: Truck,
    title: "Simple delivery",
    description: "Choose your items and complete your order with a smooth delivery flow.",
  },
  {
    icon: Sparkles,
    title: "Thoughtful picks",
    description: "Explore a handpicked mix of tech, lifestyle, and everyday favorites.",
  },
];

export default async function HomePage() {
  const { sections, featuredProducts, discountedProducts } =
    await getHomepageData();

  return (
    <div className="space-y-20 pb-20">
      <section className="container-shell grid gap-8 py-14 lg:grid-cols-[1.2fr_0.8fr] lg:py-20">
        <div className="mesh-accent spotlight-border relative flex items-center justify-center overflow-hidden rounded-[40px] p-8 text-white shadow-[0_30px_70px_rgba(18,24,60,0.18)] md:p-12">
          <div className="relative mx-auto flex max-w-2xl flex-col items-center space-y-6 text-center">
            <h1 className="display-title text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
              Shop everyday essentials with a faster, cleaner, more trustworthy flow.
            </h1>
            <p className="max-w-xl text-base leading-8 text-white/78 sm:text-lg">
              Discover tech, lifestyle, and everyday finds through a storefront
              designed around clarity, comfort, and easy browsing.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <ButtonLink href="/products">Browse products</ButtonLink>
            </div>
          </div>
        </div>
        <div className="grid gap-4">
          {trustPillars.map((pillar) => (
            <article
              key={pillar.title}
              className="glass-card rounded-[32px] p-6 md:p-8"
            >
              <pillar.icon className="h-9 w-9 text-[var(--pink-500)]" />
              <h2 className="mt-5 display-title text-2xl font-semibold text-[var(--navy-950)]">
                {pillar.title}
              </h2>
              <p className="mt-3 text-sm leading-7 text-[var(--ink-700)]">
                {pillar.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="container-shell">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[var(--pink-500)]">
              Featured sections
            </p>
            <h2 className="mt-2 display-title text-3xl font-semibold text-[var(--navy-950)]">
              Explore by section
            </h2>
          </div>
          <ButtonLink
            href="/products"
            variant="secondary"
            className="hidden shadow-[0_14px_30px_rgba(18,26,56,0.08)] md:inline-flex"
          >
            View all
            <ArrowRight className="ml-2 h-4 w-4" />
          </ButtonLink>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {sections.map((section, index) => (
            <Link
              key={section.id}
              href={`/products?section=${section.slug}`}
              className="group glass-card rounded-[30px] p-6 hover:-translate-y-1"
            >
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(244,71,161,0.1)] text-lg font-semibold text-[var(--pink-500)]">
                0{index + 1}
              </span>
              <h3 className="mt-5 display-title text-2xl font-semibold text-[var(--navy-950)]">
                {section.name}
              </h3>
              <p className="mt-3 text-sm leading-7 text-[var(--ink-700)]">
                {section.description}
              </p>
              <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--navy-950)] group-hover:text-[var(--pink-500)]">
                Shop section
                <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="container-shell">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[var(--pink-500)]">
              Fresh picks
            </p>
            <h2 className="mt-2 display-title text-3xl font-semibold text-[var(--navy-950)]">
              New arrivals
            </h2>
          </div>
          <ButtonLink
            href="/products"
            variant="secondary"
            className="hidden shadow-[0_14px_30px_rgba(18,26,56,0.08)] md:inline-flex"
          >
            View all
            <ArrowRight className="ml-2 h-4 w-4" />
          </ButtonLink>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="container-shell">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[var(--danger-500)]">
              Limited-time drops
            </p>
            <h2 className="mt-2 display-title text-3xl font-semibold text-[var(--navy-950)]">
              Discounted right now
            </h2>
          </div>
          <ButtonLink
            href="/products"
            variant="secondary"
            className="hidden shadow-[0_14px_30px_rgba(18,26,56,0.08)] md:inline-flex"
          >
            View all
            <ArrowRight className="ml-2 h-4 w-4" />
          </ButtonLink>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {discountedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
