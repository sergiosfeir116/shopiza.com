import "server-only";

import { Prisma } from "@prisma/client";

import { FEATURED_PRODUCT_LIMIT, FEATURED_SECTION_LIMIT } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { getMainImage, isDiscountActive } from "@/lib/utils";

const productCardArgs = Prisma.validator<Prisma.ProductDefaultArgs>()({
  include: {
    section: true,
    images: true,
    discounts: true,
  },
});

export type ProductCardRecord = Prisma.ProductGetPayload<typeof productCardArgs>;

export function decorateProduct(product: ProductCardRecord) {
  const activeDiscount =
    product.discounts
      .filter(isDiscountActive)
      .sort((left, right) => left.endAt.getTime() - right.endAt.getTime())[0] ?? null;
  const mainImage = getMainImage(product.images);

  return {
    ...product,
    activeDiscount,
    mainImage,
    effectivePriceCents: activeDiscount?.discountedPriceCents ?? product.priceCents,
    isOutOfStock: product.stock <= 0,
  };
}

export async function getHomepageData() {
  const [sections, featuredProducts, discountedProducts] = await Promise.all([
    prisma.section.findMany({
      take: FEATURED_SECTION_LIMIT,
      orderBy: {
        createdAt: "asc",
      },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    }),
    prisma.product.findMany({
      where: {
        archived: false,
      },
      take: FEATURED_PRODUCT_LIMIT,
      orderBy: {
        createdAt: "desc",
      },
      ...productCardArgs,
    }),
    prisma.product.findMany({
      where: {
        archived: false,
        discounts: {
          some: {
            isActive: true,
          },
        },
      },
      take: FEATURED_PRODUCT_LIMIT,
      orderBy: {
        updatedAt: "desc",
      },
      ...productCardArgs,
    }),
  ]);

  return {
    sections,
    featuredProducts: featuredProducts.map(decorateProduct),
    discountedProducts: discountedProducts
      .map(decorateProduct)
      .filter((product) => product.activeDiscount),
  };
}

export async function listProducts(input?: {
  query?: string;
  sectionSlug?: string;
  archived?: boolean;
}) {
  const section =
    input?.sectionSlug
      ? await prisma.section.findUnique({
          where: {
            slug: input.sectionSlug,
          },
          select: {
            id: true,
            slug: true,
            name: true,
          },
        })
      : null;

  const products = await prisma.product.findMany({
    where: {
      archived: input?.archived ?? false,
      sectionId: input?.sectionSlug ? section?.id ?? "__missing__" : undefined,
      OR: input?.query
        ? [
            { name: { contains: input.query } },
            { description: { contains: input.query } },
          ]
        : undefined,
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    ...productCardArgs,
  });

  return {
    section,
    products: products.map(decorateProduct),
  };
}

export async function getStoreSections() {
  return prisma.section.findMany({
    orderBy: {
      name: "asc",
    },
    include: {
      _count: {
        select: {
          products: {
            where: {
              archived: false,
            },
          },
        },
      },
    },
  });
}

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findUnique({
    where: {
      slug,
    },
    ...productCardArgs,
  });

  if (!product) {
    return null;
  }

  const relatedProducts = await prisma.product.findMany({
    where: {
      archived: false,
      sectionId: product.sectionId,
      id: {
        not: product.id,
      },
    },
    take: 4,
    orderBy: {
      updatedAt: "desc",
    },
    ...productCardArgs,
  });

  return {
    product: decorateProduct(product),
    relatedProducts: relatedProducts.map(decorateProduct),
  };
}

export async function getAdminDashboardSnapshot() {
  const [products, sections, orders, discounts, recentOrders] = await Promise.all([
    prisma.product.count(),
    prisma.section.count(),
    prisma.order.count(),
    prisma.discount.count(),
    prisma.order.findMany({
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
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
  ]);

  return {
    counts: {
      products,
      sections,
      orders,
      discounts,
    },
    recentOrders,
  };
}

export async function getAdminProducts(input?: {
  query?: string;
  page?: number;
  pageSize?: number;
}) {
  const page = Math.max(1, input?.page ?? 1);
  const pageSize = Math.max(1, input?.pageSize ?? 12);
  const skip = (page - 1) * pageSize;
  const where = input?.query
    ? {
        OR: [
          { name: { contains: input.query } },
          { description: { contains: input.query } },
        ],
      }
    : undefined;

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: {
        updatedAt: "desc",
      },
      skip,
      take: pageSize,
      ...productCardArgs,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products: products.map(decorateProduct),
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getAdminProductById(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    ...productCardArgs,
  });

  return product ? decorateProduct(product) : null;
}
