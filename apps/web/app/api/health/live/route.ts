import { NextResponse } from "next/server";
import { serverFetch } from "@/lib/http";

/**
 * GET /api/health/live - Liveness probe
 * Forwards to NestJS GET /health/live
 * Used by Kubernetes/container orchestrators to check if the service is alive
 */
export async function GET(): Promise<NextResponse> {
  try {
    const data = await serverFetch('/health/live');
    
    return NextResponse.json({
      status: 'alive',
      timestamp: new Date().toISOString(),
      service: 'frontend-api',
      probe: 'liveness',
      backend: data,
      uptime: process.uptime(),
    });
  } catch (error) {
    console.error('Liveness probe error:', error);
    
    // For liveness probes, we should return 503 if backend is down
    return NextResponse.json({
      status: 'dead',
      timestamp: new Date().toISOString(),
      service: 'frontend-api',
      probe: 'liveness',
      error: 'Service is not responding',
      uptime: process.uptime(),
    }, { status: 503 });
  }
}
