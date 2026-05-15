import { redirect } from "next/navigation";

import { CheckoutForm } from "@/components/store/checkout-form";
import { getCurrentUser } from "@/lib/auth/current-user";

export default async function CheckoutPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role === "ADMIN") {
    redirect("/admin");
  }

  return (
    <div className="container-shell py-12">
      <CheckoutForm userName={user.fullName} />
    </div>
  );
}
