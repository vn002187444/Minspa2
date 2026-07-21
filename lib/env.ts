import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  NEXT_PUBLIC_HOTLINE: z.string().optional(),
  BANK_ACCOUNT_NUMBER: z.string().optional(),
  BANK_ACCOUNT_OWNER: z.string().optional(),
  BANK_NAME: z.string().optional(),
  BANK_ID: z.string().optional(),
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().optional(),
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required for AI features'),
  CRON_SECRET: z.string().min(1, 'CRON_SECRET is required for cron endpoints'),
  SENTRY_DSN: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  ZALO_ACCESS_TOKEN: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().email().optional(),
  UNSPLASH_ACCESS_KEY: z.string().optional(),
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  WEB_PUSH_EMAIL: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
});

const _env = envSchema.safeParse(process.env);

const isBuildPhase =
  process.env.npm_lifecycle_event === 'build' ||
  process.argv.some((a) => a === 'build') ||
  !!process.env.NEXT_PHASE;

if (!_env.success) {
  console.error('❌ Invalid environment variables:');
  console.error(JSON.stringify(_env.error.format(), null, 2));
  
  if (process.env.NODE_ENV === 'production' && !isBuildPhase) {
    throw new Error('Invalid environment variables. Process terminated.');
  }
}

export const env = _env.success ? _env.data : process.env;

export function getBaseUrl(): string {
  if (typeof env.NEXT_PUBLIC_APP_URL === 'string' && env.NEXT_PUBLIC_APP_URL.length > 0) {
    return env.NEXT_PUBLIC_APP_URL;
  }
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.NODE_ENV === 'production') return 'https://minhair.vercel.app';
  return 'http://localhost:3000';
}
