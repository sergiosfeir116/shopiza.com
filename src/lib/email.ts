import "server-only";

import { type OrderStatus, type PaymentMethod } from "@prisma/client";

import { APP_NAME, ORDER_STATUS_LABELS } from "@/lib/constants";
import { sendMail } from "@/lib/services/mail";
import { buildGoogleMapsUrl, formatCurrency } from "@/lib/utils";

type EmailOrderItem = {
  productName: string;
  quantity: number;
  unitPriceCents: number;
  totalPriceCents: number;
};

export type OrderEmailPayload = {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhoneNumber: string;
  destinationLocation: string;
  destinationLatitude: number | null;
  destinationLongitude: number | null;
  destinationPlaceId: string | null;
  totalPriceCents: number;
  paymentMethod: PaymentMethod;
  items: EmailOrderItem[];
};

type OrderStatusUpdateEmailPayload = {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  status: OrderStatus;
};

type EmailSectionRow = {
  label: string;
  value: string;
};

const BRAND = {
  background: "#f4f7fb",
  surface: "#ffffff",
  line: "#d9e2ef",
  text: "#526174",
  heading: "#13182f",
  accent: "#f447a1",
  muted: "#7d8a9b",
  success: "#0f766e",
  info: "#1d4ed8",
} as const;

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH_ON_DELIVERY: "Cash on Delivery",
};

