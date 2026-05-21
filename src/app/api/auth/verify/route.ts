import {
  ConflictError,
  findPendingRegistrationById,
  issueVerificationCodeForPendingRegistration,
  verifyPendingRegistrationCode,
} from "@/lib/services/auth";
import { jsonError, jsonResponse } from "@/lib/http";
import { enforceRateLimit, RateLimitError } from "@/lib/security/rate-limit";
import { assertSameOrigin, getClientIp } from "@/lib/security/request";
import {
  verificationConfirmSchema,
  verificationRequestSchema,
} from "@/lib/validation";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);

    await enforceRateLimit({
      action: "auth.verify",
      identifier: getClientIp(request) ?? "unknown",
      limit: 12,
      windowMs: 15 * 60 * 1000,
    });

    const payload = verificationConfirmSchema.safeParse(await request.json());
    if (!payload.success) {
      return jsonResponse(
        {
          success: false,
          errors: payload.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const result = await verifyPendingRegistrationCode(payload.data);

    return jsonResponse({
      success: true,
      fullyVerified: result.fullyVerified,
    });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return jsonError(error.message, 429);
    }

    if (error instanceof ConflictError) {
      return jsonError(error.message, 409);
    }

    if (error instanceof Error) {
      return jsonError(error.message, 400);
    }

    return jsonError("Verification failed.", 500);
  }
}

export async function PUT(request: Request) {
  try {
    assertSameOrigin(request);

    await enforceRateLimit({
      action: "auth.verify.resend",
      identifier: getClientIp(request) ?? "unknown",
      limit: 6,
      windowMs: 15 * 60 * 1000,
    });

    const payload = verificationRequestSchema.safeParse(await request.json());
    if (!payload.success) {
      return jsonResponse(
        {
          success: false,
          errors: payload.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const registration = await findPendingRegistrationById(
      payload.data.registrationId,
    );

    if (!registration) {
      return jsonError("Pending registration not found or expired.", 404);
    }

    await issueVerificationCodeForPendingRegistration(registration);

    return jsonResponse({
      success: true,
      message: "A new email code was sent.",
    });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return jsonError(error.message, 429);
    }

    return jsonError("Could not resend the verification code.", 500);
  }
}
