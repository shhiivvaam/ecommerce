import { NextResponse } from "next/server";
import { serverFetch, extractToken, toErrorResponse } from "@/lib/http";

/**
 * POST /api/storage/upload - Upload files (images, documents, etc.)
 * Forwards to NestJS POST /storage/upload
 */
export const dynamic = "force-dynamic";
export const maxDuration = 30; // 30 seconds for file upload

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const token = await extractToken(request);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'general';
    const isPublic = formData.get('isPublic') === 'true';

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = {
      image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
      document: ['application/pdf', 'text/csv', 'application/vnd.ms-excel'],
      video: ['video/mp4', 'video/webm'],
      audio: ['audio/mpeg', 'audio/wav', 'audio/ogg']
    };

    const allAllowedTypes = Object.values(allowedTypes).flat();

    if (!allAllowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: "Invalid file type. Allowed types: JPEG, PNG, GIF, WebP, SVG, PDF, CSV, Excel, MP4, WebM, MP3, WAV, OGG",
          allowedTypes: allAllowedTypes
        },
        { status: 400 }
      );
    }

    // Validate file size (different limits for different types)
    const sizeLimits = {
      image: 5 * 1024 * 1024, // 5MB
      document: 10 * 1024 * 1024, // 10MB
      video: 100 * 1024 * 1024, // 100MB
      audio: 50 * 1024 * 1024, // 50MB
    };

    const getFileType = (mimeType: string) => {
      for (const [type, types] of Object.entries(allowedTypes)) {
        if (types.includes(mimeType)) return type;
      }
      return 'general';
    };

    const fileType = getFileType(file.type);
    const maxSize = sizeLimits[fileType as keyof typeof sizeLimits] || 5 * 1024 * 1024;

    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error: `File too large. Maximum size for ${fileType}s is ${maxSize / (1024 * 1024)}MB`,
          maxSize,
          fileSize: file.size
        },
        { status: 400 }
      );
    }

    // Sanitize filename
    const originalName = file.name;
    const sanitizedFilename = originalName
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_{2,}/g, '_')
      .toLowerCase();

    // Forward the file directly using FormData
    const forwardFormData = new FormData();
    forwardFormData.append('file', file);
    if (folder) forwardFormData.append('folder', folder);

    const data = await serverFetch('/storage/upload', {
      method: 'POST',
      token,
      body: forwardFormData
    }) as { url?: string; publicUrl?: string; fileId?: string };

    return NextResponse.json({
      message: "File uploaded successfully",
      filename: sanitizedFilename,
      originalName,
      size: file.size,
      mimeType: file.type,
      folder,
      url: data?.url,
      publicUrl: data?.publicUrl,
      fileId: data?.fileId,
      ...(data || {})
    });
  } catch (error) {
    console.error('File upload error:', error);
    const { status, message } = toErrorResponse(error);

    // Handle specific upload errors
    if (status === 400 && message.includes('storage')) {
      return NextResponse.json(
        { error: "Storage quota exceeded. Please delete some files and try again" },
        { status: 400 }
      );
    }

    if (status === 413) {
      return NextResponse.json(
        { error: "File too large" },
        { status: 413 }
      );
    }

    if (status === 500 && message.includes('virus')) {
      return NextResponse.json(
        { error: "File upload failed due to security scan" },
        { status: 500 }
      );
    }

    return NextResponse.json({ error: message }, { status });
  }
}
