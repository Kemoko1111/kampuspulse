import type { TypedSupabaseClient } from "@/lib/supabase/types";

export class TaskRepository {
  constructor(private supabase: TypedSupabaseClient) {}

  async findMany(params: { category?: string; search?: string; urgent?: boolean; limit: number; offset: number }) {
    let query = this.supabase
      .from("tasks")
      .select(`*, poster:profiles!tasks_poster_id_fkey(id, full_name, avatar_url, rating)`, { count: "exact" })
      .is("deleted_at", null)
      .in("status", ["open", "assigned", "in_progress"]);

    if (params.category) query = query.eq("category", params.category);
    if (params.search) query = query.or(`title.ilike.%${params.search}%,description.ilike.%${params.search}%`);
    if (params.urgent) query = query.eq("is_urgent", true);

    return query
      .order("created_at", { ascending: false })
      .range(params.offset, params.offset + params.limit - 1);
  }

  async findById(id: string) {
    return this.supabase
      .from("tasks")
      .select(`
        *,
        poster:profiles!tasks_poster_id_fkey(id, full_name, avatar_url, rating),
        assignee:profiles!tasks_assignee_id_fkey(id, full_name, avatar_url, rating),
        applications:task_applications(*, applicant:profiles!task_applications_applicant_id_fkey(id, full_name, avatar_url, rating))
      `)
      .eq("id", id)
      .single();
  }

  async create(data: Record<string, unknown>) {
    return this.supabase.from("tasks").insert(data as never).select().single();
  }

  async update(id: string, data: Record<string, unknown>) {
    return this.supabase.from("tasks").update(data as never).eq("id", id).select().single();
  }

  async softDelete(id: string) {
    return this.supabase
      .from("tasks")
      .update({ deleted_at: new Date().toISOString(), status: "cancelled" } as never)
      .eq("id", id)
      .select()
      .single();
  }

  async createApplication(data: Record<string, unknown>) {
    return this.supabase.from("task_applications").insert(data as never).select().single();
  }

  async updateApplication(id: string, data: Record<string, unknown>) {
    return this.supabase.from("task_applications").update(data as never).eq("id", id).select().single();
  }

  async rejectOtherApplications(taskId: string, acceptedId: string) {
    return this.supabase
      .from("task_applications")
      .update({ status: "rejected" } as never)
      .eq("task_id", taskId)
      .neq("id", acceptedId)
      .eq("status", "pending");
  }
}
