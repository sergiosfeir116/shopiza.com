import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

import { AUTH_COOKIE_NAME } from "@/lib/constants";
import { env } from "@/lib/env";

const secret = new TextEncoder().encode(env.sessionSecret);

async function readSession(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as { role?: string };
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const session = await readSession(request);
  const pathname = request.nextUrl.pathname;

  const isAdminPath = pathname.startsWith("/admin");
  const isProtectedClientPath =
    pathname.startsWith("/account") || pathname.startsWith("/checkout");
  const isAuthPath = ["/login", "/register", "/verify"].some((route) =>
    pathname.startsWith(route),
  );

  if ((isAdminPath || isProtectedClientPath) && !session) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminPath && session?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (session?.role === "ADMIN" && !isAdminPath) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  if (isAuthPath && session?.role === "CLIENT") {
    return NextResponse.redirect(new URL("/account/orders", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|media/products).*)",
  ],
};
