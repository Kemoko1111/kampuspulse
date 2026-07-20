import { describe, it, expect, afterAll } from "vitest";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { adminClient, createTestUser, deleteTestUser } from "./helpers";

// Regression test for the most severe finding of this whole audit:
// increment_wallet_balance/decrement_wallet_balance/decrement_product_stock
// are SECURITY DEFINER functions PostgreSQL grants EXECUTE on to PUBLIC by
// default. Before migration 033, a fully unauthenticated request — just the
// app's own public anon key, no login at all — could call
// POST /rest/v1/rpc/increment_wallet_balance with an arbitrary p_user_id and
// mint unlimited money into any wallet. Confirmed empirically against a
// local Supabase instance before writing the fix; this test locks that fix
// in so it can never silently regress.
const SUPABASE_URL = process.env.INTEGRATION_SUPABASE_URL || "http://127.0.0.1:54321";
const ANON_KEY =
  process.env.INTEGRATION_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

const anonClient = createClient<Database>(SUPABASE_URL, ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

describe("wallet RPC privilege escalation (migration 033)", () => {
  const createdUserIds: string[] = [];
  afterAll(async () => {
    await Promise.all(createdUserIds.map(deleteTestUser));
  });

  it("blocks a fully unauthenticated (anon) attempt to credit an arbitrary wallet", async () => {
    const victim = await createTestUser();
    createdUserIds.push(victim.userId);

    const { error } = await anonClient.rpc("increment_wallet_balance", {
      p_user_id: victim.profileId,
      p_amount: 999999,
    });
    expect(error).not.toBeNull();
    expect(error?.message).toMatch(/permission denied/i);

    const { data: wallet } = await adminClient.from("wallets").select("balance").eq("user_id", victim.profileId).single();
    expect(wallet?.balance).toBe(0);
  });

  it("blocks an authenticated user from crediting someone else's wallet", async () => {
    const victim = await createTestUser();
    const attacker = await createTestUser();
    createdUserIds.push(victim.userId, attacker.userId);

    const { error } = await attacker.client.rpc("increment_wallet_balance", {
      p_user_id: victim.profileId,
      p_amount: 999999,
    });
    expect(error).not.toBeNull();
    expect(error?.message).toMatch(/not authorized/i);

    const { data: wallet } = await adminClient.from("wallets").select("balance").eq("user_id", victim.profileId).single();
    expect(wallet?.balance).toBe(0);
  });

  it("still allows an authenticated user to credit/debit their own wallet", async () => {
    const user = await createTestUser();
    createdUserIds.push(user.userId);

    const { error: creditError } = await user.client.rpc("increment_wallet_balance", {
      p_user_id: user.profileId,
      p_amount: 100,
    });
    expect(creditError).toBeNull();

    const { data: afterCredit } = await adminClient.from("wallets").select("balance").eq("user_id", user.profileId).single();
    expect(afterCredit?.balance).toBe(100);

    const { data: debitOk, error: debitError } = await user.client.rpc("decrement_wallet_balance", {
      p_user_id: user.profileId,
      p_amount: 40,
    });
    expect(debitError).toBeNull();
    expect(debitOk).toBe(true);

    const { data: afterDebit } = await adminClient.from("wallets").select("balance").eq("user_id", user.profileId).single();
    expect(afterDebit?.balance).toBe(60);
  });

  it("still allows the service role to credit any wallet (webhook/admin context)", async () => {
    const user = await createTestUser();
    createdUserIds.push(user.userId);

    const { error } = await adminClient.rpc("increment_wallet_balance", {
      p_user_id: user.profileId,
      p_amount: 25,
    });
    expect(error).toBeNull();

    const { data: wallet } = await adminClient.from("wallets").select("balance").eq("user_id", user.profileId).single();
    expect(wallet?.balance).toBe(25);
  });

  it("blocks a fully unauthenticated attempt to manipulate product stock", async () => {
    const { error } = await anonClient.rpc("decrement_product_stock", {
      p_product_id: "00000000-0000-0000-0000-000000000000",
      p_quantity: 1,
    });
    expect(error).not.toBeNull();
    expect(error?.message).toMatch(/permission denied/i);
  });
});
