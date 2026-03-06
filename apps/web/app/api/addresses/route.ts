import { NextResponse } from "next/server";
import { serverFetch, extractToken, toErrorResponse } from "@/lib/http";
import { Address } from "@repo/types";

export const dynamic = "force-dynamic";

// GET /api/addresses — list all addresses for user
export async function GET(request: Request): Promise<NextResponse> {
    const token = await extractToken(request);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const addresses = await serverFetch<Address[]>("/addresses", { token });
        return NextResponse.json(addresses);
    } catch (error) {
        const { status, message } = toErrorResponse(error);
        return NextResponse.json({ error: message }, { status });
    }
}

// POST /api/addresses — create a new address
export async function POST(request: Request): Promise<NextResponse> {
    const token = await extractToken(request);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await request.json();
        const address = await serverFetch<Address>("/addresses", {
            method: "POST",
            token,
            body,
        });
        return NextResponse.json(address, { status: 201 });
    } catch (error) {
        const { status, message } = toErrorResponse(error);
        return NextResponse.json({ error: message }, { status });
    }
}
