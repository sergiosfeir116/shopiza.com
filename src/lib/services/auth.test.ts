import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    pendingRegistration: {
      deleteMany: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    pendingRegistrationCode: {
      deleteMany: vi.fn(),
      create: vi.fn(),
    },
    securityEvent: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth/password", () => ({
  hashPassword: vi.fn(async (value: string) => `hashed:${value}`),
  verifyPassword: vi.fn(),
}));

vi.mock("@/lib/security/logger", () => ({
  logSecurityEvent: vi.fn(),
}));

vi.mock("@/lib/services/mail", () => ({
  sendMail: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { logSecurityEvent } from "@/lib/security/logger";
import { sendMail } from "@/lib/services/mail";
import {
  issueVerificationCodeForPendingRegistration,
  type PendingRegistration,
  registerPendingClientUser,
} from "@/lib/services/auth";

const prismaMock = prisma as unknown as {
  user: {
    findFirst: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
  };
  pendingRegistration: {
    deleteMany: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  pendingRegistrationCode: {
    deleteMany: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
};

function buildPendingRegistration(
  overrides: Partial<PendingRegistration> = {},
): PendingRegistration {
  const now = new Date("2026-05-21T10:00:00.000Z");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  return {
    id: "pending-1",
    fullName: "Test User",
    username: "test_user",
    email: "test@example.com",
    phoneNumber: "+9613111222",
    role: "CLIENT",
    passwordHash: "hashed:StrongPass1",
    emailVerified: false,
    phoneVerified: true,
    locationAccessGranted: false,
    locationLabel: null,
    locationLatitude: null,
    locationLongitude: null,
    expiresAt,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("registerPendingClientUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    prismaMock.pendingRegistration.deleteMany.mockResolvedValue({ count: 0 });
    prismaMock.user.findMany.mockResolvedValue([]);
    prismaMock.pendingRegistration.findUnique.mockResolvedValue(null);
    prismaMock.pendingRegistration.findMany.mockResolvedValue([]);
  });

  it("renews an existing pending registration for the same email", async () => {
    const existingRegistration = buildPendingRegistration();
    const renewedRegistration = buildPendingRegistration({
      fullName: "Updated User",
      username: "updated_user",
      phoneNumber: "+9613111333",
      passwordHash: "hashed:NewStrong1",
    });

    prismaMock.pendingRegistration.findUnique.mockResolvedValue(existingRegistration);
    prismaMock.pendingRegistration.update.mockResolvedValue(renewedRegistration);

    const result = await registerPendingClientUser({
      fullName: "Updated User",
      username: "updated_user",
      email: "test@example.com",
      phoneNumber: "+9613111333",
      password: "NewStrong1",
    });

    expect(result).toEqual(renewedRegistration);
    expect(prismaMock.pendingRegistration.create).not.toHaveBeenCalled();
    expect(prismaMock.pendingRegistration.update).toHaveBeenCalledWith({
      where: {
        id: existingRegistration.id,
      },
      data: expect.objectContaining({
        fullName: "Updated User",
        username: "updated_user",
        usernameNormalized: "updated_user",
        email: "test@example.com",
        emailNormalized: "test@example.com",
        phoneNumber: "+9613111333",
        phoneNumberNormalized: "+9613111333",
        passwordHash: "hashed:NewStrong1",
        emailVerified: false,
        phoneVerified: true,
        expiresAt: expect.any(Date),
      }),
      select: expect.any(Object),
    });
    expect(logSecurityEvent).toHaveBeenCalledWith({
      eventType: "registration.pending.renewed",
      message: "Pending registration renewed for test@example.com",
    });
  });

  it("rejects registration when a user already owns the identifiers", async () => {
    prismaMock.user.findMany.mockResolvedValue([
      {
        usernameNormalized: "test_user",
        emailNormalized: "other@example.com",
        phoneNumberNormalized: "+9613111222",
      },
    ]);

    await expect(registerPendingClientUser({
        fullName: "Test User",
        username: "test_user",
        email: "test@example.com",
        phoneNumber: "+9613111222",
        password: "StrongPass1",
      })).rejects.toMatchObject({
      fieldErrors: {
        username: ["Username is already in use."],
        phoneNumber: ["Phone number is already in use."],
      },
    });

    expect(prismaMock.pendingRegistration.findUnique).toHaveBeenCalled();
    expect(prismaMock.pendingRegistration.findMany).toHaveBeenCalled();
    expect(prismaMock.pendingRegistration.create).not.toHaveBeenCalled();
    expect(prismaMock.pendingRegistration.update).not.toHaveBeenCalled();
  });

  it("rejects registration when another pending signup already uses a username or phone number", async () => {
    prismaMock.pendingRegistration.findUnique.mockResolvedValue(
      buildPendingRegistration(),
    );
    prismaMock.pendingRegistration.findMany.mockResolvedValue([
      {
        usernameNormalized: "taken_username",
        emailNormalized: "elsewhere@example.com",
        phoneNumberNormalized: "+9613222444",
      },
      {
        usernameNormalized: "another_user",
        emailNormalized: "another@example.com",
        phoneNumberNormalized: "+9613111333",
      },
    ]);

    await expect(registerPendingClientUser({
      fullName: "Updated User",
      username: "taken_username",
      email: "test@example.com",
      phoneNumber: "+9613111333",
      password: "StrongPass1",
    })).rejects.toMatchObject({
      fieldErrors: {
        username: ["Username is already in use."],
        phoneNumber: ["Phone number is already in use."],
      },
    });

    expect(prismaMock.pendingRegistration.update).not.toHaveBeenCalled();
    expect(prismaMock.pendingRegistration.create).not.toHaveBeenCalled();
  });

  it("creates a new pending registration when the email is not already pending", async () => {
    const createdRegistration = buildPendingRegistration();

    prismaMock.pendingRegistration.create.mockResolvedValue(createdRegistration);

    const result = await registerPendingClientUser({
      fullName: "Test User",
      username: "test_user",
      email: "test@example.com",
      phoneNumber: "+9613111222",
      password: "StrongPass1",
    });

    expect(result).toEqual(createdRegistration);
    expect(prismaMock.pendingRegistration.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        fullName: "Test User",
        username: "test_user",
        usernameNormalized: "test_user",
        email: "test@example.com",
        emailNormalized: "test@example.com",
        phoneNumber: "+9613111222",
        phoneNumberNormalized: "+9613111222",
        passwordHash: "hashed:StrongPass1",
        emailVerified: false,
        phoneVerified: true,
        expiresAt: expect.any(Date),
      }),
      select: expect.any(Object),
    });
    expect(logSecurityEvent).toHaveBeenCalledWith({
      eventType: "registration.pending",
      message: "Pending registration started for test@example.com",
    });
  });
});

describe("issueVerificationCodeForPendingRegistration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("invalidates the previous unconsumed code before issuing a new one", async () => {
    const registration = buildPendingRegistration();

    prismaMock.pendingRegistrationCode.deleteMany.mockResolvedValue({ count: 1 });
    prismaMock.pendingRegistrationCode.create.mockResolvedValue({
      id: "verification-code-2",
    });

    await issueVerificationCodeForPendingRegistration(registration);

    expect(prismaMock.pendingRegistrationCode.deleteMany).toHaveBeenCalledWith({
      where: {
        pendingRegistrationId: registration.id,
        channel: "EMAIL",
        purpose: "EMAIL_VERIFICATION",
        consumedAt: null,
      },
    });
    expect(prismaMock.pendingRegistrationCode.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        pendingRegistrationId: registration.id,
        channel: "EMAIL",
        purpose: "EMAIL_VERIFICATION",
        destination: registration.email,
        codeHash: expect.stringMatching(/^hashed:/),
        expiresAt: expect.any(Date),
      }),
    });
    expect(sendMail).toHaveBeenCalledTimes(1);
  });
});
