import { NextResponse } from "next/server";
import { toErrorResponse, extractToken } from "@/lib/http";

export const dynamic = "force-dynamic";

const INTERNAL_API_BASE =
    process.env.INTERNAL_API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://127.0.0.1:5000/api";

const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET || "dev-secret-key";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ jobId: string }> },
): Promise<NextResponse> {
    const token = await extractToken(request);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { jobId } = await params;
        const response = await fetch(
            `${INTERNAL_API_BASE}/products/import/${jobId}`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "X-Internal-Secret": INTERNAL_SECRET,
                },
                cache: "no-store",
            },
        );

        if (!response.ok) {
            return NextResponse.json(
                { error: `Backend returned ${response.status}` },
                { status: response.status },
            );
        }

        const result = await response.json();
        return NextResponse.json(result);
    } catch (error) {
        const { status, message } = toErrorResponse(error);
        return NextResponse.json({ error: message }, { status });
    }
}
