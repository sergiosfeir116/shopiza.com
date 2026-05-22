import "server-only";

import { Prisma, type OrderStatus, type PaymentMethod } from "@prisma/client";

import {
  sendAdminOrderNotificationEmail,
  sendOrderConfirmationEmail,
  sendOrderStatusUpdateEmail,
  type OrderEmailPayload,
} from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { logEmailError } from "@/lib/services/mail";
import { generateOrderNumber } from "@/lib/utils";

type EmailReadyOrder = {
  orderNumber: string;
  clientName: string;
  clientEmail: string;
  clientPhoneNumber: string;
  destinationLocation: string;
  destinationLatitude: number | null;
  destinationLongitude: number | null;
  destinationPlaceId: string | null;
  totalPriceCents: number;
  paymentMethod: PaymentMethod;
  items: Array<{
    productNameSnapshot: string;
    quantity: number;
    unitPriceSnapshotCents: number;
    totalPriceSnapshotCents: number;
  }>;
};

function buildOrderEmailPayload(order: EmailReadyOrder): OrderEmailPayload {
  return {
    orderNumber: order.orderNumber,
    customerName: order.clientName,
    customerEmail: order.clientEmail,
    customerPhoneNumber: order.clientPhoneNumber,
    destinationLocation: order.destinationLocation,
    destinationLatitude: order.destinationLatitude,
    destinationLongitude: order.destinationLongitude,
    destinationPlaceId: order.destinationPlaceId,
    totalPriceCents: order.totalPriceCents,
    paymentMethod: order.paymentMethod,
    items: order.items.map((item) => ({
      productName: item.productNameSnapshot,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceSnapshotCents,
      totalPriceCents: item.totalPriceSnapshotCents,
    })),
  };
}

async function attemptOrderEmail(
  context: string,
  metadata: Record<string, unknown>,
  callback: () => Promise<void>,
) {
  try {
    await callback();
  } catch (error) {
    logEmailError(context, error, metadata);
  }
}

export async function createOrderFromReservation(input: {
  sessionId: string;
  userId: string;
  destinationLocation: string;
  destinationLatitude?: number | null;
  destinationLongitude?: number | null;
  destinationPlaceId?: string | null;
}) {
  const order = await prisma.$transaction(async (transaction) => {
    const reservation = await transaction.cartReservation.findUnique({
      where: {
        sessionId: input.sessionId,
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: true,
              },
            },
          },
        },
      },
    });

    if (!reservation || reservation.items.length === 0) {
      throw new Error("Your cart is empty.");
    }

    const user = await transaction.user.findUnique({
      where: {
        id: input.userId,
      },
    });

    if (!user) {
      throw new Error("User not found.");
    }

    const totalPriceCents = reservation.items.reduce(
      (sum, item) => sum + item.unitPriceSnapshotCents * item.quantity,
      0,
    );

    const createdOrder = await transaction.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId: user.id,
        clientName: user.fullName,
        clientEmail: user.email,
        clientPhoneNumber: user.phoneNumber,
        totalPriceCents,
        destinationLocation: input.destinationLocation,
        destinationLatitude: input.destinationLatitude ?? null,
        destinationLongitude: input.destinationLongitude ?? null,
        destinationPlaceId: input.destinationPlaceId ?? null,
        items: {
          create: reservation.items.map((item) => ({
            productId: item.productId,
            productNameSnapshot: item.product.name,
            quantity: item.quantity,
            unitPriceSnapshotCents: item.unitPriceSnapshotCents,
            totalPriceSnapshotCents: item.unitPriceSnapshotCents * item.quantity,
            mainImageSnapshot:
              item.product.images.find((image) => image.isMain)?.imageUrl ??
              item.product.images[0]?.imageUrl ??
              null,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    await transaction.cartReservationItem.deleteMany({
      where: {
        reservationId: reservation.id,
      },
    });

    await transaction.cartReservation.delete({
      where: {
        id: reservation.id,
      },
    });

    return createdOrder;
  });

  const emailPayload = buildOrderEmailPayload(order);

  await Promise.all([
    attemptOrderEmail(
      "Failed to send customer order confirmation email.",
      {
        orderNumber: order.orderNumber,
        recipient: order.clientEmail,
      },
      async () => {
        await sendOrderConfirmationEmail(emailPayload);
      },
    ),
    attemptOrderEmail(
      "Failed to send admin new order email notification.",
      {
        orderNumber: order.orderNumber,
        recipient: "SUPPORT_EMAIL",
      },
      async () => {
        await sendAdminOrderNotificationEmail(emailPayload);
      },
    ),
  ]);

  return order;
}

export async function getOrdersByUserId(input: {
  userId: string;
  page: number;
  pageSize: number;
  status?: OrderStatus;
}) {
  const skip = (input.page - 1) * input.pageSize;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: {
        userId: input.userId,
        status: input.status,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: input.pageSize,
      include: {
        items: true,
      },
    }),
    prisma.order.count({
      where: {
        userId: input.userId,
        status: input.status,
      },
    }),
  ]);

  return {
    orders,
    total,
    totalPages: Math.max(1, Math.ceil(total / input.pageSize)),
  };
}

export async function getAdminOrders(input?: {
  query?: string;
  status?: OrderStatus;
  excludeStatus?: OrderStatus;
  page?: number;
  pageSize?: number;
}) {
  const page = Math.max(1, input?.page ?? 1);
  const pageSize = Math.max(1, input?.pageSize ?? 10);
  const skip = (page - 1) * pageSize;
  const where: Prisma.OrderWhereInput = {
    OR: input?.query
      ? [
          { orderNumber: { contains: input.query } },
          { clientName: { contains: input.query } },
          { clientEmail: { contains: input.query } },
        ]
      : undefined,
  };

  if (input?.status) {
    where.status = input.status;
  } else if (input?.excludeStatus) {
    where.status = {
      not: input.excludeStatus,
    };
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: pageSize,
      include: {
        items: true,
        user: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return {
    orders,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getAdminUnseenOrderCount(since: Date) {
  return prisma.order.count({
    where: {
      createdAt: {
        gt: since,
      },
    },
  });
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const existingOrder = await prisma.order.findUnique({
    where: {
      id: orderId,
    },
    include: {
      items: true,
    },
  });

  if (!existingOrder) {
    throw new Error("Order not found.");
  }

  if (existingOrder.status === status) {
    return existingOrder;
  }

  const order = await prisma.order.update({
    where: {
      id: orderId,
    },
    data: {
      status,
    },
    include: {
      items: true,
    },
  });

  await attemptOrderEmail(
    "Failed to send customer order status update email.",
    {
      orderNumber: order.orderNumber,
      status,
      recipient: order.clientEmail,
    },
    async () => {
      await sendOrderStatusUpdateEmail({
        orderNumber: order.orderNumber,
        customerName: order.clientName,
        customerEmail: order.clientEmail,
        status: order.status,
      });
    },
  );

  return order;
}
