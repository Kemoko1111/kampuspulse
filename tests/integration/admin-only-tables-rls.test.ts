import { describe, it, expect, afterAll } from "vitest";
import { adminClient, createTestUser, deleteTestUser } from "./helpers";

// Regression tests for migrations 034 (missing WITH CHECK on 8 FOR ALL
// policies) and 035 (RLS never enabled at all on admin_logs, audit_logs,
// refunds, platform_settings, user_presence, typing_indicators). Both were
// found while investigating why a "fixed" platform_settings policy still
// let a non-admin overwrite it via upsert — the real root cause was that
// RLS enforcement itself was never switched on for that table (or these
// three), so every policy on it, fixed or not, was completely inert.
describe("admin-only tables actually enforce RLS (migration 035)", () => {
  const createdUserIds: string[] = [];
  afterAll(async () => {
    await Promise.all(createdUserIds.map(deleteTestUser));
  });

  it("blocks a non-admin from reading admin_logs", async () => {
    const user = await createTestUser();
    createdUserIds.push(user.userId);

    await adminClient.from("admin_logs").insert({
      admin_id: user.profileId,
      action: "test_action",
      resource_type: "test",
    });

    const { data } = await user.client.from("admin_logs").select("id");
    expect(data).toEqual([]);
  });

  it("blocks a non-admin from reading audit_logs", async () => {
    const user = await createTestUser();
    createdUserIds.push(user.userId);

    const { data } = await user.client.from("audit_logs").select("id").limit(1);
    expect(data).toEqual([]);
  });

  it("lets an admin read admin_logs", async () => {
    const admin = await createTestUser({ role: "admin" });
    createdUserIds.push(admin.userId);

    await adminClient.from("admin_logs").insert({
      admin_id: admin.profileId,
      action: "test_action_2",
      resource_type: "test",
    });

    const { data, error } = await admin.client.from("admin_logs").select("id").eq("action", "test_action_2");
    expect(error).toBeNull();
    expect(data?.length).toBeGreaterThan(0);
  });

  it("blocks a non-admin from reading refunds", async () => {
    const user = await createTestUser();
    createdUserIds.push(user.userId);

    const { data } = await user.client.from("refunds").select("id").limit(1);
    expect(data).toEqual([]);
  });
});
