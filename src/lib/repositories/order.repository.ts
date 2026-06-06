import type { TypedSupabaseClient } from "@/lib/supabase/types";

export class OrderRepository {
  constructor(private supabase: TypedSupabaseClient) {}

  async findByProfile(profileId: string, status?: string) {
    let query = this.supabase
      .from("orders")
      .select(`
        *,
        items:order_items(*, product:products(id, title, images)),
        buyer:profiles!orders_buyer_id_fkey(id, full_name, avatar_url),
        seller:profiles!orders_seller_id_fkey(id, full_name, avatar_url)
      `)
      .or(`buyer_id.eq.${profileId},seller_id.eq.${profileId}`)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (status) query = query.eq("status", status);
    return query;
  }

  async findById(id: string) {
    return this.supabase
      .from("orders")
      .select(`*, items:order_items(*, product:products(*))`)
      .eq("id", id)
      .single();
  }

  async create(order: Record<string, unknown>, items: Record<string, unknown>[]) {
    const { data: orderData, error: orderError } = await this.supabase
      .from("orders")
      .insert(order as never)
      .select()
      .single();

    if (orderError) throw orderError;

    const orderItems = items.map((item) => ({ ...item, order_id: (orderData as { id: string }).id }));
    const { error: itemsError } = await this.supabase.from("order_items").insert(orderItems as never);
    if (itemsError) throw itemsError;

    return orderData;
  }

  async update(id: string, data: Record<string, unknown>) {
    return this.supabase.from("orders").update(data as never).eq("id", id).select().single();
  }
}
