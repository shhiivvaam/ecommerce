import { NextResponse } from "next/server";
import { toErrorResponse, extractToken } from "@/lib/http";

export const dynamic = "force-dynamic";

const INTERNAL_API_BASE =
    process.env.INTERNAL_API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://127.0.0.1:5000/api";

const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET || "dev-secret-key";

export async function POST(request: Request): Promise<NextResponse> {
    const token = await extractToken(request);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const inputForm = await request.formData();
        const file = inputForm.get("file") as File | null;
        if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

        // Native Node 18 fetch cannot correctly serialize Next.js Edge 'File' objects, so we MUST 
        // buffer it into memory and wrap it in a pure Blob to preserve exact binary integrity over the proxy.
        const buffer = Buffer.from(await file.arrayBuffer());
        const blob = new Blob([buffer], { type: file.type });

        const outForm = new FormData();
        outForm.append("file", blob, file.name);

        const response = await fetch(`${INTERNAL_API_BASE}/products/import`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "X-Internal-Secret": INTERNAL_SECRET,
                // fetch automatically generates the multipart boundary
            },
            body: outForm,
            cache: "no-store",
        });

        if (!response.ok) {
            let errorBody: unknown;
            try {
                errorBody = await response.json();
            } catch {
                errorBody = { message: response.statusText };
            }
            const message =
                typeof errorBody === "object" &&
                errorBody !== null &&
                "message" in errorBody
                    ? String((errorBody as Record<string, unknown>).message)
                    : response.statusText;
            return NextResponse.json({ error: message }, { status: response.status });
        }

        const result = await response.json();
        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        const { status, message } = toErrorResponse(error);
        return NextResponse.json({ error: message }, { status });
    }
}
