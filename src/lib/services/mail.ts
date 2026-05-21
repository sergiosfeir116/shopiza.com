import "server-only";

import { Resend } from "resend";

import { env } from "@/lib/env";
import { captureNotification } from "@/lib/services/test-notifications";

type MailRecipient = string | string[];

type MailInput = {
  to: MailRecipient;
  subject: string;
  html: string;
  text: string;
  replyTo?: MailRecipient;
};

let resendClient: Resend | null | undefined;

function getResendClient() {
  if (resendClient !== undefined) {
    return resendClient;
  }

  resendClient = env.email.resendApiKey
    ? new Resend(env.email.resendApiKey)
    : null;

  return resendClient;
}

function formatRecipients(value: MailRecipient) {
  return Array.isArray(value) ? value.join(", ") : value;
}

function normalizeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return error;
}

export function logEmailError(
  context: string,
  error: unknown,
  metadata?: Record<string, unknown>,
) {
  console.error(`[email] ${context}`, {
    ...metadata,
    error: normalizeError(error),
  });
}

export async function sendMail(input: MailInput) {
  if (env.notifications.emailMode === "capture") {
    const deliveredTo = env.notifications.emailOverride || input.to;

    await captureNotification({
      channel: "email",
      originalTo: input.to,
      deliveredTo,
      subject: input.subject,
      text: input.text,
      html: input.html,
      replyTo: input.replyTo,
    });

    return null;
  }

  const client = getResendClient();

  if (!client || !env.email.fromEmail) {
    const reason = [
      !env.email.resendApiKey ? "RESEND_API_KEY" : null,
      !env.email.fromEmail ? "FROM_EMAIL" : null,
    ]
      .filter(Boolean)
      .join(" and ");
    const message = `[mail] Skipping email because ${reason} is not configured. to=${formatRecipients(
      input.to,
    )} subject=${input.subject}`;

    if (process.env.NODE_ENV === "production") {
      console.warn(message);
    } else {
      console.info(`${message}\n${input.text}`);
    }

    return null;
  }

  try {
    const response = await client.emails.send({
      from: env.email.fromEmail,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      replyTo: input.replyTo,
    });

    if (response.error) {
      throw new Error(response.error.message);
    }

    return response.data;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      logEmailError("Falling back to console mail delivery in development.", error, {
        to: formatRecipients(input.to),
        subject: input.subject,
        from: env.email.fromEmail,
      });
      console.info(`[mail] Development fallback delivery\n${input.text}`);
      return null;
    }

    throw error;
  }
}
