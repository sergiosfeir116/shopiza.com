import "server-only";

import {
  Prisma,
  type VerificationPurpose,
} from "@prisma/client";

import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { logSecurityEvent } from "@/lib/security/logger";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/services/mail";
import {
  PASSWORD_RESET_TTL_MINUTES,
  PENDING_REGISTRATION_TTL_MINUTES,
  VERIFICATION_CODE_TTL_MINUTES,
} from "@/lib/constants";
import {
  generateSixDigitCode,
  normalizeEmail,
  normalizePhoneNumber,
  normalizeUsername,
} from "@/lib/utils";

const authUserSelect = {
  id: true,
  fullName: true,
  username: true,
  email: true,
  phoneNumber: true,
  role: true,
  passwordHash: true,
  emailVerified: true,
  phoneVerified: true,
  locationAccessGranted: true,
  locationLabel: true,
  locationLatitude: true,
  locationLongitude: true,
  createdAt: true,
  updatedAt: true,
} as const;

export type AuthUser = Prisma.UserGetPayload<{
  select: typeof authUserSelect;
}>;

const pendingRegistrationSelect = {
  id: true,
  fullName: true,
  username: true,
  email: true,
  phoneNumber: true,
  role: true,
  passwordHash: true,
  emailVerified: true,
  phoneVerified: true,
  locationAccessGranted: true,
  locationLabel: true,
  locationLatitude: true,
  locationLongitude: true,
  expiresAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

export type PendingRegistration = Prisma.PendingRegistrationGetPayload<{
  select: typeof pendingRegistrationSelect;
}>;

export class AuthError extends Error {}

export class ConflictError extends Error {}

export async function findUserByLoginIdentifier(identifier: string) {
  const normalizedEmail = normalizeEmail(identifier);
  const normalizedUsername = normalizeUsername(identifier);

  return prisma.user.findFirst({
    where: {
      OR: [
        { emailNormalized: normalizedEmail },
        { usernameNormalized: normalizedUsername },
      ],
    },
    select: authUserSelect,
  });
}

export async function findUserByRecoveryEmail(email: string) {
  const normalizedEmail = normalizeEmail(email);

  return prisma.user.findFirst({
    where: {
      emailNormalized: normalizedEmail,
    },
    select: authUserSelect,
  });
}

async function clearExpiredPendingRegistrations() {
  await prisma.pendingRegistration.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });
}

export async function registerPendingClientUser(input: {
  fullName: string;
  username: string;
  email: string;
  phoneNumber: string;
  password: string;
}) {
  try {
    await clearExpiredPendingRegistrations();

    const createdRegistration = await prisma.pendingRegistration.create({
      data: {
        fullName: input.fullName,
        username: input.username,
        usernameNormalized: normalizeUsername(input.username),
        email: input.email,
        emailNormalized: normalizeEmail(input.email),
        phoneNumber: input.phoneNumber,
        phoneNumberNormalized: normalizePhoneNumber(input.phoneNumber),
        passwordHash: await hashPassword(input.password),
        role: "CLIENT",
        phoneVerified: true,
        expiresAt: new Date(
          Date.now() + PENDING_REGISTRATION_TTL_MINUTES * 60 * 1000,
        ),
      },
      select: pendingRegistrationSelect,
    });

    await logSecurityEvent({
      eventType: "registration.pending",
      message: `Pending registration started for ${createdRegistration.email}`,
    });

    return createdRegistration;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ConflictError(
        "Username, email, or phone number is already in use or awaiting verification.",
      );
    }

    throw error;
  }
}

async function deliverVerificationCode(
  target: Pick<PendingRegistration, "email">,
  code: string,
) {
  await sendMail({
    to: target.email,
    subject: "Shopiza email verification code",
    html: `<p>Your Shopiza email verification code is <strong>${code}</strong>. It expires in ${VERIFICATION_CODE_TTL_MINUTES} minutes.</p>`,
    text: `Your Shopiza email verification code is ${code}. It expires in ${VERIFICATION_CODE_TTL_MINUTES} minutes.`,
  });
}

async function deliverPasswordResetCode(
  user: AuthUser,
  code: string,
) {
  await sendMail({
    to: user.email,
    subject: "Shopiza password reset code",
    html: `<p>Your Shopiza password reset code is <strong>${code}</strong>. It expires in ${PASSWORD_RESET_TTL_MINUTES} minutes.</p>`,
    text: `Your Shopiza password reset code is ${code}. It expires in ${PASSWORD_RESET_TTL_MINUTES} minutes.`,
  });
}

export async function findPendingRegistrationById(registrationId: string) {
  await clearExpiredPendingRegistrations();

  return prisma.pendingRegistration.findUnique({
    where: {
      id: registrationId,
    },
    select: pendingRegistrationSelect,
  });
}

export async function issueVerificationCodeForPendingRegistration(
  registration: PendingRegistration,
) {
  if (registration.expiresAt.getTime() < Date.now()) {
    await prisma.pendingRegistration.delete({
      where: {
        id: registration.id,
      },
    });
    throw new AuthError("Registration verification expired. Register again.");
  }

  const purpose: VerificationPurpose = "EMAIL_VERIFICATION";
  const code = generateSixDigitCode();
  const expiresAt = new Date(
    Date.now() + VERIFICATION_CODE_TTL_MINUTES * 60 * 1000,
  );

  await prisma.pendingRegistrationCode.deleteMany({
    where: {
      pendingRegistrationId: registration.id,
      channel: "EMAIL",
      purpose,
      consumedAt: null,
    },
  });

  await prisma.pendingRegistrationCode.create({
    data: {
      pendingRegistrationId: registration.id,
      channel: "EMAIL",
      purpose,
      destination: registration.email,
      codeHash: await hashPassword(code),
      expiresAt,
    },
  });

  await deliverVerificationCode(registration, code);
}

