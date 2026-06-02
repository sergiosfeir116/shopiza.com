import "server-only";

import { randomUUID } from "node:crypto";
import { readFile, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";

import { MAX_PRODUCT_IMAGE_BYTES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

const contentTypeByExtension = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
} as const;
const productImageFilenamePattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(?:jpe?g|png|webp)$/i;
const productImageUrlPrefix = "/uploads/products/";
const legacyProductUploadsDirectory = path.join(
  process.cwd(),
  "public",
  "uploads",
  "products",
);
const runtimeProductUploadsDirectory = resolveProductUploadsDirectory();
let uploadedProductImageStorageReady: Promise<void> | null = null;

type ProductImageContentType =
  (typeof contentTypeByExtension)[keyof typeof contentTypeByExtension];

function resolveProductUploadsDirectory() {
  if (process.env.PRODUCT_UPLOADS_DIR) {
    return path.resolve(process.cwd(), process.env.PRODUCT_UPLOADS_DIR);
  }

  if (process.env.NODE_ENV === "production") {
    return path.join(tmpdir(), "shopizaj", "uploads", "products");
  }

  return legacyProductUploadsDirectory;
}

function getProductImageContentType(filename: string): ProductImageContentType | null {
  const extension = path.extname(filename).toLowerCase();

  return contentTypeByExtension[extension as keyof typeof contentTypeByExtension] ?? null;
}

function isMissingFileError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as NodeJS.ErrnoException).code === "ENOENT"
  );
}

function getCandidateProductUploadDirectories() {
  if (runtimeProductUploadsDirectory === legacyProductUploadsDirectory) {
    return [runtimeProductUploadsDirectory];
  }

  return [runtimeProductUploadsDirectory, legacyProductUploadsDirectory];
}

function getDatabaseProvider() {
  const configuredProvider = process.env.DATABASE_PROVIDER?.toLowerCase();

  if (configuredProvider?.includes("postgres")) {
    return "postgresql";
  }

  if (configuredProvider?.includes("sqlite")) {
    return "sqlite";
  }

  const databaseUrl = process.env.DATABASE_URL ?? "";

  if (
    databaseUrl.startsWith("postgres://") ||
    databaseUrl.startsWith("postgresql://")
  ) {
    return "postgresql";
  }

  return "sqlite";
}

async function ensureUploadedProductImageStorage() {
  if (!uploadedProductImageStorageReady) {
    uploadedProductImageStorageReady = (async () => {
      if (getDatabaseProvider() === "postgresql") {
        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS "UploadedProductImage" (
            "id" TEXT PRIMARY KEY,
            "uploadedByUserId" TEXT NOT NULL,
            "imageUrl" TEXT NOT NULL,
            "contentType" TEXT NOT NULL,
            "data" BYTEA NOT NULL,
            "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
          )
        `);
      } else {
        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS "UploadedProductImage" (
            "id" TEXT PRIMARY KEY,
            "uploadedByUserId" TEXT NOT NULL,
            "imageUrl" TEXT NOT NULL,
            "contentType" TEXT NOT NULL,
            "data" BLOB NOT NULL,
            "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
          )
        `);
      }

      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "UploadedProductImage_imageUrl_key"
        ON "UploadedProductImage" ("imageUrl")
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "UploadedProductImage_uploadedByUserId_createdAt_idx"
        ON "UploadedProductImage" ("uploadedByUserId", "createdAt")
      `);
    })().catch((error) => {
      uploadedProductImageStorageReady = null;
      throw error;
    });
  }

  await uploadedProductImageStorageReady;
}

function buildProductImageUrl(filename: string) {
  return `${productImageUrlPrefix}${filename}`;
}

function getProductImageFilenameFromUrl(imageUrl: string) {
  if (!imageUrl.startsWith(productImageUrlPrefix)) {
    return null;
  }

  const filename = imageUrl.slice(productImageUrlPrefix.length);
  return productImageFilenamePattern.test(filename) ? filename : null;
}

async function normalizeProductImage(file: File) {
  const inputBuffer = Buffer.from(await file.arrayBuffer());

  try {
    const output = await sharp(inputBuffer, {
      failOnError: true,
    })
      .rotate()
      .webp({ quality: 90 })
      .toBuffer({ resolveWithObject: true });

    return {
      buffer: output.data,
      contentType: "image/webp" as const,
      extension: ".webp" as const,
    };
  } catch {
    throw new Error(
      "Unsupported image file. Please upload a common photo format like JPG, PNG, WebP, AVIF, GIF, BMP, or TIFF.",
    );
  }
}

export async function readStoredProductImage(filename: string) {
  if (!productImageFilenamePattern.test(filename)) {
    return null;
  }

  const contentType = getProductImageContentType(filename);
  if (!contentType) {
    return null;
  }

  await ensureUploadedProductImageStorage();

  const imageUrl = buildProductImageUrl(filename);
  const uploadedImages = await prisma.$queryRaw<Array<{ data: Uint8Array }>>`
    SELECT "data"
    FROM "UploadedProductImage"
    WHERE "imageUrl" = ${imageUrl}
    LIMIT 1
  `;
  const uploadedImage = uploadedImages[0];

  if (uploadedImage) {
    return {
      buffer: Buffer.from(uploadedImage.data),
      contentType,
    };
  }

  for (const directory of getCandidateProductUploadDirectories()) {
    try {
      const buffer = await readFile(path.join(directory, filename));
      return { buffer, contentType };
    } catch (error) {
      if (isMissingFileError(error)) {
        continue;
      }

      throw error;
    }
  }

  return null;
}

export async function saveProductImage(file: File, uploadedByUserId: string) {
  if (file.size > MAX_PRODUCT_IMAGE_BYTES) {
    throw new Error("Image size exceeds the 4MB limit.");
  }

  const normalizedImage = await normalizeProductImage(file);
  const filename = `${randomUUID()}${normalizedImage.extension}`;
  const id = randomUUID();
  const imageUrl = buildProductImageUrl(filename);

  await ensureUploadedProductImageStorage();

  await prisma.$executeRaw`
    INSERT INTO "UploadedProductImage" (
      "id",
      "uploadedByUserId",
      "imageUrl",
      "contentType",
      "data",
      "createdAt"
    )
    VALUES (
      ${id},
      ${uploadedByUserId},
      ${imageUrl},
      ${normalizedImage.contentType},
      ${normalizedImage.buffer},
      ${new Date()}
    )
  `;

  return imageUrl;
}

export async function deleteStoredProductImage(imageUrl: string) {
  const filename = getProductImageFilenameFromUrl(imageUrl);

  if (!filename) {
    return;
  }

  await ensureUploadedProductImageStorage();

  await prisma.$executeRaw`
    DELETE FROM "UploadedProductImage"
    WHERE "imageUrl" = ${imageUrl}
  `;

  for (const directory of getCandidateProductUploadDirectories()) {
    try {
      await unlink(path.join(directory, filename));
      return;
    } catch (error) {
      if (isMissingFileError(error)) {
        continue;
      }

      throw error;
    }
  }
}
