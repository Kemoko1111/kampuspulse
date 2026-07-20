import { describe, it, expect, afterAll } from "vitest";
import { createTestUser, deleteTestUser } from "./helpers";

// Regression test for migration 031: `transactions` had RLS enabled since
// the first migration with only a SELECT policy — no INSERT policy ever
// existed. Every real Paystack payment's transaction-record insert silently
// failed, which made the webhook's idempotency guard treat every genuine
// payment as a duplicate and skip all fulfillment (order confirmation,
// escrow, ride payment, wallet credit). Confirmed empirically before
// writing the fix; this test locks it in.
describe("transactions INSERT RLS (migration 031)", () => {
  const createdUserIds: string[] = [];
  afterAll(async () => {
    await Promise.all(createdUserIds.map(deleteTestUser));
  });

  it("allows an authenticated user to insert their own transaction", async () => {
    const user = await createTestUser();
    createdUserIds.push(user.userId);

    const { data, error } = await user.client
      .from("transactions")
      .insert({
        user_id: user.profileId,
        type: "payment",
        amount: 50,
        payment_method: "mtn_momo",
        reference: `TEST_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        status: "pending",
        description: "integration test",
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data?.user_id).toBe(user.profileId);
  });

  it("rejects inserting a transaction against a different user's profile (no IDOR)", async () => {
    const victim = await createTestUser();
    const attacker = await createTestUser();
    createdUserIds.push(victim.userId, attacker.userId);

    const { error } = await attacker.client.from("transactions").insert({
      user_id: victim.profileId,
      type: "payment",
      amount: 50,
      payment_method: "mtn_momo",
      reference: `TEST_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      status: "pending",
      description: "should be rejected",
    });

    expect(error).not.toBeNull();
    expect(error?.message).toMatch(/row-level security/i);
  });
});
