import { describe, it, expect, vi, afterEach } from "vitest";
import { logger } from "@/lib/logger";

describe("logger", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("writes a JSON line with level/message/timestamp for info", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    logger.info("something happened", { userId: "u1" });
    const entry = JSON.parse(spy.mock.calls[0][0] as string);
    expect(entry).toMatchObject({ level: "info", message: "something happened", userId: "u1" });
    expect(entry.timestamp).toBeTypeOf("string");
  });

  it("serializes an Error's message and stack instead of losing them to JSON.stringify", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    logger.error("it broke", new Error("boom"), { orderId: "o1" });
    const entry = JSON.parse(spy.mock.calls[0][0] as string);
    expect(entry.level).toBe("error");
    expect(entry.errorMessage).toBe("boom");
    expect(entry.errorStack).toContain("boom");
    expect(entry.orderId).toBe("o1");
  });

  it("handles a non-Error thrown value without crashing", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    logger.error("weird failure", "just a string");
    const entry = JSON.parse(spy.mock.calls[0][0] as string);
    expect(entry.errorMessage).toBe("just a string");
  });
});
