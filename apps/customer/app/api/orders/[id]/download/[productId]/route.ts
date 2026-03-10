import { NextResponse } from "next/server";
import { serverFetch, extractToken, toErrorResponse } from "@/lib/http";
import { FileDownloadResponse } from "@/types/api-responses";

interface Params {
  params: Promise<{ id: string; productId: string }>;
}

/**
 * GET /api/orders/[id]/download/[productId] - Download digital product
 * Forwards to NestJS GET /orders/:id/download/:productId
 */
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: Params
): Promise<NextResponse> {
  try {
    const token = await extractToken(request);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, productId } = await params;

    // Check if the order contains the digital product and is eligible for download
    const data = await serverFetch(`/orders/${id}/download/${productId}`, {
      token,
    }) as FileDownloadResponse;

    // If the response is a file download, handle it appropriately
    if (data?.downloadUrl) {
      // Redirect to the download URL
      return NextResponse.redirect(data.downloadUrl);
    }

    if (data?.fileData) {
      // Return the file directly
      const buffer = Buffer.from(data.fileData, 'base64');
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': `attachment; filename="product-${productId}.zip"`,
        },
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    const { status, message } = toErrorResponse(error);
    return NextResponse.json({ error: message }, { status });
  }
}
