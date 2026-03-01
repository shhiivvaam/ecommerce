import { NextResponse } from "next/server";

// ✅ Use own backend API for products instead of external third-party URL.
// Falls back to the external URL only if NEXT_PUBLIC_API_URL is not set.
const FALLBACK_URL = "https://api.reyva.co.in/api/products";
const PRODUCTS_URL = process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL}/products`
    : (process.env.PRODUCTS_API_URL ?? FALLBACK_URL);

export async function GET(request: Request): Promise<NextResponse> {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") ?? "1";
    const limit = searchParams.get("limit") ?? "20";
    const search = searchParams.get("search") ?? "";
    const categoryId = searchParams.get("categoryId") ?? "";

    const url = new URL(PRODUCTS_URL);
    url.searchParams.set("page", page);
    url.searchParams.set("limit", limit);
    if (search) url.searchParams.set("search", search);
    if (categoryId) url.searchParams.set("categoryId", categoryId);

    try {
        const res = await fetch(url.toString(), {
            next: { revalidate: 60 }, // ISR: revalidate every 60 seconds
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
