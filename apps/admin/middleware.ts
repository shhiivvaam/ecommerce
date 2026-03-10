import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decodeJwt } from "jose";

/**
 * Admin app middleware — server-side route protection.
 *
 * Security model:
 *  - Reads the `admin-token` HttpOnly cookie set by the BFF login route.
 *  - Decodes (does NOT verify) the JWT to read the `role` claim for routing.
 *  - NestJS verifies the JWT signature and expiry on every actual API call.
 *    Any expired / tampered token will cause a 401 → client interceptor logs out.
 *
 * Why decode-only? The JWT_SECRET lives in the NestJS environment. Duplicating
 * it into every Next.js app creates drift risk. Verification is already enforced
 * at the API layer, so middleware only needs the role claim for correct routing.
 *
 * Allowed roles: SUPERADMIN | ADMIN | EDITOR | SUPPORT
 */

const ADMIN_ROLES = new Set(["SUPERADMIN", "ADMIN", "EDITOR", "SUPPORT"]);

// Routes that never require auth
const PUBLIC_PATHS = ["/login", "/api/", "/_next/", "/favicon.ico", "/fonts/"];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get("admin-token")?.value;

  // No cookie — redirect to login
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    // Decode without verification — NestJS verifies on every API call
    const payload = decodeJwt(token);
    const role = payload.role as string | undefined;

    if (!role || !ADMIN_ROLES.has(role)) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("error", "unauthorized");
      return NextResponse.redirect(loginUrl);
    }

    const response = NextResponse.next();
    response.headers.set("x-user-role", role);
    return response;
  } catch {
    // Token is completely malformed (not a valid JWT at all)
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete("admin-token");
    return response;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)" ],
};
