import { NextResponse } from "next/server";

const EXTERNAL_PRODUCTS_URL =
    process.env.PRODUCTS_API_URL ?? "https://api.reyva.co.in/api/products";

export async function GET() {
    try {
        const res = await fetch(EXTERNAL_PRODUCTS_URL, {
            // Disable Next.js fetch caching so you always get fresh data
            cache: "no-store",
        });

        if (!res.ok) {
            return NextResponse.json(
                { error: "Failed to fetch products" },
                { status: res.status }
            );
        }

        const data = await res.json();
        return NextResponse.json(data, { status: 200 });
    } catch (error) {
        console.error("Error fetching products:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
