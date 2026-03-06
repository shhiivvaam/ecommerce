import { NextResponse } from "next/server";
import { serverFetch, extractToken, toErrorResponse } from "@/lib/http";

export async function POST(request: Request): Promise<NextResponse> {
    const token = await extractToken(request);

    try {
        if (token) {
            // Best-effort: tell the backend to invalidate the token
            await serverFetch("/auth/logout", {
                method: "POST",
                token,
            }).catch(() => {
                // Ignore server errors — client-side state must always be cleared
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        const { status, message } = toErrorResponse(error);
        return NextResponse.json({ error: message }, { status });
    }
}
