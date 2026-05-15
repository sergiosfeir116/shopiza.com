import { getCurrentUser } from "@/lib/auth/current-user";
import { clearCart } from "@/lib/services/cart";
import { jsonError, jsonResponse } from "@/lib/http";
import { assertSameOrigin } from "@/lib/security/request";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);

    const user = await getCurrentUser();
    if (user?.role === "ADMIN") {
      return jsonError("Admins do not have a shopping cart.", 403);
    }

    const { sessionId } = (await request.json()) as { sessionId?: string };

    if (!sessionId) {
      return jsonError("Cart session is required.", 400);
    }

    const cart = await clearCart(sessionId);
    return jsonResponse({ success: true, cart });
  } catch (error) {
    if (error instanceof Error) {
      return jsonError(error.message, 400);
    }

    return jsonError("Could not clear the cart.", 500);
  }
}
