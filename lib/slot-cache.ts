/**
 * Slot availability cache — Upstash Redis (shared across regions) with
 * in-memory fallback when Redis env vars are not set.
 * TTL 15-30s, LRU 100 keys for memory fallback.
 */
interface CacheEntry {
  data: unknown;
  expiresAt: number;
}

const memoryCache = new Map<string, CacheEntry>();
const DEFAULT_TTL_MS = 30_000;

let redis: InstanceType<typeof import('@upstash/redis').Redis> | null = null;
function getRedis() {
  if (redis !== null) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  try {
    const { Redis } = require('@upstash/redis');
    redis = new Redis({ url, token });
    return redis;
  } catch {
    return null;
  }
}

export async function getCached<T>(key: string): Promise<T | null> {
  const r = getRedis();
  if (r) {
    try {
      const val = await r.get<T>(key);
      return val ?? null;
    } catch {
      // Fall through to memory
    }
  }
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return entry.data as T;
}

// Sync fallback for callers that haven't migrated to async yet
export function getCachedSync<T>(key: string): T | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return entry.data as T;
}

export async function setCache<T>(key: string, data: T, ttlMs: number = DEFAULT_TTL_MS): Promise<void> {
  const r = getRedis();
  if (r) {
    try {
      await r.set(key, data as any, { ex: Math.ceil(ttlMs / 1000) });
      return;
    } catch {
      // Fall through to memory
    }
  }
  memoryCache.set(key, { data, expiresAt: Date.now() + ttlMs });
  if (memoryCache.size > 100) {
    const oldest = [...memoryCache.entries()].sort((a, b) => a[1].expiresAt - b[1].expiresAt)[0];
    if (oldest) memoryCache.delete(oldest[0]);
  }
}

export async function invalidateCache(pattern?: string): Promise<void> {
  const r = getRedis();
  if (r && pattern) {
    try {
      // Upstash: scan keys by pattern via SCAN
      let cursor = 0;
      do {
        const [next, keys] = await (r as any).scan(cursor, { match: `*${pattern}*`, count: 100 });
        cursor = Number(next);
        if (keys.length) await r.del(...keys);
      } while (cursor !== 0);
      return;
    } catch {
      // Fall through to memory
    }
  } else if (r && !pattern) {
    try { await r.flushdb(); return; } catch {}
  }
  if (!pattern) {
    memoryCache.clear();
    return;
  }
  for (const key of memoryCache.keys()) {
    if (key.includes(pattern)) memoryCache.delete(key);
  }
}

export function buildSlotCacheKey(date: string, serviceIds: string[]): string {
  return `slots:${date}:${[...serviceIds].sort().join(',')}`;
}
