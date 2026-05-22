import { PrismaClient, type OrderStatus } from "@prisma/client";

import { hashPassword } from "@/lib/auth/password";
import {
  calculateDiscountedPriceCents,
  generateOrderNumber,
  normalizeEmail,
  normalizePhoneNumber,
  normalizeUsername,
  slugify,
} from "@/lib/utils";

const prisma = new PrismaClient();

export const DEFAULT_ADMIN_PASSWORD = "ShopizajAdmin#2026!";
const DEFAULT_CLIENT_PASSWORD = "ShopizajClient#2026!";

const sectionBlueprints = [
  {
    name: "Smartphones",
    description: "Flagship phones, camera-first devices, and reliable everyday picks.",
    products: [
      ["Aurora X1 Pro", "A refined flagship smartphone with an LTPO display, all-day battery life, and a pro-grade camera system.", 1299, 18],
      ["Pulse Mini 5G", "Compact 5G performance with bright OLED visuals and dependable battery life for daily use.", 699, 24],
      ["Nimbus Fold Air", "A premium foldable with multitasking software, vibrant inner display, and polished hinge engineering.", 1599, 8],
      ["Metro Lite Max", "A value-focused device with a large display, clean software, and strong battery endurance.", 429, 30],
      ["Echo Cam Ultra", "Built for creators with advanced night mode, stabilized video, and generous internal storage.", 1049, 12],
      ["Vertex Neo", "Fast, durable, and designed for modern productivity with Wi-Fi 7 and secure biometric access.", 899, 16],
    ],
  },
  {
    name: "Laptops",
    description: "Productivity machines, creative workstations, and portable everyday laptops.",
    products: [
      ["StudioBook Carbon 14", "A premium ultrabook with a crisp 3K display, lightweight build, and quiet performance.", 1499, 10],
      ["CreatorForge 16", "A workstation-class laptop tuned for editing, design, and intensive multitasking.", 2199, 6],
      ["Voyage Air 13", "A thin-and-light everyday laptop with excellent battery life and a comfortable keyboard.", 999, 20],
      ["Pulse Gaming 15", "A gaming laptop with high-refresh visuals, strong cooling, and desktop-class responsiveness.", 1799, 11],
      ["Nimbus Flex 2-in-1", "A convertible touchscreen laptop for notes, media, and hybrid work.", 1199, 14],
      ["MetroBook Student", "An affordable laptop with fast startup times and practical all-day mobility.", 649, 26],
    ],
  },
  {
    name: "Audio",
    description: "Premium headphones, speakers, and smart listening essentials.",
    products: [
      ["Halo Noise-Cancel Headphones", "Deep active noise cancellation, refined tuning, and a travel-ready foldable design.", 349, 22],
      ["WaveFit Earbuds Pro", "Compact earbuds with strong ANC, clear voice pickup, and fast wireless charging.", 189, 40],
      ["RoomTone Speaker X", "A premium home speaker with rich detail, wide stereo presentation, and multi-room support.", 279, 18],
      ["BassDock Party Speaker", "High-output portable speaker built for outdoor sessions and late-night playlists.", 229, 15],
      ["StudioMic USB", "A broadcast-style USB microphone for podcasts, streaming, and crystal-clear calls.", 149, 17],
      ["QuietLine Office Headset", "A lightweight headset optimized for focus, meetings, and long work sessions.", 119, 0],
    ],
  },
  {
    name: "Gaming",
    description: "Consoles, accessories, and gaming gear for competitive and casual play.",
    products: [
      ["Apex Core Controller", "A precision controller with textured grips, adaptive triggers, and elite ergonomics.", 89, 28],
      ["Nova RGB Mechanical Keyboard", "A fast mechanical keyboard with hot-swap switches and polished acoustics.", 159, 21],
      ["ZeroLag Pro Mouse", "A lightweight wireless gaming mouse with accurate tracking and low-latency clicks.", 99, 34],
      ["FrameRush 27 Monitor", "A 27-inch QHD monitor with rapid refresh, low ghosting, and vivid color.", 399, 13],
      ["CloudSeat Gaming Chair", "A supportive chair with refined cushioning and long-session comfort.", 329, 9],
      ["PulsePad XL Desk Mat", "A full-desk gaming surface with stitched edges and smooth glide.", 39, 55],
    ],
  },
  {
    name: "Smart Home",
    description: "Connected devices for comfort, security, and modern routines.",
    products: [
      ["Luma Smart Lamp", "A dimmable ambient lamp with scene presets, scheduling, and voice control.", 79, 32],
      ["SecureCam 360", "A home security camera with pan-and-tilt tracking, clear night vision, and motion alerts.", 149, 19],
      ["Breeze Thermostat+", "A smart thermostat with learning schedules and energy-saving insights.", 199, 12],
      ["Aura Doorbell View", "A sleek video doorbell with fast notifications and crisp two-way audio.", 179, 14],
      ["CleanBot Mini", "A compact robot vacuum with smart mapping and strong suction for apartments.", 299, 7],
      ["PureMist Air Care", "A connected humidifier and purifier built for quieter and cleaner living spaces.", 249, 10],
    ],
  },
  {
    name: "Fashion",
    description: "Premium lifestyle pieces and accessories with a clean modern edge.",
    products: [
      ["Monarch Weekender Bag", "A structured travel bag with premium hardware, smart compartments, and durable fabric.", 189, 16],
      ["Linea Leather Wallet", "A slim everyday wallet finished with full-grain leather and precise stitching.", 79, 42],
      ["Orbit Smart Watchband", "A comfortable performance strap with a secure fit and premium finish.", 49, 65],
      ["Vista Sunglasses", "A lightweight unisex frame with polarized lenses and elevated detailing.", 139, 25],
      ["CloudStep Sneakers", "Responsive, street-ready sneakers designed for comfort and clean styling.", 159, 18],
      ["Metro Essentials Hoodie", "A heavyweight premium hoodie with a soft brushed interior and tailored silhouette.", 99, 24],
    ],
  },
];

