import { NextResponse } from "next/server";
import { serverFetch, toErrorResponse } from "@/lib/http";
import type { AuthResponse, RegisterCredentials } from "@repo/types";

export async function POST(request: Request): Promise<NextResponse> {
    try {
        const body: RegisterCredentials = await request.json();

        const data = await serverFetch<AuthResponse>("/auth/register", {
            method: "POST",
            body,
        });

        // Set HttpOnly cookie so middleware can verify auth server-side.
        // Token is also returned in JSON body for Zustand store (client API calls).
        const response = NextResponse.json(data);
        response.cookies.set("customer-token", data.token, {
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
