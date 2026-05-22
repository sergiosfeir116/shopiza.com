import "server-only";

import { APP_NAME, SUPPORT_EMAIL } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/services/mail";

export async function createContactMessage(input: {
  name: string;
  email: string;
  phoneNumber?: string;
  message: string;
}) {
  const message = await prisma.contactMessage.create({
    data: {
      name: input.name,
      email: input.email,
      phoneNumber: input.phoneNumber || null,
      message: input.message,
    },
  });

  await sendMail({
    to: SUPPORT_EMAIL,
    subject: `New ${APP_NAME} contact message`,
    html: `
      <h1>New contact message</h1>
      <p><strong>Name:</strong> ${input.name}</p>
      <p><strong>Email:</strong> ${input.email}</p>
      <p><strong>Phone:</strong> ${input.phoneNumber || "Not provided"}</p>
      <p><strong>Message:</strong></p>
      <p>${input.message}</p>
    `,
    text: [
      "New contact message",
      `Name: ${input.name}`,
      `Email: ${input.email}`,
      `Phone: ${input.phoneNumber || "Not provided"}`,
      `Message: ${input.message}`,
    ].join("\n"),
  });

  return message;
}
