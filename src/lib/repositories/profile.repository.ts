import type { TypedSupabaseClient } from "@/lib/supabase/types";

export class ProfileRepository {
  constructor(private supabase: TypedSupabaseClient) {}

  async findByUserId(userId: string) {
    const { data, error } = await this.supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .single();
    if (error) throw error;
    return data;
  }

  async findById(id: string) {
    const { data, error } = await this.supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .single();
    if (error) throw error;
    return data;
  }

  async update(id: string, updates: Record<string, unknown>) {
    const { data, error } = await this.supabase
      .from("profiles")
      .update(updates as never)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}