const sampleUsers = [
  ["Layla Mansour", "layla_m", "layla@example.com", "+96170111222"],
  ["Omar Nassar", "omar_n", "omar@example.com", "+96170999111"],
  ["Mia Haddad", "mia_h", "mia@example.com", "+96176555333"],
  ["Karim Tabet", "karim_t", "karim@example.com", "+96181000444"],
  ["Rita Saliba", "rita_s", "rita@example.com", "+96131336555"],
  ["Nadim Khoury", "nadim_k", "nadim@example.com", "+96181222666"],
];

async function main() {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartReservationItem.deleteMany();
  await prisma.cartReservation.deleteMany();
  await prisma.discount.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.section.deleteMany();
  await prisma.passwordResetCode.deleteMany();
  await prisma.verificationCode.deleteMany();
  await prisma.contactMessage.deleteMany();
  await prisma.rateLimitEvent.deleteMany();
  await prisma.securityEvent.deleteMany();
  await prisma.user.deleteMany();

  const adminPasswordHash = await hashPassword(DEFAULT_ADMIN_PASSWORD);
  const clientPasswordHash = await hashPassword(DEFAULT_CLIENT_PASSWORD);

  const admin = await prisma.user.create({
    data: {
      fullName: "Shopizaj Admin",
      username: "admin",
      usernameNormalized: normalizeUsername("admin"),
      email: "charbel.g.andraos@gmail.com",
      emailNormalized: normalizeEmail("charbel.g.andraos@gmail.com"),
      phoneNumber: "+9613118776",
      phoneNumberNormalized: normalizePhoneNumber("+9613118776"),
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      emailVerified: true,
      phoneVerified: true,
      locationAccessGranted: false,
      locationLabel: null,
      locationLatitude: null,
      locationLongitude: null,
    },
  });

  const users = await Promise.all(
    sampleUsers.map(async ([fullName, username, email, phoneNumber], index) =>
      prisma.user.create({
        data: {
          fullName,
          username,
          usernameNormalized: normalizeUsername(username),
          email,
          emailNormalized: normalizeEmail(email),
          phoneNumber,
          phoneNumberNormalized: normalizePhoneNumber(phoneNumber),
          passwordHash: clientPasswordHash,
          role: "CLIENT",
          emailVerified: true,
          phoneVerified: true,
          locationAccessGranted: true,
          locationLabel: [
            "Beirut, Downtown",
            "Jounieh, Seaside",
            "Tripoli, El Mina",
            "Saida, Old City",
            "Zahle, Boulevard",
            "Batroun, Harbour",
          ][index],
          locationLatitude: 33.88 + index * 0.03,
          locationLongitude: 35.5 + index * 0.04,
        },
      }),
    ),
  );

  const sectionRecords = await Promise.all(
    sectionBlueprints.map((section) =>
      prisma.section.create({
        data: {
          name: section.name,
          slug: slugify(section.name),
          description: section.description,
        },
      }),
    ),
  );

  const allProducts: Array<{
    id: string;
    name: string;
    priceCents: number;
    sectionId: string | null;
    mainImage: string;
  }> = [];

  for (const [sectionIndex, section] of sectionBlueprints.entries()) {
    const sectionRecord = sectionRecords[sectionIndex];

    for (const [productIndex, product] of section.products.entries()) {
      const [name, description, price, stock] = product as [
        string,
        string,
        number,
        number,
      ];
      const slug = slugify(name);
      const priceCents = price * 100;
      const mainImage = `/media/products/${slug}/1`;
      const createdProduct = await prisma.product.create({
        data: {
          name,
          slug,
          description,
          priceCents,
          stock,
          archived: false,
          sectionId: sectionRecord.id,
          images: {
            create: [1, 2, 3].map((variant) => ({
              imageUrl: `/media/products/${slug}/${variant}`,
              altText: `${name} image ${variant}`,
              isMain: variant === 1,
              sortOrder: variant - 1,
            })),
          },
        },
        include: {
          images: true,
        },
      });

      allProducts.push({
        id: createdProduct.id,
        name: createdProduct.name,
        priceCents,
        sectionId: sectionRecord.id,
        mainImage,
      });

      if ((productIndex + sectionIndex) % 4 === 0) {
        const value = productIndex % 2 === 0 ? 15 : 20;
        await prisma.discount.create({
          data: {
            productId: createdProduct.id,
            type: "PERCENTAGE",
            value,
            discountedPriceCents: calculateDiscountedPriceCents(
              priceCents,
              "PERCENTAGE",
              value,
            ),
            startAt: new Date(Date.now() - 1000 * 60 * 60 * 6),
            endAt: new Date(Date.now() + 1000 * 60 * 60 * 48),
            isActive: true,
          },
        });
      }

      if ((productIndex + sectionIndex) % 5 === 0) {
        const fixedDiscountDollars = 25;
        await prisma.discount.create({
          data: {
            productId: createdProduct.id,
            type: "FIXED_AMOUNT",
            value: fixedDiscountDollars * 100,
            discountedPriceCents: calculateDiscountedPriceCents(
              priceCents,
              "FIXED_AMOUNT",
              fixedDiscountDollars * 100,
            ),
            startAt: new Date(Date.now() - 1000 * 60 * 60 * 72),
            endAt: new Date(Date.now() - 1000 * 60 * 60 * 4),
            isActive: false,
          },
        });
      }
    }
  }

  await prisma.product.create({
    data: {
      name: "Archived Showcase Camera",
      slug: "archived-showcase-camera",
      description: "A premium camera body kept as an archived catalog sample for admin reassignment tests.",
      priceCents: 119900,
      stock: 4,
      archived: true,
      sectionId: null,
      images: {
        create: [1, 2].map((variant) => ({
          imageUrl: `/media/products/archived-showcase-camera/${variant}`,
          altText: `Archived Showcase Camera image ${variant}`,
          isMain: variant === 1,
          sortOrder: variant - 1,
        })),
      },
    },
  });

  const orderStatuses: OrderStatus[] = [
    "PENDING",
    "IN_PROGRESS",
    "ON_THE_WAY",
    "DELIVERED",
    "PENDING",
    "DELIVERED",
  ];

  for (const [index, user] of users.entries()) {
    const firstProduct = allProducts[(index * 2) % allProducts.length];
    const secondProduct = allProducts[(index * 2 + 1) % allProducts.length];
    const quantityOne = 1 + (index % 2);
    const quantityTwo = 1;
    const totalPriceCents =
      firstProduct.priceCents * quantityOne + secondProduct.priceCents * quantityTwo;

    await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId: user.id,
        clientName: user.fullName,
        clientEmail: user.email,
        clientPhoneNumber: user.phoneNumber,
        totalPriceCents,
        status: orderStatuses[index],
        destinationLocation: user.locationLabel ?? "Beirut, Lebanon",
        destinationLatitude: user.locationLatitude,
        destinationLongitude: user.locationLongitude,
        paymentMethod: "CASH_ON_DELIVERY",
        items: {
          create: [
            {
              productId: firstProduct.id,
              productNameSnapshot: firstProduct.name,
              quantity: quantityOne,
              unitPriceSnapshotCents: firstProduct.priceCents,
              totalPriceSnapshotCents: firstProduct.priceCents * quantityOne,
              mainImageSnapshot: firstProduct.mainImage,
            },
            {
              productId: secondProduct.id,
              productNameSnapshot: secondProduct.name,
              quantity: quantityTwo,
              unitPriceSnapshotCents: secondProduct.priceCents,
              totalPriceSnapshotCents: secondProduct.priceCents * quantityTwo,
              mainImageSnapshot: secondProduct.mainImage,
            },
          ],
        },
      },
    });
  }

  await prisma.contactMessage.createMany({
    data: [
      {
        name: "Sara Youssef",
        email: "sara@example.com",
        phoneNumber: "+96176666555",
        message: "Do you restock the Halo Noise-Cancel Headphones in silver soon?",
      },
      {
        name: "Jad Farah",
        email: "jad@example.com",
        phoneNumber: "+96133111222",
        message: "I want a bulk order quote for office headsets and microphones.",
      },
    ],
  });

  console.info(`Seed complete. Admin username: admin`);
  console.info(`Seed complete. Admin email: ${admin.email}`);
  console.info(`Seed complete. Admin password: ${DEFAULT_ADMIN_PASSWORD}`);
  console.info(`Seed complete. Sample client password: ${DEFAULT_CLIENT_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
