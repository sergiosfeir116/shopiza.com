import { beforeEach, describe, expect, it, vi } from "vitest";
import sharp from "sharp";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $executeRawUnsafe: vi.fn(async () => undefined),
    $executeRaw: vi.fn(async () => undefined),
    $queryRaw: vi.fn(async () => []),
  },
}));

import { prisma } from "@/lib/prisma";
import { saveProductImage } from "@/lib/uploads";

const prismaMock = prisma as unknown as {
  $executeRawUnsafe: ReturnType<typeof vi.fn>;
  $executeRaw: ReturnType<typeof vi.fn>;
  $queryRaw: ReturnType<typeof vi.fn>;
};

describe("saveProductImage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("accepts a non-standard photo upload and stores it as webp", async () => {
    const sourceBuffer = await sharp({
      create: {
        width: 2,
        height: 2,
        channels: 3,
        background: { r: 220, g: 120, b: 90 },
      },
    })
      .png()
      .toBuffer();
    const file = new File([new Uint8Array(sourceBuffer)], "camera-photo.heic", {
      type: "image/heic",
    });

    const imageUrl = await saveProductImage(file, "admin-1");

    expect(imageUrl).toMatch(/^\/uploads\/products\/[0-9a-f-]{36}\.webp$/);
    expect(prismaMock.$executeRawUnsafe).toHaveBeenCalled();
    expect(prismaMock.$executeRaw).toHaveBeenCalledTimes(1);

    const rawCall = prismaMock.$executeRaw.mock.calls[0];
    const storedContentType = rawCall[4];
    const storedBuffer = rawCall[5] as Buffer;

    expect(storedContentType).toBe("image/webp");
    expect(Buffer.isBuffer(storedBuffer)).toBe(true);
    expect((await sharp(storedBuffer).metadata()).format).toBe("webp");
  });

  it("rejects files larger than the configured limit", async () => {
    const file = new File([new Uint8Array(4 * 1024 * 1024 + 1)], "too-big.png", {
      type: "image/png",
    });

    await expect(saveProductImage(file, "admin-1")).rejects.toThrow(
      "Image size exceeds the 4MB limit.",
    );
  });
});
