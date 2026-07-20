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

  // A regex-based stripper matches `<[^>]*>` non-greedily, so a `>` inside a
  // quoted attribute value ends the match early and leaks the rest of the
  // attribute string as visible text (e.g. the old implementation turned
  // this into `ignored">rest`). A real parser knows it's still inside a
  // quoted attribute and discards the whole malformed tag correctly.
  it("doesn't leak text trapped inside a malformed tag's attribute value", () => {
    const result = sanitizeText('<img src="x" onerror="alert(1)>ignored">rest');
    expect(result).toBe("rest");
    expect(result).not.toContain("ignored");
  });

  it("strips nested/malformed script-tag-in-tag tricks without leaving executable markup", () => {
    const result = sanitizeText("<scr<script>ipt>alert(1)</scr</script>ipt>");
    expect(result).not.toContain("<script>");
    expect(result).not.toContain("</script>");
  });
});
