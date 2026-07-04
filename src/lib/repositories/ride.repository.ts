import type { TypedSupabaseClient } from "@/lib/supabase/types";

export class RideRepository {
  constructor(private supabase: TypedSupabaseClient) {}

  async create(data: Record<string, unknown>) {
    return this.supabase.from("rides").insert(data as never).select().single();
  }

  async findById(id: string) {
    return this.supabase
      .from("rides")
      .select(`
        *,
        passenger:profiles!rides_passenger_id_fkey(id, full_name, avatar_url, phone),
        rider:profiles!rides_rider_id_fkey(id, full_name, avatar_url, phone)
      `)
      .eq("id", id)
      .single();
  }

  async update(id: string, data: Record<string, unknown>) {
    return this.supabase.from("rides").update(data as never).eq("id", id).select().single();
  }

  async findAvailableRiders() {
    return this.supabase
      .from("rider_profiles")
      .select(`*, profile:profiles!rider_profiles_user_id_fkey(id, full_name, avatar_url, phone)`)
      .eq("is_available", true)
      .eq("is_verified", true)
      .not("current_lat", "is", null)
      .not("current_lng", "is", null);
  }

  // Neither the new-user signup trigger nor the admin-panel "promote to
  // rider" path (PATCH /api/admin/users/[id]) ever inserts a rider_profiles
  // row — both only touch profiles.role. Without this, a rider's very first
  // "go online" or location update fails outright (update matches zero rows,
  // .single() throws). Ensuring the row exists here, rather than chasing
  // every place role could become "rider", is what actually closes the gap.
  private async ensureRiderProfile(profileId: string) {
    const { data } = await this.supabase
      .from("rider_profiles")
      .select("id")
      .eq("user_id", profileId)
      .maybeSingle();

    if (!data) {
      // is_verified: true so a brand-new rider is immediately matchable —
      // findAvailableRiders requires it, and this app has no separate
      // document-verification step. Admins can revoke via the admin panel.
      await this.supabase
        .from("rider_profiles")
        .insert({ user_id: profileId, vehicle_type: "motorbike", is_verified: true } as never);
    }
  }

  async updateRiderLocation(profileId: string, lat: number, lng: number) {
    await this.ensureRiderProfile(profileId);
    return this.supabase
      .from("rider_profiles")
      .update({ current_lat: lat, current_lng: lng } as never)
      .eq("user_id", profileId)
      .select()
      .single();
  }

  async updateRiderAvailability(profileId: string, isAvailable: boolean) {
    await this.ensureRiderProfile(profileId);
    return this.supabase
      .from("rider_profiles")
      .update({ is_available: isAvailable } as never)
      .eq("user_id", profileId)
      .select()
      .single();
  }

  async createDelivery(data: Record<string, unknown>) {
    return this.supabase.from("deliveries").insert(data as never).select().single();
  }

  async findDeliveryById(id: string) {
    return this.supabase
      .from("deliveries")
      .select(`*, sender:profiles!deliveries_sender_id_fkey(id, full_name, avatar_url)`)
      .eq("id", id)
      .single();
  }

  async updateDelivery(id: string, data: Record<string, unknown>) {
    return this.supabase.from("deliveries").update(data as never).eq("id", id).select().single();
  }
}
