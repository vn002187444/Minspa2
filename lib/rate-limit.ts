import { createClient } from '@/utils/supabase/server';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

/**
 * Simple rate limiting using Supabase as a store.
 * @param key Unique identifier for the requester (e.g., IP address or User ID)
 * @param limit Maximum requests allowed per window
 * @param windowSeconds Time window in seconds
 */
export async function rateLimit(key: string, limit: number = 10, windowSeconds: number = 60): Promise<RateLimitResult> {
  const supabase = await createClient();
  const now = new Date();
  
  const { data, error } = await supabase
    .from('rate_limits')
    .select('request_count, last_request')
    .eq('key', key)
    .maybeSingle();

  if (error) {
    console.error('[RATE_LIMIT] Error fetching rate limit:', error);
    return { allowed: true, remaining: limit }; // Fail open to avoid blocking users
  }

  if (!data) {
    const { error: insertErr } = await supabase
      .from('rate_limits')
      .insert({ key, request_count: 1, last_request: now.toISOString() });
    if (insertErr) {
      console.error('[RATE_LIMIT] Error inserting rate limit:', insertErr);
      return { allowed: true, remaining: limit };
    }
    return { allowed: true, remaining: limit - 1 };
  }

  const lastRequest = new Date(data.last_request);
  const diff = (now.getTime() - lastRequest.getTime()) / 1000;

  if (diff > windowSeconds) {
    const { error: updateErr } = await supabase
      .from('rate_limits')
      .update({ request_count: 1, last_request: now.toISOString() })
      .eq('key', key);
    if (updateErr) {
      console.error('[RATE_LIMIT] Error resetting rate limit:', updateErr);
      return { allowed: true, remaining: limit };
    }
    return { allowed: true, remaining: limit - 1 };
  }

  if (data.request_count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  const { error: incErr } = await supabase
    .from('rate_limits')
    .update({ request_count: data.request_count + 1, last_request: now.toISOString() })
    .eq('key', key);
  if (incErr) {
    console.error('[RATE_LIMIT] Error incrementing rate limit:', incErr);
    return { allowed: true, remaining: limit };
  }

  return { allowed: true, remaining: limit - (data.request_count + 1) };
}
