import { getCurrentUser } from "@/lib/auth/current-user";
import { jsonError, jsonResponse } from "@/lib/http";
import { assertSameOrigin } from "@/lib/security/request";
import { deleteStoredProductImage, saveProductImage } from "@/lib/uploads";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);

    const user = await getCurrentUser();
    if (!user) {
      return jsonError("Authentication required.", 401);
    }

    if (user.role !== "ADMIN") {
      return jsonError("Admin access required.", 403);
    }

    const formData = await request.formData();
    const uploaded = formData.getAll("files").filter((value): value is File => value instanceof File);

    if (uploaded.length === 0) {
      return jsonError("Upload at least one image.", 400);
    }

    const imageUrls = await Promise.all(uploaded.map((file) => saveProductImage(file)));

    return jsonResponse({
      success: true,
      imageUrls,
    });
  } catch (error) {
    if (error instanceof Error) {
      return jsonError(error.message, 400);
    }

    return jsonError("Could not upload the image.", 500);
  }
}

export async function DELETE(request: Request) {
  try {
    assertSameOrigin(request);

    const user = await getCurrentUser();
    if (!user) {
      return jsonError("Authentication required.", 401);
    }

    if (user.role !== "ADMIN") {
      return jsonError("Admin access required.", 403);
    }

    const payload = (await request.json()) as { imageUrl?: string };

    if (!payload.imageUrl) {
      return jsonError("Image URL is required.", 400);
    }

    await deleteStoredProductImage(payload.imageUrl);

    return jsonResponse({ success: true });
  } catch (error) {
    if (error instanceof Error) {
      return jsonError(error.message, 400);
    }

    return jsonError("Could not remove the uploaded image.", 500);
  }
}
