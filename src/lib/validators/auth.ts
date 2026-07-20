import { z } from "zod";

// Previously min(6) with no complexity check — combined with a 30/min rate
// limit, weak passwords (e.g. "123456") were realistically brute-forceable.
// NIST 800-63B favors length over forced complexity, so this raises the
// floor and requires a mix of letters/digits rather than arbitrary symbol
// rules that tend to produce predictable substitutions instead.
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[a-zA-Z]/, "Password must contain at least one letter")
  .regex(/[0-9]/, "Password must contain at least one number");
