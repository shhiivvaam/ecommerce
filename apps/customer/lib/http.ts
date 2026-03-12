/**
 * Server-side HTTP wrapper for BFF → NestJS backend communication.
 * ONLY use this inside `apps/customer/app/api/` Route Handlers — never in client components.
 *
 * Injects the shared internal secret so the backend can whitelist BFF traffic.
 * Throws a structured ApiError on non-2xx responses.
 */

// Server-to-server base URL. Override via INTERNAL_API_URL in .env.local for Docker / prod.
// Local dev default: NestJS runs on port 3001.
const INTERNAL_API_BASE =
    process.env.INTERNAL_API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://127.0.0.1:3001/api";

const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET || "dev-secret-key";

export class ApiError extends Error {
    constructor(
        public readonly status: number,
        public readonly body: unknown,
        message?: string,
    ) {
        super(message ?? `API Error ${status}`);
        this.name = "ApiError";
    }
}

export interface ServerFetchOptions extends Omit<RequestInit, "body"> {
    /** Optional Bearer token to forward (for authenticated BFF routes) */
    token?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body?: any;
}

export async function serverFetch<T = unknown>(
    path: string,
    { token, body, headers: extraHeaders, ...init }: ServerFetchOptions = {},
): Promise<T> {
    const url = `${INTERNAL_API_BASE}${path.startsWith("/") ? path : `/${path}`}`;

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(extraHeaders as Record<string, string>),
    };

    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (INTERNAL_SECRET) headers["X-Internal-Secret"] = INTERNAL_SECRET;

    const response = await fetch(url, {
        ...init,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        // Never cache server-to-server calls by default; individual routes opt-in
        cache: init.cache ?? "no-store",
    });

    if (!response.ok) {
        let errorBody: unknown;
        try {
            errorBody = await response.json();
        } catch {
            errorBody = { message: response.statusText };
        }
        throw new ApiError(response.status, errorBody);
    }

    // Handle 204 No Content
    if (response.status === 204) return undefined as T;

    return response.json() as Promise<T>;
}

import { cookies } from "next/headers";

/** Extract a Bearer token from an incoming Next.js request */
export async function extractToken(request: Request): Promise<string | undefined> {
    const authHeader = request.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
        return authHeader.slice(7);
    }
    // Check Next.js 15 cookies API
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get("customer-token");
    return tokenCookie?.value;
}

/** Build a standardised error NextResponse from an unknown thrown value */
export function toErrorResponse(error: unknown): { status: number; message: string } {
    if (error instanceof ApiError) {
        const msg =
            typeof error.body === "object" &&
                error.body !== null &&
                "message" in error.body
                ? String((error.body as Record<string, unknown>).message)
                : error.message;
        return { status: error.status, message: msg };
    }
    return { status: 500, message: "Internal Server Error" };
}
