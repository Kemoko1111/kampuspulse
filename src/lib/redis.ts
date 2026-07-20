import { Redis } from "@upstash/redis";

// Shared Upstash client — used by both rate-limit.ts and cache.ts. null when
// Upstash isn't configured (each caller has its own documented, less-safe
// fallback for that case rather than silently no-op-ing).
export const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;
