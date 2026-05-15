import { redirect } from "next/navigation";

import { CartPageClient } from "@/components/store/cart-page";
import { getCurrentUser } from "@/lib/auth/current-user";

export default async function CartPage() {
  const user = await getCurrentUser();

  if (user?.role === "ADMIN") {
    redirect("/admin");
  }

  return <CartPageClient />;
}
