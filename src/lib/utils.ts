import { type Discount, type ProductImage } from "@prisma/client";
import { clsx, type ClassValue } from "clsx";
import { format } from "date-fns";

import { SUPPORT_WHATSAPP } from "@/lib/constants";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getNextAvailableSlug(baseSlug: string, existingSlugs: string[]) {
  if (!baseSlug) {
    throw new Error("Name must include at least one letter or number.");
  }

  const takenSlugs = new Set(existingSlugs);
  if (!takenSlugs.has(baseSlug)) {
    return baseSlug;
  }

  let suffix = 2;
  while (takenSlugs.has(`${baseSlug}-${suffix}`)) {
    suffix += 1;
  }

  return `${baseSlug}-${suffix}`;
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

export function normalizePhoneNumber(value: string) {
  const stripped = value.replace(/[^\d+]/g, "");
  const hasLeadingPlus = stripped.startsWith("+");
  const digits = stripped.replace(/[^\d]/g, "");

  return `${hasLeadingPlus ? "+" : ""}${digits}`;
}

export function formatCurrency(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function formatDateTime(date: Date | string) {
  return format(new Date(date), "MMM d, yyyy 'at' h:mm a");
}

export function parseCurrencyInput(value: string | number) {
  if (typeof value === "number") {
    return Math.round(value * 100);
  }

  const normalized = value.replace(/,/g, "").trim();
  const parsed = Number(normalized);

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error("Invalid price.");
  }

  return Math.round(parsed * 100);
}

export function centsToInputValue(cents: number) {
  return (cents / 100).toFixed(2);
}

export function generateOrderNumber() {
  const now = new Date();
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(
    2,
    "0",
  )}${String(now.getDate()).padStart(2, "0")}`;
  const suffix = Math.floor(1000 + Math.random() * 9000);

  return `SHOP-${datePart}-${suffix}`;
}

export function generateSixDigitCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function getMainImage(images: ProductImage[]) {
  return (
    images.find((image) => image.isMain) ??
    [...images].sort((left, right) => left.sortOrder - right.sortOrder)[0] ??
    null
  );
}

export function calculateDiscountedPriceCents(
  priceCents: number,
  type: "PERCENTAGE" | "FIXED_AMOUNT",
  value: number,
) {
  if (type === "PERCENTAGE") {
    return Math.max(0, Math.round(priceCents * (1 - value / 100)));
  }

  return Math.max(0, priceCents - value);
}

export function isDiscountActive(discount: Pick<Discount, "isActive" | "startAt" | "endAt">) {
  const now = new Date();

  return (
    discount.isActive &&
    new Date(discount.startAt).getTime() <= now.getTime() &&
    new Date(discount.endAt).getTime() >= now.getTime()
  );
}

export function sanitizeText(value: string) {
  return Array.from(value)
    .filter((character) => {
      const code = character.charCodeAt(0);
      return code >= 32 && code !== 127;
    })
    .join("")
    .trim();
}

export function buildGoogleMapsUrl(input: {
  locationLabel: string;
  latitude?: number | null;
  longitude?: number | null;
  placeId?: string | null;
}) {
  if (input.latitude !== null && input.latitude !== undefined &&
      input.longitude !== null && input.longitude !== undefined) {
    return `https://www.google.com/maps?q=${input.latitude},${input.longitude}`;
  }

  const query = encodeURIComponent(input.locationLabel);

  if (input.placeId) {
    return `https://www.google.com/maps/search/?api=1&query=${query}&query_place_id=${encodeURIComponent(
      input.placeId,
    )}`;
  }

  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

export function buildWhatsAppUrl(
  message = "Hello Shopiza, I need some help.",
  phoneNumber = SUPPORT_WHATSAPP,
) {
  const cleaned = phoneNumber.replace(/[^\d]/g, "");
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
