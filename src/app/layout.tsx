import type { Metadata } from "next";

import { APP_NAME, SUPPORT_EMAIL } from "@/lib/constants";
import { getCurrentUser } from "@/lib/auth/current-user";
import { AppProviders } from "@/components/providers/app-providers";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { WhatsAppFloat } from "@/components/layout/whatsapp-float";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description:
    "Premium full-stack ecommerce built for fast browsing, secure ordering, and polished admin management.",
  metadataBase: new URL("http://localhost:3000"),
  keywords: [
    "Shopiza",
    "ecommerce",
    "Next.js",
    "premium shopping",
    "admin dashboard",
  ],
  openGraph: {
    title: APP_NAME,
    description:
      "A premium ecommerce experience with polished storefront flows and secure admin operations.",
    type: "website",
  },
  alternates: {
    canonical: "/",
  },
  authors: [{ name: "Shopiza" }],
  creator: "Shopiza",
  category: "ecommerce",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  const isAdmin = user?.role === "ADMIN";

  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className="h-full antialiased"
    >
      <body className="min-h-full bg-[var(--surface-subtle)] text-[var(--ink-900)]">
        <AppProviders>
          <div className="relative flex min-h-screen flex-col">
            <SiteHeader user={user} />
            <main className="flex-1">{children}</main>
            {isAdmin ? null : <SiteFooter supportEmail={SUPPORT_EMAIL} />}
            {isAdmin ? null : <WhatsAppFloat />}
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
