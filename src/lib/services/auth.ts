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
  APP_NAME,
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

type RegistrationFieldErrorKey = "username" | "email" | "phoneNumber";
type RegistrationFieldErrors = Partial<Record<RegistrationFieldErrorKey, string[]>>;

const registrationConflictFieldByDatabaseField = {
  usernameNormalized: "username",
  emailNormalized: "email",
  phoneNumberNormalized: "phoneNumber",
} as const satisfies Record<string, RegistrationFieldErrorKey>;

const registrationConflictMessageByField = {
  username: "Username is already in use.",
  email: "Email is already in use.",
  phoneNumber: "Phone number is already in use.",
} satisfies Record<RegistrationFieldErrorKey, string>;

export class AuthError extends Error {}

export class ConflictError extends Error {
  constructor(
    message: string,
    public readonly fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ConflictError";
  }
}

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

function getPendingRegistrationExpiryDate() {
  return new Date(
    Date.now() + PENDING_REGISTRATION_TTL_MINUTES * 60 * 1000,
  );
}

function buildRegistrationFieldErrors(input: {
  usernameNormalized: string;
  emailNormalized: string;
  phoneNumberNormalized: string;
}, conflicts: Array<{
  usernameNormalized: string;
  emailNormalized: string;
  phoneNumberNormalized: string;
}>) {
  const fieldErrors: RegistrationFieldErrors = {};

  if (
    conflicts.some((conflict) => conflict.usernameNormalized === input.usernameNormalized)
  ) {
    fieldErrors.username = [registrationConflictMessageByField.username];
  }

  if (
    conflicts.some((conflict) => conflict.emailNormalized === input.emailNormalized)
  ) {
    fieldErrors.email = [registrationConflictMessageByField.email];
  }

  if (
    conflicts.some((conflict) => conflict.phoneNumberNormalized === input.phoneNumberNormalized)
  ) {
    fieldErrors.phoneNumber = [registrationConflictMessageByField.phoneNumber];
  }

  return fieldErrors;
}

function buildRegistrationConflictError(fieldErrors: RegistrationFieldErrors) {
  return new ConflictError("Please fix the highlighted fields.", fieldErrors);
}

function buildRegistrationConflictErrorFromUniqueTarget(target: unknown) {
  const normalizedTargets = Array.isArray(target)
    ? target
    : typeof target === "string"
      ? [target]
      : [];
  const fieldErrors: RegistrationFieldErrors = {};

  for (const entry of normalizedTargets) {
    const field =
      registrationConflictFieldByDatabaseField[
        entry as keyof typeof registrationConflictFieldByDatabaseField
      ];

    if (field) {
      fieldErrors[field] = [registrationConflictMessageByField[field]];
    }
  }

  return Object.keys(fieldErrors).length > 0
    ? buildRegistrationConflictError(fieldErrors)
    : new ConflictError(
        "Username, email, or phone number is already in use or awaiting verification.",
      );
}

export async function registerPendingClientUser(input: {
  fullName: string;
  username: string;
  email: string;
  phoneNumber: string;
  password: string;
}) {
  await clearExpiredPendingRegistrations();

  const usernameNormalized = normalizeUsername(input.username);
  const emailNormalized = normalizeEmail(input.email);
  const phoneNumberNormalized = normalizePhoneNumber(input.phoneNumber);

  const existingPendingRegistration = await prisma.pendingRegistration.findUnique({
    where: {
      emailNormalized,
    },
    select: pendingRegistrationSelect,
  });

  const [conflictingUsers, conflictingPendingRegistrations] = await Promise.all([
    prisma.user.findMany({
      where: {
        OR: [
          { usernameNormalized },
          { emailNormalized },
          { phoneNumberNormalized },
        ],
      },
      select: {
        usernameNormalized: true,
        emailNormalized: true,
        phoneNumberNormalized: true,
      },
    }),
    prisma.pendingRegistration.findMany({
      where: {
        OR: [
          { usernameNormalized },
          { emailNormalized },
          { phoneNumberNormalized },
        ],
        id: existingPendingRegistration
          ? { not: existingPendingRegistration.id }
          : undefined,
      },
      select: {
        usernameNormalized: true,
        emailNormalized: true,
        phoneNumberNormalized: true,
      },
    }),
  ]);

  const fieldErrors = buildRegistrationFieldErrors(
    {
      usernameNormalized,
      emailNormalized,
      phoneNumberNormalized,
    },
    [...conflictingUsers, ...conflictingPendingRegistrations],
  );

  if (Object.keys(fieldErrors).length > 0) {
    throw buildRegistrationConflictError(fieldErrors);
  }

  const pendingRegistrationData = {
    fullName: input.fullName,
    username: input.username,
    usernameNormalized,
    email: input.email,
    emailNormalized,
    phoneNumber: input.phoneNumber,
    phoneNumberNormalized,
    passwordHash: await hashPassword(input.password),
    role: "CLIENT" as const,
    emailVerified: false,
    phoneVerified: true,
    expiresAt: getPendingRegistrationExpiryDate(),
  };

  try {
    if (existingPendingRegistration) {
      const updatedRegistration = await prisma.pendingRegistration.update({
        where: {
          id: existingPendingRegistration.id,
        },
        data: pendingRegistrationData,
        select: pendingRegistrationSelect,
      });

      await logSecurityEvent({
        eventType: "registration.pending.renewed",
        message: `Pending registration renewed for ${updatedRegistration.email}`,
      });

      return updatedRegistration;
    }

    const createdRegistration = await prisma.pendingRegistration.create({
      data: pendingRegistrationData,
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
      throw buildRegistrationConflictErrorFromUniqueTarget(error.meta?.target);
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
    subject: `${APP_NAME} email verification code`,
    html: `<p>Your ${APP_NAME} email verification code is <strong>${code}</strong>. It expires in ${VERIFICATION_CODE_TTL_MINUTES} minutes.</p>`,
    text: `Your ${APP_NAME} email verification code is ${code}. It expires in ${VERIFICATION_CODE_TTL_MINUTES} minutes.`,
  });
}

async function deliverPasswordResetCode(
  user: AuthUser,
  code: string,
) {
  await sendMail({
    to: user.email,
    subject: `${APP_NAME} password reset code`,
    html: `<p>Your ${APP_NAME} password reset code is <strong>${code}</strong>. It expires in ${PASSWORD_RESET_TTL_MINUTES} minutes.</p>`,
    text: `Your ${APP_NAME} password reset code is ${code}. It expires in ${PASSWORD_RESET_TTL_MINUTES} minutes.`,
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
