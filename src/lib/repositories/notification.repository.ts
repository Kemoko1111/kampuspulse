import type { TypedSupabaseClient } from "@/lib/supabase/types";

export class NotificationRepository {
  constructor(private supabase: TypedSupabaseClient) {}

  async create(data: { user_id: string; type: string; title: string; body: string; data?: Record<string, unknown> }) {
    return this.supabase.from("notifications").insert(data as never).select().single();
  }

  async findByUser(profileId: string) {
    return this.supabase
      .from("notifications")
      .select("*")
      .eq("user_id", profileId)
      .order("created_at", { ascending: false })
      .limit(50);
  }

  async markRead(id: string) {
    return this.supabase.from("notifications").update({ is_read: true } as never).eq("id", id);
  }

  async markAllRead(profileId: string) {
    return this.supabase
      .from("notifications")
      .update({ is_read: true } as never)
      .eq("user_id", profileId)
      .eq("is_read", false);
  }

  async countUnread(profileId: string) {
    return this.supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", profileId)
      .eq("is_read", false);
  }
}
