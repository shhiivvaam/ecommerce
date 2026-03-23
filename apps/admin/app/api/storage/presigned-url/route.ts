import { NextResponse } from "next/server";
import { serverFetch, extractToken, toErrorResponse } from "@/lib/http";

/**
 * POST /api/storage/presigned-url
 * Forwards to NestJS POST /storage/presigned-url
 */
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const token = await extractToken(request);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { fileName, mimeType, folder } = body;

    if (!fileName || !mimeType) {
      return NextResponse.json(
        { error: "fileName and mimeType are required" },
        { status: 400 }
      );
    }

    const data = await serverFetch('/storage/presigned-url', {
      method: 'POST',
      token,
      body: {
        fileName,
        mimeType,
        folder
      }
    }) as { uploadUrl: string; publicUrl: string; filename: string };

    return NextResponse.json(data);
  } catch (error) {
    console.error('Presigned URL error:', error);
    const { status, message } = toErrorResponse(error);
    return NextResponse.json({ error: message }, { status });
  }
}
