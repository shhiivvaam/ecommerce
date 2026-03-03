/**
 * Server-side HTTP wrapper for BFF → NestJS backend communication.
 * ONLY use this inside `apps/web/app/api/` Route Handlers — never in client components.
 *
 * Injects the shared internal secret so the backend can whitelist BFF traffic.
 * Throws a structured ApiError on non-2xx responses.
 */

// Internal server-to-server URL (e.g. http://api:3001 inside Docker / same VPC)
// Falls back to NEXT_PUBLIC_API_URL for local dev where backend is on localhost
const INTERNAL_API_BASE =
    process.env.INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:3001/api";

const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET;

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

/** Extract a Bearer token from an incoming Next.js request */
export function extractToken(request: Request): string | undefined {
    const authHeader = request.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
        return authHeader.slice(7);
    }
    // Also check cookie (httpOnly cookie set by auth route)
    const cookie = request.headers.get("cookie");
    const match = cookie?.match(/auth-token=([^;]+)/);
    return match?.[1];
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
