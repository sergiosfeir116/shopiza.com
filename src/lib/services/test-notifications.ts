import "server-only";

import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";

type NotificationChannel = "email";

type NotificationRecipient = string | string[];

type CapturedNotification = {
  channel: NotificationChannel;
  originalTo: NotificationRecipient;
  deliveredTo: NotificationRecipient;
  subject?: string;
  text: string;
  html?: string;
  replyTo?: NotificationRecipient;
  url?: string;
  createdAt: string;
};

const outboxDirectory = path.join(process.cwd(), ".dev");
export const notificationOutboxPath = path.join(
  outboxDirectory,
  "notification-outbox.jsonl",
);

function formatRecipients(value: NotificationRecipient) {
  return Array.isArray(value) ? value.join(", ") : value;
}

export async function captureNotification(input: Omit<CapturedNotification, "createdAt">) {
  const payload: CapturedNotification = {
    ...input,
    createdAt: new Date().toISOString(),
  };

  await mkdir(outboxDirectory, { recursive: true });
  await appendFile(
    notificationOutboxPath,
    `${JSON.stringify(payload)}\n`,
    "utf8",
  );

  console.info(
    `[notifications:capture] channel=${payload.channel} to=${formatRecipients(
      payload.deliveredTo,
    )}`,
  );

  return payload;
}
