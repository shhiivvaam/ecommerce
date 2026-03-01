import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface MetricData {
  name: string;
  value: number;
  tags?: Record<string, string>;
  timestamp?: Date;
}

export interface CounterMetric extends MetricData {
  type: 'counter';
}

export interface GaugeMetric extends MetricData {
  type: 'gauge';
}

export interface HistogramMetric extends MetricData {
  type: 'histogram';
  buckets?: number[];
}

@Injectable()
export class MetricsService {
  private readonly metrics: Map<string, any> = new Map();
  private readonly serviceName: string;

  constructor(private configService: ConfigService) {
    this.serviceName = this.configService.get<string>(
      'SERVICE_NAME',
      'reyva-api',
    );
  }

  // Counter metrics (always increment)
  increment(
    name: string,
    value: number = 1,
    tags?: Record<string, string>,
  ): void {
    const key = this.createKey(name, tags);
    const current = this.metrics.get(key) || 0;
    this.metrics.set(key, current + value);

    this.recordMetric({
      type: 'counter',
      name,
      value: current + value,
      tags,
    });
  }

  // Gauge metrics (can go up or down)
  gauge(name: string, value: number, tags?: Record<string, string>): void {
    const key = this.createKey(name, tags);
    this.metrics.set(key, value);

    this.recordMetric({
      type: 'gauge',
      name,
      value,
      tags,
    });
  }

  // Histogram metrics (distribution of values)
  histogram(name: string, value: number, tags?: Record<string, string>): void {
    const key = this.createKey(name, tags);
    const current = this.metrics.get(key) || [];
    current.push(value);
    this.metrics.set(key, current);

    this.recordMetric({
      type: 'histogram',
      name,
      value,
      tags,
    });
  }

  // Business metrics
  recordUserRegistration(userId: string): void {
    this.increment('user_registrations_total', 1, {
      service: this.serviceName,
    });
  }

  recordUserLogin(userId: string, success: boolean): void {
    this.increment('user_logins_total', 1, {
      service: this.serviceName,
      success: success.toString(),
    });
  }

  recordOrderCreation(orderId: string, amount: number): void {
    this.increment('orders_total', 1, { service: this.serviceName });
    this.histogram('order_amount', amount, { service: this.serviceName });
  }

  recordProductView(productId: string, userId?: string): void {
    this.increment('product_views_total', 1, { service: this.serviceName });
  }

  recordCartAction(action: 'add' | 'remove' | 'update', userId?: string): void {
    this.increment('cart_actions_total', 1, {
      service: this.serviceName,
      action,
    });
  }

  recordPaymentAttempt(success: boolean, amount?: number): void {
    this.increment('payment_attempts_total', 1, {
      service: this.serviceName,
      success: success.toString(),
    });

    if (success && amount) {
      this.histogram('payment_amount', amount, { service: this.serviceName });
    }
  }

  // System metrics
  recordHttpRequest(
    method: string,
    route: string,
    statusCode: number,
    duration: number,
  ): void {
    const statusClass = this.getStatusClass(statusCode);

    this.increment('http_requests_total', 1, {
      service: this.serviceName,
      method,
      route,
      status: statusCode.toString(),
      status_class: statusClass,
    });

    this.histogram('http_request_duration_ms', duration, {
      service: this.serviceName,
      method,
      route,
    });
  }

  recordDatabaseQuery(
    operation: string,
    table: string,
    duration: number,
  ): void {
    this.histogram('database_query_duration_ms', duration, {
      service: this.serviceName,
      operation,
      table,
    });
  }

  recordCacheHit(key: string, hit: boolean): void {
    this.increment('cache_requests_total', 1, {
      service: this.serviceName,
      hit: hit.toString(),
    });
  }

  // Get metrics for monitoring
  getMetrics(): Record<string, any> {
    const result: Record<string, any> = {};

    for (const [key, value] of this.metrics.entries()) {
      result[key] = value;
    }

    return result;
  }

  // Reset all metrics (useful for testing)
  reset(): void {
    this.metrics.clear();
  }

  private createKey(name: string, tags?: Record<string, string>): string {
    if (!tags) return name;

    const tagString = Object.entries(tags)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');

    return `${name}{${tagString}}`;
  }

  private getStatusClass(statusCode: number): string {
    if (statusCode >= 200 && statusCode < 300) return '2xx';
    if (statusCode >= 300 && statusCode < 400) return '3xx';
    if (statusCode >= 400 && statusCode < 500) return '4xx';
    if (statusCode >= 500) return '5xx';
    return 'unknown';
  }

  private recordMetric(
    metric: CounterMetric | GaugeMetric | HistogramMetric,
  ): void {
    // In production, send to external monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to Prometheus, Datadog, etc.
      // this.sendToPrometheus(metric);
      // this.sendToDatadog(metric);
    }
  }
}
