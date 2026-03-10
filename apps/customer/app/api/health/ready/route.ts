import { NextResponse } from "next/server";
import { serverFetch } from "@/lib/http";

/**
 * GET /api/health/ready - Readiness probe
 * Forwards to NestJS GET /health/ready
 * Used by Kubernetes/container orchestrators to check if the service is ready to accept traffic
 */
export async function GET(): Promise<NextResponse> {
  try {
    const data = await serverFetch('/health/ready') as { status?: string, checks?: { database?: boolean; redis?: boolean } };

    // Check if frontend is ready (can connect to backend)
    const isReady = data?.status === 'ready' || data?.status === 'healthy';

    return NextResponse.json({
      status: isReady ? 'ready' : 'not-ready',
      timestamp: new Date().toISOString(),
      service: 'frontend-api',
      probe: 'readiness',
      backend: data,
      uptime: process.uptime(),
      checks: {
        backend: isReady,
        database: data?.checks?.database || false,
        redis: data?.checks?.redis || false,
      }
    });
  } catch (error) {
    console.error('Readiness probe error:', error);

    return NextResponse.json({
      status: 'not-ready',
      timestamp: new Date().toISOString(),
      service: 'frontend-api',
      probe: 'readiness',
      error: 'Service is not ready to accept traffic',
      uptime: process.uptime(),
      checks: {
        backend: false,
        database: false,
        redis: false,
      }
    }, { status: 503 });
  }
}
