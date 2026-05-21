import { z } from "zod";

import { calculateDiscountedPriceCents, normalizePhoneNumber, parseCurrencyInput, sanitizeText } from "@/lib/utils";

const usernamePattern = /^[a-zA-Z0-9_]+$/;

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .regex(/[A-Z]/, "Password must include at least one uppercase letter.")
  .regex(/[a-z]/, "Password must include at least one lowercase letter.")
  .regex(/[0-9]/, "Password must include at least one number.");

export const phoneSchema = z
  .string()
  .transform((value) => normalizePhoneNumber(value))
  .refine((value) => /^\+?\d{8,15}$/.test(value), "Enter a valid phone number.");

export const registrationSchema = z
  .object({
    fullName: z.string().min(3, "Full name is required.").max(80).transform(sanitizeText),
    username: z
      .string()
      .min(3, "Username must be at least 3 characters.")
      .max(24, "Username must be at most 24 characters.")
      .regex(usernamePattern, "Username can only contain letters, numbers, and underscores.")
      .transform(sanitizeText),
    email: z.email("Enter a valid email address.").transform((value) => value.trim()),
    phoneNumber: phoneSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export const loginSchema = z.object({
  identifier: z.string().min(3, "Email or username is required.").transform(sanitizeText),
  password: z.string().min(1, "Password is required."),
});

export const verificationRequestSchema = z.object({
  registrationId: z.uuid(),
});

export const verificationConfirmSchema = z.object({
  registrationId: z.uuid(),
  code: z.string().length(6, "Enter the 6-digit verification code."),
});

export const passwordResetRequestSchema = z.object({
  email: z.email("Enter a valid email address.").transform((value) => value.trim()),
});

export const passwordResetConfirmSchema = z
  .object({
    email: z.email("Enter a valid email address.").transform((value) => value.trim()),
    code: z.string().length(6, "Enter the 6-digit verification code."),
    newPassword: passwordSchema,
    confirmNewPassword: z.string(),
  })
  .refine((value) => value.newPassword === value.confirmNewPassword, {
    path: ["confirmNewPassword"],
    message: "Password fields do not match.",
  });

export const contactSchema = z.object({
  name: z.string().min(2, "Name is required.").max(80).transform(sanitizeText),
  email: z.email("Enter a valid email address."),
  phoneNumber: phoneSchema.optional().or(z.literal("")),
  message: z.string().min(10, "Message must be at least 10 characters.").max(2000).transform(sanitizeText),
});

export const sectionSchema = z.object({
  name: z.string().min(2, "Section name is required.").max(60).transform(sanitizeText),
  description: z
    .string()
    .min(10, "Description is required.")
    .max(240, "Description is too long.")
    .transform(sanitizeText),
});

export const productImageSchema = z.object({
  imageUrl: z.string().min(1),
  altText: z.string().max(160).optional().or(z.literal("")),
  isMain: z.boolean(),
  sortOrder: z.number().int().min(0),
});

export const productSchema = z
  .object({
    id: z.uuid().optional(),
    name: z.string().min(2, "Product name is required.").max(120).transform(sanitizeText),
    description: z.string().min(20, "Description must be at least 20 characters.").max(5000).transform(sanitizeText),
    price: z.union([z.string(), z.number()]),
    stock: z.coerce
      .number()
      .int("Stock must be a whole number.")
      .positive("Stock must be greater than 0."),
    sectionId: z.uuid().optional().nullable().or(z.literal("")),
    archived: z.boolean().default(false),
    images: z.array(productImageSchema).min(1, "Upload at least one product image."),
  })
  .transform((value) => ({
    ...value,
    priceCents: parseCurrencyInput(value.price),
    sectionId: value.sectionId || null,
  }))
  .refine((value) => value.priceCents > 0, {
    path: ["price"],
    message: "Price must be greater than 0.",
  })
  .refine((value) => value.images.some((image) => image.isMain), {
    path: ["images"],
    message: "Choose one main product image.",
  });

export const discountSchema = z
  .object({
    productId: z.uuid(),
    type: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]),
    value: z.coerce.number().int().min(1),
    priceCents: z.coerce.number().int().min(0),
    startAt: z.string().optional().or(z.literal("")),
    endAt: z.string().min(1),
    startImmediately: z.boolean().default(false),
    isActive: z.boolean().default(true),
  })
  .refine((value) => value.startImmediately || Boolean(value.startAt), {
    path: ["startAt"],
    message: "Start time is required unless the discount starts immediately.",
  })
  .transform((value) => {
    const startAt = value.startImmediately ? new Date() : new Date(value.startAt ?? "");
    const endAt = new Date(value.endAt);
    const discountedPriceCents = calculateDiscountedPriceCents(
      value.priceCents,
      value.type,
      value.type === "FIXED_AMOUNT" ? value.value * 100 : value.value,
    );

    return {
      ...value,
      startAt,
      endAt,
      discountValue: value.type === "FIXED_AMOUNT" ? value.value * 100 : value.value,
      discountedPriceCents,
    };
  })
  .refine((value) => !Number.isNaN(value.startAt.getTime()), {
    path: ["startAt"],
    message: "Enter a valid start time.",
  })
  .refine((value) => !Number.isNaN(value.endAt.getTime()), {
    path: ["endAt"],
    message: "Enter a valid end time.",
  })
  .refine((value) => value.endAt.getTime() > value.startAt.getTime(), {
    path: ["endAt"],
    message: "Discount end time must be after the start time.",
  });

export const cartMutationSchema = z.object({
  sessionId: z.uuid(),
  productId: z.uuid(),
  quantity: z.coerce.number().int().min(1),
});

export const cartSetQuantitySchema = z.object({
  sessionId: z.uuid(),
  productId: z.uuid(),
  quantity: z.coerce.number().int().min(0),
});

export const checkoutSchema = z.object({
  cartSessionId: z.uuid(),
  destinationLocation: z.string().min(5, "Delivery location is required.").max(240).transform(sanitizeText),
  destinationLatitude: z.number().optional().nullable(),
  destinationLongitude: z.number().optional().nullable(),
  destinationPlaceId: z.string().max(180).optional().nullable(),
});

export const orderStatusSchema = z.object({
  status: z.enum(["PENDING", "IN_PROGRESS", "ON_THE_WAY", "DELIVERED"]),
});
