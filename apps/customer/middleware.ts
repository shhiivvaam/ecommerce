import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

/**
 * Customer app middleware — server-side route protection.
 *
 * Runs on the Edge before any page renders. Only /dashboard/* routes
 * are protected. Public-facing pages (products, home, login) are open.
 *
 * Allowed role: CUSTOMER only.
 * Admin roles are rejected — they must use the admin portal.
 */

// Routes that require authentication
const PROTECTED_PREFIXES = ["/dashboard"];

// Routes always allowed through (no auth check)
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
  "/cart",
  "/checkout",
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

  // Only protect dashboard routes — everything else is open
  if (!isProtected(pathname) || isPublic(pathname)) {
    return NextResponse.next();
  }

  const token =
    request.cookies.get("customer-token")?.value ??
    request.headers.get("authorization")?.replace("Bearer ", "");

  // No token — redirect to login with callback
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || "fallback-secret"
    );
    const { payload } = await jwtVerify(token, secret);
    const role = payload.role as string | undefined;

    // Must be a CUSTOMER — admin accounts use the admin portal
    if (role !== "CUSTOMER") {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("error", "admin_account");
      return NextResponse.redirect(loginUrl);
    }

    // Valid customer — let through
    return NextResponse.next();
  } catch {
    // Token invalid or expired
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    loginUrl.searchParams.set("error", "session_expired");
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete("customer-token");
    return response;
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
