import { getCurrentUser } from "@/lib/auth/current-user";
import { setCartItemQuantity } from "@/lib/services/cart";
import { jsonError, jsonResponse } from "@/lib/http";
import { assertSameOrigin } from "@/lib/security/request";
import { cartSetQuantitySchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);

    const user = await getCurrentUser();
    if (user?.role === "ADMIN") {
      return jsonError("Admins do not have a shopping cart.", 403);
    }

    const payload = cartSetQuantitySchema.safeParse(await request.json());
    if (!payload.success) {
      return jsonResponse(
        {
          success: false,
          errors: payload.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const cart = await setCartItemQuantity(payload.data);
    return jsonResponse({ success: true, cart });
  } catch (error) {
    if (error instanceof Error) {
      return jsonError(error.message, 400);
    }

    return jsonError("Could not update the cart quantity.", 500);
  }
}
