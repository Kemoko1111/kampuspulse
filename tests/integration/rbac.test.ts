import { describe, it, expect, afterAll } from "vitest";
import { adminClient, createTestUser, deleteTestUser } from "./helpers";

// Real RBAC/RLS enforcement tests, replacing the old tests/auth/rbac.test.ts
// which only asserted against hardcoded local arrays — it would have passed
// even if the actual database-level enforcement were deleted. These exercise
// the real policies against a live Postgres instance.
describe("RBAC / RLS enforcement", () => {
  const createdUserIds: string[] = [];
  afterAll(async () => {
    await Promise.all(createdUserIds.map(deleteTestUser));
  });

  describe("platform_settings (migration 017)", () => {
    it("lets a non-admin read platform_settings", async () => {
      const user = await createTestUser();
      createdUserIds.push(user.userId);

      const { data, error } = await user.client.from("platform_settings").select("key").limit(1);
      expect(error).toBeNull();
      expect(data).not.toBeNull();
    });

    it("blocks a non-admin from writing platform_settings", async () => {
      const user = await createTestUser();
      createdUserIds.push(user.userId);

      // A distinctive marker rather than a boolean — this row is a shared
      // singleton across test runs, so asserting against a fixed prior value
      // would be flaky depending on what a previous run last left behind.
      const baseline = `baseline-${Math.random()}`;
      await adminClient.from("platform_settings").upsert({ key: "app_settings", value: { marker: baseline } }, { onConflict: "key" });

      await user.client
        .from("platform_settings")
        .upsert({ key: "app_settings", value: { marker: "hijacked" } }, { onConflict: "key" });

      const { data: after } = await adminClient.from("platform_settings").select("value").eq("key", "app_settings").maybeSingle();
      expect((after?.value as { marker?: string } | undefined)?.marker).toBe(baseline);
    });

    it("lets an admin write platform_settings", async () => {
      const admin = await createTestUser({ role: "admin" });
      createdUserIds.push(admin.userId);

      const { error } = await admin.client
        .from("platform_settings")
        .upsert({ key: "app_settings", value: { maintenanceMode: true } }, { onConflict: "key" });
      expect(error).toBeNull();

      const { data } = await adminClient.from("platform_settings").select("value").eq("key", "app_settings").single();
      expect((data?.value as { maintenanceMode?: boolean }).maintenanceMode).toBe(true);
    });
  });

  describe("rider_profiles (migration 030)", () => {
    it("lets a rider read their own rider_profiles row", async () => {
      const rider = await createTestUser({ role: "rider" });
      createdUserIds.push(rider.userId);
      await adminClient.from("rider_profiles").insert({ user_id: rider.profileId, vehicle_type: "motorbike" });

      const { data, error } = await rider.client.from("rider_profiles").select("id").eq("user_id", rider.profileId).maybeSingle();
      expect(error).toBeNull();
      expect(data).not.toBeNull();
    });

    it("blocks an unrelated user (no active ride) from reading another rider's location", async () => {
      const rider = await createTestUser({ role: "rider" });
      const bystander = await createTestUser();
      createdUserIds.push(rider.userId, bystander.userId);
      await adminClient
        .from("rider_profiles")
        .insert({ user_id: rider.profileId, vehicle_type: "motorbike", current_lat: 5.1, current_lng: -1.2 });

      const { data } = await bystander.client.from("rider_profiles").select("id, current_lat, current_lng").eq("user_id", rider.profileId).maybeSingle();
      expect(data).toBeNull();
    });
  });

  describe("products ownership (migration 009)", () => {
    it("blocks a user from updating someone else's product listing", async () => {
      const seller = await createTestUser();
      const attacker = await createTestUser();
      createdUserIds.push(seller.userId, attacker.userId);

      const { data: product } = await adminClient
        .from("products")
        .insert({ seller_id: seller.profileId, title: "Original title", price: 20, stock_quantity: 1 })
        .select()
        .single();

      await attacker.client.from("products").update({ title: "Hijacked" }).eq("id", product!.id);

      const { data: after } = await adminClient.from("products").select("title").eq("id", product!.id).single();
      expect(after?.title).toBe("Original title");
    });

    it("lets a seller update their own product listing", async () => {
      const seller = await createTestUser();
      createdUserIds.push(seller.userId);

      const { data: product } = await adminClient
        .from("products")
        .insert({ seller_id: seller.profileId, title: "Original title", price: 20, stock_quantity: 1 })
        .select()
        .single();

      const { error } = await seller.client.from("products").update({ title: "Updated by owner" }).eq("id", product!.id);
      expect(error).toBeNull();

      const { data: after } = await adminClient.from("products").select("title").eq("id", product!.id).single();
      expect(after?.title).toBe("Updated by owner");
    });
  });
});
