import { describe, it, expect } from "vitest";
import { passwordSchema } from "@/lib/validators/auth";

describe("passwordSchema", () => {
  it("rejects passwords shorter than 8 characters", () => {
    expect(passwordSchema.safeParse("abc123").success).toBe(false);
  });

  it("rejects passwords with no digit", () => {
    expect(passwordSchema.safeParse("abcdefgh").success).toBe(false);
  });

  it("rejects passwords with no letter", () => {
    expect(passwordSchema.safeParse("12345678").success).toBe(false);
  });

  it("accepts a password meeting length + letter + digit", () => {
    expect(passwordSchema.safeParse("password1").success).toBe(true);
  });
});
