import { NextResponse } from "next/server";
import { serverFetch, extractToken, toErrorResponse } from "@/lib/http";

/**
 * POST /api/admin/products/import - Import products from CSV/Excel
 * Forwards to NestJS POST /products/import
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60; // 60 seconds for file processing

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const token = await extractToken(request);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload CSV or Excel files" },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB" },
        { status: 400 }
      );
    }

    // Convert file to buffer for forwarding
    const buffer = await file.arrayBuffer();
    const base64Data = Buffer.from(buffer).toString('base64');

    const data = await serverFetch('/products/import', {
      method: 'POST',
      token,
      body: {
        file: base64Data,
        filename: file.name,
        mimeType: file.type,
        size: file.size
      }
    }) as { imported?: number; failed?: number; errors?: string[] };

    return NextResponse.json({
      message: "Products imported successfully",
      imported: data?.imported || 0,
      failed: data?.failed || 0,
      errors: data?.errors || [],
      ...(data || {})
    });
  } catch (error) {
    console.error('Product import error:', error);
    const { status, message } = toErrorResponse(error);

    // Handle specific import errors
    if (status === 400 && message.includes('format')) {
      return NextResponse.json(
        { error: "Invalid file format. Please check your CSV/Excel structure" },
        { status: 400 }
      );
    }

    if (status === 400 && message.includes('headers')) {
      return NextResponse.json(
        { error: "Missing required columns. Please ensure your file has the correct headers" },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: message }, { status });
  }
}
