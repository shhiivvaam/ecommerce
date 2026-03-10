import { NextResponse } from "next/server";
import { serverFetch, extractToken, toErrorResponse } from "@/lib/http";

export async function POST(request: Request): Promise<NextResponse> {
    const token = await extractToken(request);

    try {
        if (token) {
            // Best-effort: tell the backend to record the logout
            await serverFetch("/auth/logout", {
                method: "POST",
                token,
            }).catch(() => {
                // Ignore server errors — client state must always be cleared
            });
        }

        // Clear the HttpOnly customer-token cookie
        const response = NextResponse.json({ success: true });
        response.cookies.set("customer-token", "", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 0,
            path: "/",
        });
        return response;
    } catch (error) {
        const { status, message } = toErrorResponse(error);
        return NextResponse.json({ error: message }, { status });
    }
}
