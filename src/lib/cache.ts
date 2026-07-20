import { redis } from "@/lib/redis";

const memoryCache = new Map<string, { value: unknown; expiresAt: number }>();

// Same production-safety caveat as rate-limit.ts's in-memory fallback:
// without Redis configured, this cache is per-instance only (each warm
// serverless function has its own copy) — fine for cutting down redundant
// work within one instance's lifetime, not a substitute for a real shared
// cache across instances.
export async function getOrSetCache<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  if (redis) {
    const cached = await redis.get<T>(key);
    if (cached !== null && cached !== undefined) return cached;
    const value = await fetcher();
    await redis.set(key, value, { ex: ttlSeconds });
    return value;
  }

  const entry = memoryCache.get(key);
  if (entry && entry.expiresAt > Date.now()) return entry.value as T;
  const value = await fetcher();
  memoryCache.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  return value;
}
