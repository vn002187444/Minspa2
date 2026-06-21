import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
  SUPABASE_ANON_KEY: z.string().min(1, 'SUPABASE_ANON_KEY is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  BYPASS_ADMIN_USER: z.string().optional(),
  BYPASS_ADMIN_PASS: z.string().optional(),
  BYPASS_STAFF1_USER: z.string().optional(),
  BYPASS_STAFF1_PASS: z.string().optional(),
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
  WEB_PUSH_EMAIL: z.string().email().optional(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:');
  console.error(JSON.stringify(_env.error.format(), null, 2));
  
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Invalid environment variables. Process terminated.');
  }
}

export const env = _env.success ? _env.data : process.env;
