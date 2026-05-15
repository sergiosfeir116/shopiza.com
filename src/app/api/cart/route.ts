import { getCurrentUser } from "@/lib/auth/current-user";
import { getCartBySessionId } from "@/lib/services/cart";
import { jsonError, jsonResponse } from "@/lib/http";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (user?.role === "ADMIN") {
    return jsonError("Admins do not have a shopping cart.", 403);
  }

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return jsonResponse({
      success: true,
      cart: {
        sessionId: null,
        expiresAt: null,
        itemCount: 0,
        subtotalCents: 0,
        items: [],
      },
    });
  }

  try {
    const cart = await getCartBySessionId(sessionId);
    return jsonResponse({ success: true, cart });
  } catch (error) {
    if (error instanceof Error) {
      return jsonError(error.message, 400);
    }

    return jsonError("Could not load the cart.", 500);
  }
}
