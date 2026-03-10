import { NextResponse } from "next/server";
import { serverFetch, toErrorResponse } from "@/lib/http";
import type { StoreSettings } from "@repo/types";

// Settings almost never change — cache for 10 minutes
export const revalidate = 600;

export async function GET(): Promise<NextResponse> {
    try {
        const settings = await serverFetch<StoreSettings>("/settings");
        return NextResponse.json(settings);
    } catch (error) {
        const { status, message } = toErrorResponse(error);
        return NextResponse.json({ error: message }, { status });
    }
}
