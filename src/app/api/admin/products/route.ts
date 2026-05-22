import { getCurrentUser } from "@/lib/auth/current-user";
import { upsertProduct } from "@/lib/services/admin";
import { jsonError, jsonResponse } from "@/lib/http";
import { assertSameOrigin } from "@/lib/security/request";
import { productSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);

    const user = await getCurrentUser();
    if (!user) return jsonError("Authentication required.", 401);
    if (user.role !== "ADMIN") return jsonError("Admin access required.", 403);

    const payload = productSchema.safeParse(await request.json());
    if (!payload.success) {
      const errors = payload.error.flatten().fieldErrors;
      const message =
        Object.values(errors).flat()[0] ?? "Please correct the product details.";

      return jsonResponse({ success: false, message, errors }, { status: 400 });
    }

    const product = await upsertProduct({
      id: payload.data.id,
      name: payload.data.name,
      description: payload.data.description,
      priceCents: payload.data.priceCents,
      stock: payload.data.stock,
      archived: payload.data.archived,
      sectionId: payload.data.sectionId,
      images: payload.data.images,
    });

    return jsonResponse({ success: true, product });
  } catch (error) {
    if (error instanceof Error) return jsonError(error.message, 400);
    return jsonError("Could not save the product.", 500);
  }
}
