import { NextResponse } from "next/server";
import { serverFetch, toErrorResponse } from "@/lib/http";
import type { Banner } from "@repo/types";

// Revalidate banners every 5 minutes
export const revalidate = 300;

export async function GET(): Promise<NextResponse> {
    try {
        const banners = await serverFetch<Banner[]>("/banners");
        return NextResponse.json(banners);
    } catch (error) {
        const { status, message } = toErrorResponse(error);
        return NextResponse.json({ error: message }, { status });
    }
}
