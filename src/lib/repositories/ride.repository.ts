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

  async findAvailableRiders(lat: number, lng: number) {
    return this.supabase
      .from("rider_profiles")
      .select(`*, profile:profiles!rider_profiles_user_id_fkey(id, full_name, avatar_url, phone)`)
      .eq("is_available", true)
      .eq("is_verified", true)
      .not("current_lat", "is", null)
      .not("current_lng", "is", null);
  }

  async updateRiderLocation(profileId: string, lat: number, lng: number) {
    return this.supabase
      .from("rider_profiles")
      .update({ current_lat: lat, current_lng: lng } as never)
      .eq("user_id", profileId)
      .select()
      .single();
  }

  async updateRiderAvailability(profileId: string, isAvailable: boolean) {
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
