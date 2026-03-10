import { NextResponse } from "next/server";
import { serverFetch, extractToken, toErrorResponse } from "@/lib/http";

/**
 * GET /api/admin/products/export - Export products to CSV/Excel
 * Forwards to NestJS GET /products/export
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60; // 60 seconds for file generation

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const token = await extractToken(request);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const limit = searchParams.get('limit');

    // Validate format
    const allowedFormats = ['csv', 'xlsx'];
    if (!allowedFormats.includes(format)) {
      return NextResponse.json(
        { error: "Invalid format. Use 'csv' or 'xlsx'" },
        { status: 400 }
      );
    }

    // Build query string
    const params = new URLSearchParams({
      format,
      ...(category && { category }),
      ...(status && { status }),
      ...(limit && { limit })
    });

    const data = await serverFetch(`/products/export?${params}`, { token }) as { downloadUrl?: string; fileData?: string; filename?: string; recordCount?: number };

    // Handle file download
    if (data?.downloadUrl) {
      // Redirect to pre-signed URL
      return NextResponse.redirect(data.downloadUrl);
    }

    if (data?.fileData) {
      // Return file directly
      const buffer = Buffer.from(data.fileData, 'base64');
      const filename = `products-export-${new Date().toISOString().split('T')[0]}.${format}`;

      const mimeType = format === 'csv'
        ? 'text/csv'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': mimeType,
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': buffer.length.toString(),
        },
      });
    }

    // Fallback: return JSON response
    return NextResponse.json({
      message: "Export completed",
      filename: data?.filename,
      downloadUrl: data?.downloadUrl,
      recordCount: data?.recordCount,
      ...(data || {})
    });
  } catch (error) {
    console.error('Product export error:', error);
    const { status, message } = toErrorResponse(error);

    // Handle specific export errors
    if (status === 400 && message.includes('permission')) {
      return NextResponse.json(
        { error: "You don't have permission to export products" },
        { status: 403 }
      );
    }

    if (status === 500 && message.includes('generation')) {
      return NextResponse.json(
        { error: "Failed to generate export file. Please try again" },
        { status: 500 }
      );
    }

    return NextResponse.json({ error: message }, { status });
  }
}