const ORDER_STATUS_MESSAGES: Record<OrderStatus, string> = {
  PENDING: "We received your order and our team will contact you soon to confirm the next steps.",
  IN_PROGRESS: "Your order is now being prepared and we are getting it ready for dispatch.",
  ON_THE_WAY: "Your order is on the way and should reach you soon.",
  DELIVERED: "Your order has been delivered. Thank you for shopping with us.",
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getPaymentMethodLabel(paymentMethod: PaymentMethod) {
  return PAYMENT_METHOD_LABELS[paymentMethod];
}

function renderSummaryRows(rows: EmailSectionRow[]) {
  return rows
    .map(
      (row) => `
        <tr>
          <td style="padding: 10px 0; color: ${BRAND.muted}; font-size: 13px; border-bottom: 1px solid ${BRAND.line}; width: 36%;">
            ${escapeHtml(row.label)}
          </td>
          <td style="padding: 10px 0; color: ${BRAND.heading}; font-size: 14px; font-weight: 600; border-bottom: 1px solid ${BRAND.line};">
            ${escapeHtml(row.value)}
          </td>
        </tr>
      `,
    )
    .join("");
}

function renderOrderItemsTable(items: EmailOrderItem[]) {
  const rows = items
    .map(
      (item) => `
        <tr>
          <td style="padding: 14px 16px; border-bottom: 1px solid ${BRAND.line}; color: ${BRAND.heading}; font-size: 14px; font-weight: 600;">
            ${escapeHtml(item.productName)}
          </td>
          <td style="padding: 14px 16px; border-bottom: 1px solid ${BRAND.line}; color: ${BRAND.text}; font-size: 14px; text-align: center;">
            ${item.quantity}
          </td>
          <td style="padding: 14px 16px; border-bottom: 1px solid ${BRAND.line}; color: ${BRAND.text}; font-size: 14px; text-align: right;">
            ${escapeHtml(formatCurrency(item.unitPriceCents))}
          </td>
          <td style="padding: 14px 16px; border-bottom: 1px solid ${BRAND.line}; color: ${BRAND.heading}; font-size: 14px; font-weight: 600; text-align: right;">
            ${escapeHtml(formatCurrency(item.totalPriceCents))}
          </td>
        </tr>
      `,
    )
    .join("");

  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid ${BRAND.line}; border-radius: 20px; overflow: hidden; border-collapse: separate; border-spacing: 0; background: ${BRAND.surface};">
      <thead>
        <tr style="background: #f9fbfe;">
          <th align="left" style="padding: 14px 16px; color: ${BRAND.muted}; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;">Product</th>
          <th align="center" style="padding: 14px 16px; color: ${BRAND.muted}; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;">Qty</th>
          <th align="right" style="padding: 14px 16px; color: ${BRAND.muted}; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;">Unit Price</th>
          <th align="right" style="padding: 14px 16px; color: ${BRAND.muted}; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;">Line Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function renderEmailLayout(input: {
  eyebrow: string;
  title: string;
  intro: string;
  summaryRows: EmailSectionRow[];
  content: string;
}) {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <body style="margin: 0; padding: 32px 16px; background: ${BRAND.background}; font-family: Arial, Helvetica, sans-serif; color: ${BRAND.text};">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 680px; margin: 0 auto; background: ${BRAND.surface}; border: 1px solid ${BRAND.line}; border-radius: 28px; overflow: hidden;">
          <tr>
            <td style="padding: 32px; background: linear-gradient(135deg, #13182f 0%, #27345c 100%);">
              <p style="margin: 0 0 12px; color: rgba(255,255,255,0.72); font-size: 12px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase;">
                ${escapeHtml(input.eyebrow)}
              </p>
              <h1 style="margin: 0 0 12px; color: #ffffff; font-size: 28px; line-height: 1.25;">
                ${escapeHtml(input.title)}
              </h1>
              <p style="margin: 0; color: rgba(255,255,255,0.84); font-size: 15px; line-height: 1.7;">
                ${escapeHtml(input.intro)}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 28px;">
                ${renderSummaryRows(input.summaryRows)}
              </table>
              ${input.content}
            </td>
          </tr>
          <tr>
            <td style="padding: 0 32px 32px;">
              <div style="border-top: 1px solid ${BRAND.line}; padding-top: 20px; color: ${BRAND.muted}; font-size: 12px; line-height: 1.7;">
                ${escapeHtml(APP_NAME)} transactional email
              </div>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

function buildOrderItemsText(items: EmailOrderItem[]) {
  return items.map(
    (item) =>
      `- ${item.productName} x${item.quantity} | ${formatCurrency(
        item.unitPriceCents,
      )} each | ${formatCurrency(item.totalPriceCents)}`,
  );
}

function buildSummaryText(rows: EmailSectionRow[]) {
  return rows.map((row) => `${row.label}: ${row.value}`);
}

export async function sendOrderConfirmationEmail(order: OrderEmailPayload) {
  const mapsUrl = buildGoogleMapsUrl({
    locationLabel: order.destinationLocation,
    latitude: order.destinationLatitude,
    longitude: order.destinationLongitude,
    placeId: order.destinationPlaceId,
  });
  const summaryRows: EmailSectionRow[] = [
    { label: "Customer", value: order.customerName },
    { label: "Order ID", value: order.orderNumber },
    { label: "Delivery location", value: order.destinationLocation },
    { label: "Payment method", value: getPaymentMethodLabel(order.paymentMethod) },
    { label: "Total", value: formatCurrency(order.totalPriceCents) },
  ];

  const html = renderEmailLayout({
    eyebrow: "Order confirmation",
    title: `Thanks, ${order.customerName}. We received your order.`,
    intro: "Your order has been recorded successfully. Our store will contact you soon to confirm the delivery details.",
    summaryRows,
    content: `
      <div style="margin-bottom: 22px;">
        <p style="margin: 0 0 14px; color: ${BRAND.heading}; font-size: 16px; font-weight: 700;">
          Ordered products
        </p>
        ${renderOrderItemsTable(order.items)}
      </div>
      <div style="margin-bottom: 22px; padding: 18px 20px; border: 1px solid ${BRAND.line}; border-radius: 20px; background: #f9fbfe;">
        <p style="margin: 0 0 8px; color: ${BRAND.heading}; font-size: 15px; font-weight: 700;">
          Delivery location
        </p>
        <p style="margin: 0 0 12px; color: ${BRAND.text}; font-size: 14px; line-height: 1.7;">
          ${escapeHtml(order.destinationLocation)}
        </p>
        <a href="${escapeHtml(mapsUrl)}" style="color: ${BRAND.accent}; font-size: 14px; font-weight: 700; text-decoration: none;">
          Open in Google Maps
        </a>
      </div>
      <div style="padding: 18px 20px; border-radius: 20px; background: rgba(244, 71, 161, 0.07); color: ${BRAND.heading}; font-size: 14px; line-height: 1.7;">
        We appreciate your order and will reach out soon to arrange your cash on delivery handoff.
      </div>
    `,
  });

  const text = [
    `${APP_NAME} order confirmation`,
    `Hi ${order.customerName},`,
    "We received your order successfully. Our store will contact you soon.",
    "",
    ...buildSummaryText(summaryRows),
    `Google Maps: ${mapsUrl}`,
    "",
    "Ordered products:",
    ...buildOrderItemsText(order.items),
  ].join("\n");

  await sendMail({
    to: order.customerEmail,
    subject: `${APP_NAME} order confirmation ${order.orderNumber}`,
    html,
    text,
  });
}

export async function sendOrderStatusUpdateEmail(
  input: OrderStatusUpdateEmailPayload,
) {
  const statusLabel = ORDER_STATUS_LABELS[input.status];
  const statusMessage = ORDER_STATUS_MESSAGES[input.status];
  const summaryRows: EmailSectionRow[] = [
    { label: "Customer", value: input.customerName },
    { label: "Order ID", value: input.orderNumber },
    { label: "New status", value: statusLabel },
  ];

  const html = renderEmailLayout({
    eyebrow: "Order status update",
    title: `Your order ${input.orderNumber} is now ${statusLabel}.`,
    intro: "We wanted to keep you updated on the latest progress of your order.",
    summaryRows,
    content: `
      <div style="padding: 22px; border: 1px solid ${BRAND.line}; border-radius: 22px; background: rgba(29, 78, 216, 0.05);">
        <p style="margin: 0 0 10px; color: ${BRAND.info}; font-size: 12px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase;">
          Current status
        </p>
        <p style="margin: 0 0 12px; color: ${BRAND.heading}; font-size: 22px; font-weight: 700;">
          ${escapeHtml(statusLabel)}
        </p>
        <p style="margin: 0; color: ${BRAND.text}; font-size: 14px; line-height: 1.7;">
          ${escapeHtml(statusMessage)}
        </p>
      </div>
    `,
  });

  const text = [
    `${APP_NAME} order status update`,
    `Hi ${input.customerName},`,
    `Your order ${input.orderNumber} is now ${statusLabel}.`,
    statusMessage,
  ].join("\n");

  await sendMail({
    to: input.customerEmail,
    subject: `${APP_NAME} order ${input.orderNumber} is now ${statusLabel}`,
    html,
    text,
  });
}
