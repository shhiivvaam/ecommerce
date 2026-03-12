import { NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/http";
import type { Banner } from "@repo/types";

// Revalidate banners every 5 minutes
export const revalidate = 300;

export async function GET(): Promise<NextResponse> {
    try {
        const res = await fetch("https://api.reyva.co.in/api/banners", {
            headers: { "Accept": "application/json" },
            next: { revalidate },
        });

        if (!res.ok) {
            const body = await res.text();
            throw new Error(`Failed to fetch banners: ${res.status} ${body}`);
        }

        const banners = (await res.json()) as Banner[];
        return NextResponse.json(banners);
    } catch (error) {
        const { status, message } = toErrorResponse(error);
        return NextResponse.json({ error: message }, { status });
    }
}
