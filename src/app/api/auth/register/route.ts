import {
  ConflictError,
  issueVerificationCodeForPendingRegistration,
  registerPendingClientUser,
} from "@/lib/services/auth";
import { enforceRateLimit, RateLimitError } from "@/lib/security/rate-limit";
import { assertSameOrigin, getClientIp } from "@/lib/security/request";
import { registrationSchema } from "@/lib/validation";
import { jsonError, jsonResponse } from "@/lib/http";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);

    const payload = registrationSchema.safeParse(await request.json());
    if (!payload.success) {
      return jsonResponse(
        {
          success: false,
          errors: payload.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    await enforceRateLimit({
      action: "auth.register",
      identifier: getClientIp(request) ?? "unknown",
      limit: 5,
      windowMs: 15 * 60 * 1000,
    });

    const registration = await registerPendingClientUser(payload.data);

    await issueVerificationCodeForPendingRegistration(registration);

    return jsonResponse({
      success: true,
      registrationId: registration.id,
      message: "Registration started. Verify your email to create the account.",
    });
  } catch (error) {
    if (error instanceof ConflictError) {
      return jsonError(error.message, 409);
    }

    if (error instanceof RateLimitError) {
      return jsonError(error.message, 429);
    }

    return jsonError("Registration failed. Please try again.", 500);
  }
}
