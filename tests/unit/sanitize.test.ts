import { describe, it, expect } from "vitest";
import { sanitizeText, sanitizeObject } from "@/lib/middleware/sanitize";

describe("Sanitize", () => {
  it("strips HTML tags", () => {
    expect(sanitizeText('<script>alert("xss")</script>Hello')).toBe("Hello");
  });

  it("sanitizes object text fields", () => {
    const result = sanitizeObject(
      { title: "<b>Test</b>", price: 50 },
      ["title"]
    );
    expect(result.title).toBe("Test");
    expect(result.price).toBe(50);
  });
});
