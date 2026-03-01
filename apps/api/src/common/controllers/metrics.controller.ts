import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { MetricsService } from '../services/metrics.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Metrics')
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  @ApiOperation({ summary: 'Get application metrics' })
  @ApiResponse({
    status: 200,
    description: 'Application metrics in Prometheus format',
    content: {
      'text/plain': {
        schema: {
          type: 'string',
          example: `# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{service="reyva-api",method="GET",route="/health",status="200"} 1
# HELP http_request_duration_ms HTTP request duration in milliseconds
# TYPE http_request_duration_ms histogram
http_request_duration_ms_bucket{service="reyva-api",method="GET",route="/health",le="100"} 1
http_request_duration_ms_count{service="reyva-api",method="GET",route="/health"} 1
http_request_duration_ms_sum{service="reyva-api",method="GET",route="/health"} 45`,
        },
      },
    },
  })
  getMetrics(@Res() res: Response): void {
    const metrics = this.metricsService.getMetrics();
    const prometheusFormat = this.formatForPrometheus(metrics);

    res.setHeader('Content-Type', 'text/plain; version=0.0.4');
    res.send(prometheusFormat);
  }

  private formatForPrometheus(
    metrics: Record<string, number | number[]>,
  ): string {
    const lines: string[] = [];

    for (const [key, value] of Object.entries(metrics)) {
      // Parse key to extract metric name and labels
      const match = key.match(/^([^{]+){?([^}]*)}?$/);
      if (!match) continue;

      const [, metricName, labelsStr] = match;
      const labels = labelsStr
        ? labelsStr.split(',').reduce(
            (acc, label) => {
              const [k, v] = label.split('=');
              acc[k.trim()] = v.replace(/"/g, '');
              return acc;
            },
            {} as Record<string, string>,
          )
        : {};

      const labelStr = Object.entries(labels)
        .map(([k, v]) => `${k}="${v}"`)
        .join(',');

      if (Array.isArray(value)) {
        // Histogram
        lines.push(`# HELP ${metricName} ${metricName}`);
        lines.push(`# TYPE ${metricName} histogram`);

        // Add histogram buckets
        const buckets = this.calculateBuckets(value);
        buckets.forEach(([bucket, count]) => {
          lines.push(
            `${metricName}_bucket{${labelStr},le="${bucket}"} ${count}`,
          );
        });

        lines.push(`${metricName}_count{${labelStr}} ${value.length}`);
        lines.push(
          `${metricName}_sum{${labelStr}} ${value.reduce((a, b) => a + b, 0)}`,
        );
      } else {
        // Counter or Gauge
        lines.push(`# HELP ${metricName} ${metricName}`);
        lines.push(
          `# TYPE ${metricName} ${typeof value === 'number' && value >= 0 ? 'counter' : 'gauge'}`,
        );
        lines.push(`${metricName}{${labelStr}} ${value}`);
      }
    }

    return lines.join('\n') + '\n';
  }

  private calculateBuckets(values: number[]): Array<[string, number]> {
    const buckets = [
      1,
      5,
      10,
      25,
      50,
      100,
      250,
      500,
      1000,
      2500,
      5000,
      10000,
      '+Inf',
    ];
    const sorted = [...values].sort((a, b) => a - b);

    return buckets.map((bucket) => {
      const numericBucket = bucket === '+Inf' ? Infinity : Number(bucket);
      const count =
        bucket === '+Inf'
          ? sorted.length
          : sorted.filter((v) => v <= numericBucket).length;
      return [bucket.toString(), count];
    });
  }
}
