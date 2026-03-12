import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decodeJwt } from "jose";

/**
 * Customer app middleware — server-side route protection.
 *
 * Security model:
 *  - Reads the `customer-token` HttpOnly cookie set by the BFF login route.
 *  - Decodes (does NOT verify) the JWT to read the `role` claim for routing.
 *  - NestJS verifies the JWT signature and expiry on every actual API call.
 *    Any expired / tampered token causes a 401 → client interceptor logs out.
 *
 * Why decode-only? Same reason as admin middleware — JWT_SECRET lives in
 * the NestJS environment. Verification is already enforced at the API layer.
 *
 * Protected routes: /dashboard/*, /cart/*, /checkout/*
 * All storefront browse pages (products, search, home) remain public.
 * Allowed role: CUSTOMER only.
 */

const PROTECTED_PREFIXES = ["/dashboard", "/cart", "/checkout"];

const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/api/",
  "/_next/",
  "/favicon.ico",
  "/fonts/",
  "/products",
  "/search",
  "/gift-cards",
];

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
}

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths are always allowed through
  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  // Only guard protected routes — everything else is open (/, /about, etc.)
  if (!isProtected(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get("customer-token")?.value;

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    // Decode without verification — NestJS verifies on every API call
    const payload = decodeJwt(token);
    const role = payload.role as string | undefined;

    if (role !== "CUSTOMER") {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("error", "admin_account");
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  } catch {
    // Completely malformed JWT — clear cookie and redirect
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete("customer-token");
    return response;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
