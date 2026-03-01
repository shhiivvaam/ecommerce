export interface MonitoringConfig {
  service: {
    name: string;
    version: string;
    environment: string;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    format: 'json' | 'pretty';
    enableConsole: boolean;
    enableFile: boolean;
    enableExternal: boolean;
  };
  metrics: {
    enabled: boolean;
    collectDefault: boolean;
    collectInterval: number; // milliseconds
    endpoint: string;
  };
  tracing: {
    enabled: boolean;
    samplingRate: number; // 0.0 to 1.0
    endpoint: string;
  };
  health: {
    enabled: boolean;
    checks: {
      database: boolean;
      memory: boolean;
      disk: boolean;
      external: boolean[];
    };
  };
  alerts: {
    enabled: boolean;
    thresholds: {
      errorRate: number; // percentage
      responseTime: number; // milliseconds
      memoryUsage: number; // percentage
      diskUsage: number; // percentage
    };
  };
}

export const defaultMonitoringConfig: MonitoringConfig = {
  service: {
    name: process.env.SERVICE_NAME || 'reyva-api',
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  },
  logging: {
    level:
      (process.env.LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error') || 'info',
    format: (process.env.LOG_FORMAT as 'json' | 'pretty') || 'pretty',
    enableConsole: process.env.LOG_CONSOLE !== 'false',
    enableFile: process.env.LOG_FILE === 'true',
    enableExternal: process.env.LOG_EXTERNAL === 'true',
  },
  metrics: {
    enabled: process.env.METRICS_ENABLED !== 'false',
    collectDefault: process.env.METRICS_DEFAULT !== 'false',
    collectInterval: parseInt(process.env.METRICS_INTERVAL || '30000', 10),
    endpoint: process.env.METRICS_ENDPOINT || '/metrics',
  },
  tracing: {
    enabled: process.env.TRACING_ENABLED === 'true',
    samplingRate: parseFloat(process.env.TRACING_SAMPLING_RATE || '0.1'),
    endpoint: process.env.TRACING_ENDPOINT || '',
  },
  health: {
    enabled: process.env.HEALTH_ENABLED !== 'false',
    checks: {
      database: process.env.HEALTH_CHECK_DB !== 'false',
      memory: process.env.HEALTH_CHECK_MEMORY !== 'false',
      disk: process.env.HEALTH_CHECK_DISK !== 'false',
      external: (process.env.HEALTH_CHECK_EXTERNAL || '')
        .split(',')
        .filter(Boolean)
        .map(() => true),
    },
  },
  alerts: {
    enabled: process.env.ALERTS_ENABLED === 'true',
    thresholds: {
      errorRate: parseFloat(process.env.ALERT_ERROR_RATE || '5.0'),
      responseTime: parseInt(process.env.ALERT_RESPONSE_TIME || '1000', 10),
      memoryUsage: parseFloat(process.env.ALERT_MEMORY_USAGE || '85.0'),
      diskUsage: parseFloat(process.env.ALERT_DISK_USAGE || '90.0'),
    },
  },
};
