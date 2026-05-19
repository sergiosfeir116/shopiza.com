export const APP_NAME = "Shopiza";
export const SUPPORT_EMAIL =
  process.env.SHOPIZA_SUPPORT_EMAIL ?? "charbel.g.andraos@gmail.com";
export const SUPPORT_WHATSAPP =
  process.env.SHOPIZA_SUPPORT_WHATSAPP ?? "+96170300747";
export const AUTH_COOKIE_NAME = "shopiza_session";
export const VERIFICATION_CODE_TTL_MINUTES = 15;
export const PENDING_REGISTRATION_TTL_MINUTES = 24 * 60;
export const PASSWORD_RESET_TTL_MINUTES = 15;
export const MAX_PRODUCT_IMAGE_BYTES = 4 * 1024 * 1024;
export const ALLOWED_PRODUCT_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const ORDER_STATUS_LABELS = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  ON_THE_WAY: "On The Way",
  DELIVERED: "Delivered",
} as const;

export const PASSWORD_RESET_CHANNEL_LABELS = {
  EMAIL: "Email",
  SMS: "SMS",
} as const;

export const FEATURED_SECTION_LIMIT = 4;
export const FEATURED_PRODUCT_LIMIT = 8;
