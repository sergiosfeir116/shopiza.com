import { readStoredProductImage } from "@/lib/uploads";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;
  const image = await readStoredProductImage(filename);

  if (!image) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(image.buffer, {
    headers: {
      "Content-Type": image.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
