import { NextResponse } from "next/server";
import { serverFetch, toErrorResponse } from "@/lib/http";

/**
 * GET /api/metrics - Application metrics
 * Forwards to NestJS GET /metrics
 * Used by monitoring systems to collect application metrics
 */
export async function GET(): Promise<NextResponse> {
  try {
    const data = await serverFetch('/metrics') as Record<string, unknown>;

    // Add frontend-specific metrics
    const frontendMetrics = {
      service: 'frontend-api',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      version: process.env.npm_package_version || '1.0.0',
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
    };

    return NextResponse.json({
      ...frontendMetrics,
      backend: data,
    });
  } catch (error) {
    console.error('Metrics error:', error);
    const { status, message } = toErrorResponse(error);

    return NextResponse.json({
      service: 'frontend-api',
      timestamp: new Date().toISOString(),
      error: message,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      status: 'error'
    }, { status });
  }
}
