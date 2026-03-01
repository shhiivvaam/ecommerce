import { z } from 'zod';
import { Logger } from '@nestjs/common';

const logger = new Logger('EnvConfig');

export const envValidationSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().default(3001),

  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),

  // Auth
  JWT_SECRET: z
    .string()
    .min(16, 'JWT_SECRET must be at least 16 characters long'),

  // Frontend
  FRONTEND_URL: z.string().url('FRONTEND_URL must be a valid URL').optional(),

  // Payment (Stripe) - optional for dev, but strictly validated if present
  STRIPE_SECRET_KEY: z
    .string()
    .refine((val) => !val || val.startsWith('sk_'), {
      message: 'STRIPE_SECRET_KEY must start with sk_',
    })
    .optional(),
  STRIPE_WEBHOOK_SECRET: z
    .string()
    .refine((val) => !val || val.startsWith('whsec_'), {
      message: 'STRIPE_WEBHOOK_SECRET must start with whsec_',
    })
    .optional(),

  // Storage (AWS S3) - optional for dev
  AWS_S3_BUCKET: z.string().optional(),
  AWS_REGION: z.string().default('ap-south-1'),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),

  // Email (SMTP) - optional for dev
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_SECURE: z.coerce.boolean().default(false),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
});

export type EnvConfig = z.infer<typeof envValidationSchema>;

// Validate function used by NestJS ConfigModule
export function validateEnv(config: Record<string, unknown>) {
  const parsed = envValidationSchema.safeParse(config);

  if (!parsed.success) {
    logger.error('❌ Invalid environment configuration', {
      errors: parsed.error.format(),
    });
    throw new Error('Invalid environment configuration');
  }

  return parsed.data;
}
