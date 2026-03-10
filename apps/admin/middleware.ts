import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

/**
 * Admin app middleware — server-side route protection.
 *
 * Runs on the Edge before any page renders. Checks for a valid
 * `admin-token` HttpOnly cookie. All /admin/* routes are protected.
 *
 * Allowed roles for the admin portal:
 *   SUPERADMIN | ADMIN | EDITOR | SUPPORT
 *
 * CUSTOMER accounts are explicitly rejected.
 */

const ADMIN_ROLES = new Set(["SUPERADMIN", "ADMIN", "EDITOR", "SUPPORT"]);

// Routes that don't require authentication
const PUBLIC_PATHS = ["/login", "/api/", "/_next/", "/favicon.ico", "/fonts/"];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes through
  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  const token =
    request.cookies.get("admin-token")?.value ??
    request.headers.get("authorization")?.replace("Bearer ", "");

  // No token — redirect to login
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verify JWT and check role
  try {
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || "fallback-secret"
    );
    const { payload } = await jwtVerify(token, secret);
    const role = payload.role as string | undefined;

    // Valid token but not an admin role → show access denied
    if (!role || !ADMIN_ROLES.has(role)) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("error", "unauthorized");
      return NextResponse.redirect(loginUrl);
    }

    // All good — let the request through with role header for SSR use
    const response = NextResponse.next();
    response.headers.set("x-user-role", role);
    return response;
  } catch {
    // Token is invalid or expired
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "session_expired");
    const response = NextResponse.redirect(loginUrl);
    // Clear the bad cookie
    response.cookies.delete("admin-token");
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
