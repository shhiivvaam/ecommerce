import { NextResponse } from "next/server";
import { serverFetch, toErrorResponse } from "@/lib/http";

/**
 * GET /api/health - Basic health check
 * Forwards to NestJS GET /health
 */
export async function GET(): Promise<NextResponse> {
  try {
    const data = await serverFetch('/health');
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'frontend-api',
      version: process.env.npm_package_version || '1.0.0',
      backend: data,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    });
  } catch (error) {
    console.error('Health check error:', error);
    const { status, message } = toErrorResponse(error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'frontend-api',
      error: message,
      uptime: process.uptime(),
    }, { status: status >= 500 ? 503 : status });
  }
}
