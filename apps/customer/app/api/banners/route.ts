import { NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/http";
import type { Banner } from "@repo/types";

// Raw shape returned by https://api.reyva.co.in/api/banners
interface RawBanner {
    id: string;
    imageUrl: string;
    linkUrl?: string;
    link?: string;
    title: string;
    subtitle?: string;
    isActive?: boolean;
    active?: boolean;
    createdAt: string;
    updatedAt?: string;
}

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

        const raw = (await res.json()) as RawBanner[];

        // Normalize to our canonical Banner shape
        const banners: Banner[] = raw.map((b) => ({
            id: b.id,
            title: b.title,
            subtitle: b.subtitle,
            imageUrl: b.imageUrl,
            link: b.link ?? b.linkUrl,
            active: b.active ?? b.isActive ?? false,
            createdAt: b.createdAt,
        }));

        return NextResponse.json(banners);
    } catch (error) {
        const { status, message } = toErrorResponse(error);
        return NextResponse.json({ error: message }, { status });
    }
}
