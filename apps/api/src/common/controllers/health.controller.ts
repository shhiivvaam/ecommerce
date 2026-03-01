import { Controller, Get } from '@nestjs/common';
import { HealthService, HealthCheckResult } from '../services/health.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Get comprehensive health check' })
  @ApiResponse({
    status: 200,
    description: 'Health check results',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['healthy', 'unhealthy'] },
        timestamp: { type: 'string' },
        uptime: { type: 'number' },
        version: { type: 'string' },
        checks: {
          type: 'object',
          properties: {
            database: {
              type: 'object',
              properties: {
                status: { type: 'string' },
                message: { type: 'string' },
                responseTime: { type: 'number' },
              },
            },
            memory: {
              type: 'object',
              properties: {
                status: { type: 'string' },
                message: { type: 'string' },
                details: { type: 'object' },
              },
            },
            disk: {
              type: 'object',
              properties: {
                status: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
        },
      },
    },
  })
  async check(): Promise<HealthCheckResult> {
    return this.healthService.checkHealth();
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe for Kubernetes' })
  @ApiResponse({
    status: 200,
    description: 'Application is running',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string' },
        timestamp: { type: 'string' },
      },
    },
  })
  liveness() {
    return this.healthService.checkLiveness();
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe for Kubernetes' })
  @ApiResponse({
    status: 200,
    description: 'Application is ready to serve traffic',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['ready', 'not_ready'] },
        timestamp: { type: 'string' },
        checks: { type: 'object' },
      },
    },
  })
  async readiness() {
    return this.healthService.checkReadiness();
  }
}
