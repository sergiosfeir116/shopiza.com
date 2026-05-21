const isProduction = process.env.NODE_ENV === "production";
const defaultNotificationMode = process.env.TEST_NOTIFICATION_MODE ?? "live";

function getNotificationMode(value: string | undefined): "capture" | "live" {
  const mode = value ?? defaultNotificationMode;

  return mode === "capture" ? "capture" : "live";
}

function requiredInProduction(value: string | undefined, fallback: string) {
  if (value) {
    return value;
  }

  if (isProduction) {
    throw new Error("Missing required environment variable in production.");
  }

  return fallback;
}

export const env = {
  appUrl: process.env.SHOPIZA_APP_URL ?? "http://localhost:3000",
  sessionSecret: requiredInProduction(
    process.env.SESSION_SECRET,
    "shopiza-dev-session-secret-change-me",
  ),
  email: {
    resendApiKey: process.env.RESEND_API_KEY ?? "",
    fromEmail: process.env.FROM_EMAIL ?? "",
  },
  notifications: {
    emailMode: getNotificationMode(process.env.EMAIL_NOTIFICATION_MODE),
    emailOverride: process.env.TEST_NOTIFICATION_EMAIL ?? "",
  },
};