export async function verifyPendingRegistrationCode(input: {
  registrationId: string;
  code: string;
}) {
  const purpose: VerificationPurpose = "EMAIL_VERIFICATION";
  const record = await prisma.pendingRegistrationCode.findFirst({
    where: {
      pendingRegistrationId: input.registrationId,
      channel: "EMAIL",
      purpose,
      consumedAt: null,
      expiresAt: {
        gte: new Date(),
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!record || !(await verifyPassword(input.code, record.codeHash))) {
    await prisma.pendingRegistrationCode.updateMany({
      where: {
        id: record?.id,
      },
      data: {
        attempts: {
          increment: 1,
        },
      },
    });

    throw new AuthError("Invalid verification code.");
  }

  const result = await prisma.$transaction(async (transaction) => {
    await transaction.pendingRegistrationCode.update({
      where: {
        id: record.id,
      },
      data: {
        consumedAt: new Date(),
      },
    });

    const pendingRegistration = await transaction.pendingRegistration.update({
      where: {
        id: input.registrationId,
      },
      data: { emailVerified: true },
      select: pendingRegistrationSelect,
    });

    try {
      const createdUser = await transaction.user.create({
        data: {
          fullName: pendingRegistration.fullName,
          username: pendingRegistration.username,
          usernameNormalized: normalizeUsername(pendingRegistration.username),
          email: pendingRegistration.email,
          emailNormalized: normalizeEmail(pendingRegistration.email),
          phoneNumber: pendingRegistration.phoneNumber,
          phoneNumberNormalized: normalizePhoneNumber(pendingRegistration.phoneNumber),
          passwordHash: pendingRegistration.passwordHash,
          role: "CLIENT",
          emailVerified: true,
          phoneVerified: true,
        },
        select: authUserSelect,
      });

      await transaction.pendingRegistration.delete({
        where: {
          id: pendingRegistration.id,
        },
      });

      return {
        fullyVerified: true,
        user: createdUser,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictError(
          "Registration could not be completed because those account details are already in use.",
        );
      }

      throw error;
    }
  });

  if (result.fullyVerified && result.user) {
    await logSecurityEvent({
      userId: result.user.id,
      eventType: "registration.success",
      message: `New client registered: ${result.user.email}`,
    });
  }

  return result;
}

export async function authenticateUser(identifier: string, password: string) {
  const user = await findUserByLoginIdentifier(identifier);

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    await logSecurityEvent({
      eventType: "login.failure",
      message: `Failed login attempt for ${identifier}`,
    });
    throw new AuthError("Invalid credentials.");
  }

  if (!user.emailVerified) {
    throw new AuthError("Verify your email before logging in.");
  }

  await logSecurityEvent({
    userId: user.id,
    eventType: "login.success",
    message: `User logged in: ${user.email}`,
  });

  return user;
}

export async function issuePasswordResetCode(email: string) {
  const user = await findUserByRecoveryEmail(email);

  if (!user) {
    return;
  }

  const code = generateSixDigitCode();
  const expiresAt = new Date(
    Date.now() + PASSWORD_RESET_TTL_MINUTES * 60 * 1000,
  );

  await prisma.passwordResetCode.deleteMany({
    where: {
      userId: user.id,
      channel: "EMAIL",
      consumedAt: null,
    },
  });

  await prisma.passwordResetCode.create({
    data: {
      userId: user.id,
      channel: "EMAIL",
      destination: user.email,
      codeHash: await hashPassword(code),
      expiresAt,
    },
  });

  await deliverPasswordResetCode(user, code);

  await logSecurityEvent({
    userId: user.id,
    eventType: "password-reset.requested",
    message: "Password reset requested via EMAIL.",
  });
}

export async function resetPasswordWithCode(input: {
  email: string;
  code: string;
  newPassword: string;
}) {
  const user = await findUserByRecoveryEmail(input.email);

  if (!user) {
    throw new AuthError("Invalid password reset request.");
  }

  const record = await prisma.passwordResetCode.findFirst({
    where: {
      userId: user.id,
      channel: "EMAIL",
      consumedAt: null,
      expiresAt: {
        gte: new Date(),
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!record || !(await verifyPassword(input.code, record.codeHash))) {
    throw new AuthError("Invalid password reset code.");
  }

  if (await verifyPassword(input.newPassword, user.passwordHash)) {
    throw new AuthError("The new password must be different from the old password.");
  }

  await prisma.$transaction(async (transaction) => {
    await transaction.user.update({
      where: {
        id: user.id,
      },
      data: {
        passwordHash: await hashPassword(input.newPassword),
      },
    });

    await transaction.passwordResetCode.update({
      where: {
        id: record.id,
      },
      data: {
        consumedAt: new Date(),
      },
    });
  });

  await logSecurityEvent({
    userId: user.id,
    eventType: "password-reset.completed",
    message: "Password reset completed via EMAIL.",
  });
}
