import { Ratelimit } from "@upstash/ratelimit";
import { AppError } from "@/lib/errors/app-error";
import { redis } from "@/lib/redis";

const limiters = {
  public: redis
    ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(100, "1 m"), prefix: "rl:public" })
    : null,
  auth: redis
    ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(30, "1 m"), prefix: "rl:auth" })
    : null,
  // Payment-initiating endpoints (Paystack init/verify, wallet top-up, task/ride
  // pay) — tighter than "public" since each call has a real cost (a Paystack API
  // request) and a real abuse incentive (spamming escrow/payment attempts).
  payment: redis
    ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, "1 m"), prefix: "rl:payment" })
    : null,
  upload: redis
    ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(20, "1 m"), prefix: "rl:upload" })
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

const LIMITS: Record<keyof typeof limiters, number> = {
  public: 100,
  auth: 30,
  payment: 10,
  upload: 20,
};

export async function rateLimit(
  identifier: string,
  type: keyof typeof limiters = "public"
) {
  const limiter = limiters[type];
  const limit = LIMITS[type];

  if (limiter) {
    const { success } = await limiter.limit(identifier);
    if (!success) throw new AppError("Too many requests", 429, "RATE_LIMITED");
    return;
  }

  if (!inMemoryRateLimit(`${type}:${identifier}`, limit)) {
    throw new AppError("Too many requests", 429, "RATE_LIMITED");
  }
}
