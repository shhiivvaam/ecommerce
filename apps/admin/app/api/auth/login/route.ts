import { NextResponse } from "next/server";
import { serverFetch, toErrorResponse } from "@/lib/http";
import type { AuthResponse, LoginCredentials } from "@repo/types";

export async function POST(request: Request): Promise<NextResponse> {
    try {
        const body: LoginCredentials = await request.json();

        const data = await serverFetch<AuthResponse>("/auth/login", {
            method: "POST",
            body,
        });

        return NextResponse.json(data);
    } catch (error) {
        const { status, message } = toErrorResponse(error);
        return NextResponse.json({ error: message }, { status });
    }
}
