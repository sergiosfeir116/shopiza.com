'use client';

import { Toaster } from "sonner";

import { CartProvider } from "@/components/store/cart-provider";

export function AppProviders({
  children,
  enableCart = true,
}: {
  children: React.ReactNode;
  enableCart?: boolean;
}) {
  const content = (
    <>
      {children}
      <Toaster position="top-right" richColors />
    </>
  );

  if (!enableCart) {
    return content;
  }

  return <CartProvider>{content}</CartProvider>;
}
