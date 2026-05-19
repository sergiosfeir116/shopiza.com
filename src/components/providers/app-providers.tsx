'use client';

import { Toaster } from "sonner";

import { CartProvider } from "@/components/store/cart-provider";

export function AppProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      {children}
      <Toaster position="top-right" richColors />
    </CartProvider>
  );
}
