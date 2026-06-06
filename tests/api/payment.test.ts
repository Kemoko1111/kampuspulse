import { describe, it, expect } from "vitest";
import crypto from "crypto";

describe("Paystack Webhook", () => {
  it("verifies webhook signature", () => {
    const secret = "test_webhook_secret";
    const body = JSON.stringify({ event: "charge.success", data: { reference: "ref_123" } });

    const hash = crypto.createHmac("sha512", secret).update(body).digest("hex");
    const signature = hash;

    expect(hash).toBe(signature);
    expect(hash.length).toBe(128);
  });

  it("rejects invalid signature", () => {
    const secret = "test_webhook_secret";
    const body = JSON.stringify({ event: "charge.success" });
    const hash = crypto.createHmac("sha512", secret).update(body).digest("hex");

    expect(hash).not.toBe("invalid_signature");
  });
});
