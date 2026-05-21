import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  ALLOWED_PRODUCT_IMAGE_TYPES,
  MAX_PRODUCT_IMAGE_BYTES,
} from "@/lib/constants";

const extensionByMimeType: Record<(typeof ALLOWED_PRODUCT_IMAGE_TYPES)[number], string> =
  {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
  };
const contentTypeByExtension = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
} as const;
const productImageFilenamePattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(?:jpe?g|png|webp)$/i;
const legacyProductUploadsDirectory = path.join(
  process.cwd(),
  "public",
  "uploads",
  "products",
);
const runtimeProductUploadsDirectory = resolveProductUploadsDirectory();

type ProductImageContentType =
  (typeof contentTypeByExtension)[keyof typeof contentTypeByExtension];

function resolveProductUploadsDirectory() {
  if (process.env.PRODUCT_UPLOADS_DIR) {
    return path.resolve(process.cwd(), process.env.PRODUCT_UPLOADS_DIR);
  }

  if (process.env.NODE_ENV === "production") {
    return path.join(tmpdir(), "shopiza", "uploads", "products");
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

export async function readStoredProductImage(filename: string) {
  if (!productImageFilenamePattern.test(filename)) {
    return null;
  }

  const contentType = getProductImageContentType(filename);
  if (!contentType) {
    return null;
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

export async function saveProductImage(file: File) {
  if (!ALLOWED_PRODUCT_IMAGE_TYPES.includes(file.type as never)) {
    throw new Error("Unsupported file type. Please upload JPG, PNG, or WebP.");
  }

  if (file.size > MAX_PRODUCT_IMAGE_BYTES) {
    throw new Error("Image size exceeds the 4MB limit.");
  }

  const directory = runtimeProductUploadsDirectory;
  await mkdir(directory, { recursive: true });

  const extension = extensionByMimeType[file.type as keyof typeof extensionByMimeType];
  const filename = `${randomUUID()}${extension}`;
  const filepath = path.join(directory, filename);
  const buffer = Buffer.from(await file.arrayBuffer());

  await writeFile(filepath, buffer);

  return `/uploads/products/${filename}`;
}
