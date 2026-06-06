import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { AppError } from "@/lib/errors/app-error";

const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

const limiters = {
  public: redis
    ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(100, "1 m"), prefix: "rl:public" })
    : null,
  auth: redis
    ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(30, "1 m"), prefix: "rl:auth" })
    : null,
};

const inMemoryCounts = new Map<string, { count: number; resetAt: number }>();

function inMemoryRateLimit(key: string, limit: number): boolean {
  const now = Date.now();
  const entry = inMemoryCounts.get(key);
  if (!entry || now > entry.resetAt) {
    inMemoryCounts.set(key, { count: 1, resetAt: now + 60000 });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

export async function rateLimit(
  identifier: string,
  type: "public" | "auth" = "public"
) {
  const limiter = limiters[type];
  const limit = type === "auth" ? 30 : 100;

  if (limiter) {
    const { success } = await limiter.limit(identifier);
    if (!success) throw new AppError("Too many requests", 429, "RATE_LIMITED");
    return;
  }

  if (!inMemoryRateLimit(`${type}:${identifier}`, limit)) {
    throw new AppError("Too many requests", 429, "RATE_LIMITED");
  }
}
