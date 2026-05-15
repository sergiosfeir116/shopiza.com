import { getCurrentUser } from "@/lib/auth/current-user";
import { createOrderFromReservation } from "@/lib/services/orders";
import { jsonError, jsonResponse } from "@/lib/http";
import { assertSameOrigin } from "@/lib/security/request";
import { checkoutSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);

    const user = await getCurrentUser();
    if (!user) {
      return jsonError("You must log in before placing an order.", 401);
    }

    if (user.role === "ADMIN") {
      return jsonError("Admins cannot place orders.", 403);
    }

    const payload = checkoutSchema.safeParse(await request.json());
    if (!payload.success) {
      return jsonResponse(
        {
          success: false,
          errors: payload.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const order = await createOrderFromReservation({
      userId: user.id,
      sessionId: payload.data.cartSessionId,
      destinationLocation: payload.data.destinationLocation,
      destinationLatitude: payload.data.destinationLatitude ?? null,
      destinationLongitude: payload.data.destinationLongitude ?? null,
      destinationPlaceId: payload.data.destinationPlaceId ?? null,
    });

    return jsonResponse({
      success: true,
      orderNumber: order.orderNumber,
      orderId: order.id,
    });
  } catch (error) {
    if (error instanceof Error) {
      return jsonError(error.message, 400);
    }

    return jsonError("Could not submit your order.", 500);
  }
}
