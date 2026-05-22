'use client';

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { useCart } from "@/components/store/cart-provider";
import { LocationPicker, requestCurrentLocationValue } from "@/components/store/location-picker";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

export function CheckoutForm({
  userName,
}: {
  userName: string;
}) {
  const router = useRouter();
  const { cart, sessionId, clearCart } = useCart();
  const [location, setLocation] = useState({
    label: "",
    latitude: null as number | null,
    longitude: null as number | null,
    placeId: null as string | null,
  });
  const [pending, setPending] = useState(false);

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="glass-card rounded-[36px] p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[var(--pink-500)]">
          Delivery details
        </p>
        <h1 className="mt-3 display-title text-3xl font-semibold text-[var(--navy-950)]">
          Checkout for {userName}
        </h1>
        <p className="mt-3 text-sm leading-7 text-[var(--ink-700)]">
          Cash on delivery only. If no delivery point is selected yet, we request
          your current location before submitting the order. You can also use the
          button below to grant location access and load it in advance.
        </p>
        <div className="mt-8">
          <LocationPicker value={location} onChange={setLocation} />
        </div>
        <Button
          type="button"
          className="mt-6"
          disabled={pending || cart.items.length === 0}
          onClick={async () => {
            if (!sessionId) {
              toast.error("Your cart session is missing.");
              return;
            }

            setPending(true);
            let orderLocation = location;

            if (!orderLocation.label) {
              try {
                orderLocation = await requestCurrentLocationValue();
                setLocation(orderLocation);
              } catch (error) {
                toast.error(
                  error instanceof Error
                    ? error.message
                    : "Choose a destination location before submitting.",
                );
                setPending(false);
                return;
              }
            }

            const response = await fetch("/api/orders", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                cartSessionId: sessionId,
                destinationLocation: orderLocation.label,
                destinationLatitude: orderLocation.latitude,
                destinationLongitude: orderLocation.longitude,
                destinationPlaceId: orderLocation.placeId,
              }),
            });

            const data = (await response.json()) as {
              message?: string;
              orderNumber?: string;
            };

            if (!response.ok) {
              toast.error(data.message ?? "Checkout failed.");
              setPending(false);
              return;
            }

            toast.success(`Order ${data.orderNumber} confirmed.`);
            await clearCart();
            router.push("/account/orders");
            router.refresh();
          }}
        >
          {pending ? "Submitting order..." : "Submit order"}
        </Button>
      </section>

      <aside className="glass-card h-fit rounded-[36px] p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[var(--pink-500)]">
          Summary
        </p>
        <div className="mt-6 space-y-4">
          {cart.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
              <div>
                <p className="font-semibold text-[var(--navy-950)]">{item.product.name}</p>
                <p className="text-[var(--ink-500)]">Qty {item.quantity}</p>
              </div>
              <p className="font-semibold text-[var(--navy-950)]">
                {formatCurrency(item.totalPriceCents)}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-8 border-t border-[var(--line-soft)] pt-6">
          <div className="flex items-center justify-between text-base font-semibold text-[var(--navy-950)]">
            <span>Total</span>
            <span>{formatCurrency(cart.subtotalCents)}</span>
          </div>
          <p className="mt-3 text-sm text-[var(--ink-700)]">
            Payment method: Cash on delivery.
          </p>
        </div>
      </aside>
    </div>
  );
}
