import "server-only";

import { type PaymentMethod } from "@prisma/client";

import { APP_NAME, SUPPORT_WHATSAPP } from "@/lib/constants";
import { type OrderEmailPayload } from "@/lib/email";
import { buildGoogleMapsUrl, buildWhatsAppUrl, formatCurrency } from "@/lib/utils";

type WhatsAppInput = {
  phoneNumber: string;
  message: string;
};

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH_ON_DELIVERY: "Cash on Delivery",
};

export async function sendWhatsAppMessage(input: WhatsAppInput) {
  const url = buildWhatsAppUrl(input.message, input.phoneNumber);

  console.info(
    `[whatsapp:dev] to=${input.phoneNumber}\nurl=${url}\n${input.message}`,
  );

  return { url };
}

export async function sendAdminOrderNotificationWhatsApp(
  order: OrderEmailPayload,
) {
  const mapsUrl = buildGoogleMapsUrl({
    locationLabel: order.destinationLocation,
    latitude: order.destinationLatitude,
    longitude: order.destinationLongitude,
    placeId: order.destinationPlaceId,
  });

  const message = [
    `New ${APP_NAME} order ${order.orderNumber}`,
    `Customer: ${order.customerName}`,
    `Email: ${order.customerEmail}`,
    `Phone: ${order.customerPhoneNumber}`,
    `Delivery address: ${order.destinationLocation}`,
    `Google Maps: ${mapsUrl}`,
    `Payment method: ${PAYMENT_METHOD_LABELS[order.paymentMethod]}`,
    `Total: ${formatCurrency(order.totalPriceCents)}`,
    "",
    "Ordered products:",
    ...order.items.map(
      (item) =>
        `- ${item.productName} x${item.quantity} | ${formatCurrency(
          item.unitPriceCents,
        )} each | ${formatCurrency(item.totalPriceCents)}`,
    ),
  ].join("\n");

  await sendWhatsAppMessage({
    phoneNumber: SUPPORT_WHATSAPP,
    message,
  });
}
