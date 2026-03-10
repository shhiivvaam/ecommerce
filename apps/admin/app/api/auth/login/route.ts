import { NextResponse } from "next/server";
import { serverFetch, toErrorResponse } from "@/lib/http";
import type { AuthResponse, LoginCredentials } from "@repo/types";

const ADMIN_ROLES = new Set(["SUPERADMIN", "ADMIN", "EDITOR", "SUPPORT"]);

export async function POST(request: Request): Promise<NextResponse> {
    try {
        const body: LoginCredentials = await request.json();

        const data = await serverFetch<AuthResponse>("/auth/login", {
            method: "POST",
            body,
        });

        // Role enforcement at BFF level — reject non-admin accounts
        if (!data.user?.role || !ADMIN_ROLES.has(data.user.role)) {
            return NextResponse.json(
                { error: "Access denied. This portal is for admin staff only." },
                { status: 403 }
            );
        }

        // Set an HttpOnly cookie so middleware can verify auth server-side.
        // The token is also returned in the JSON body for the Zustand store (client API calls).
        const response = NextResponse.json(data);
        response.cookies.set("admin-token", data.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60, // 7 days — matches JWT expiry
            path: "/",
        });

        return response;
    } catch (error) {
        const { status, message } = toErrorResponse(error);
        return NextResponse.json({ error: message }, { status });
    }
}
