import { NextResponse } from "next/server";
import { serverFetch, extractToken, toErrorResponse } from "@/lib/http";
import type { User } from "@repo/types";

export const dynamic = "force-dynamic";

// GET /api/users/me
export async function GET(request: Request): Promise<NextResponse> {
    const token = await extractToken(request);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const user = await serverFetch<User>("/users/me", { token });
        return NextResponse.json(user);
    } catch (error) {
        const { status, message } = toErrorResponse(error);
        return NextResponse.json({ error: message }, { status });
    }
}

// PATCH /api/users/me — update profile
export async function PATCH(request: Request): Promise<NextResponse> {
    const token = await extractToken(request);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await request.json();
        const user = await serverFetch<User>("/users/me", {
            method: "PATCH",
            token,
            body,
        });
        return NextResponse.json(user);
    } catch (error) {
        const { status, message } = toErrorResponse(error);
        return NextResponse.json({ error: message }, { status });
    }
}
