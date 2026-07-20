import { describe, it, expect, vi } from "vitest";
import { getOrSetCache } from "@/lib/cache";

// No UPSTASH_* env vars are set in tests/setup.ts, so this exercises the
// in-memory fallback path — the same one production falls back to when
// Redis isn't configured.
describe("getOrSetCache (in-memory fallback)", () => {
  it("calls the fetcher once and caches the result for subsequent calls", async () => {
    const fetcher = vi.fn().mockResolvedValue({ value: 42 });
    const key = `test:${Math.random()}`;

    const first = await getOrSetCache(key, 60, fetcher);
    const second = await getOrSetCache(key, 60, fetcher);

    expect(first).toEqual({ value: 42 });
    expect(second).toEqual({ value: 42 });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("re-fetches after the TTL expires", async () => {
    const fetcher = vi.fn().mockResolvedValue({ value: 1 });
    const key = `test:${Math.random()}`;

    await getOrSetCache(key, 0.01, fetcher); // 10ms TTL
    await new Promise((r) => setTimeout(r, 30));
    await getOrSetCache(key, 0.01, fetcher);

    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("uses independent cache entries per key", async () => {
    const fetcherA = vi.fn().mockResolvedValue("a");
    const fetcherB = vi.fn().mockResolvedValue("b");
    const suffix = Math.random();

    const a = await getOrSetCache(`test:a:${suffix}`, 60, fetcherA);
    const b = await getOrSetCache(`test:b:${suffix}`, 60, fetcherB);

    expect(a).toBe("a");
    expect(b).toBe("b");
  });
});
