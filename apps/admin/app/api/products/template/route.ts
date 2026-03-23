import { NextResponse } from "next/server";
import { extractToken } from "@/lib/http";

export const dynamic = "force-dynamic";

const INTERNAL_API_BASE =
    process.env.INTERNAL_API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://127.0.0.1:5000/api";

const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET || "dev-secret-key";

export async function GET(request: Request): Promise<NextResponse> {
    const token = await extractToken(request);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const response = await fetch(`${INTERNAL_API_BASE}/products/template`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                "X-Internal-Secret": INTERNAL_SECRET,
            },
            cache: "no-store",
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: `Backend returned ${response.status}` },
                { status: response.status },
            );
        }

        // Stream the XLSX back to the browser with correct headers
        const buffer = await response.arrayBuffer();
        return new NextResponse(buffer, {
            status: 200,
            headers: {
                "Content-Type":
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition":
                    'attachment; filename="product_import_template.xlsx"',
            },
        });
    } catch {
        return NextResponse.json({ error: "Failed to fetch template" }, { status: 500 });
    }
}
