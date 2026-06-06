import type { TypedSupabaseClient } from "@/lib/supabase/types";

export class CartRepository {
  constructor(private supabase: TypedSupabaseClient) {}

  async findByUser(profileId: string) {
    return this.supabase
      .from("cart_items")
      .select(`
        *,
        product:products(id, title, price, images, stock_quantity, seller_id, status)
      `)
      .eq("user_id", profileId);
  }

  async upsert(profileId: string, productId: string, quantity: number) {
    return this.supabase
      .from("cart_items")
      .upsert({ user_id: profileId, product_id: productId, quantity } as never, { onConflict: "user_id,product_id" })
      .select()
      .single();
  }

  async remove(profileId: string, productId: string) {
    return this.supabase
      .from("cart_items")
      .delete()
      .eq("user_id", profileId)
      .eq("product_id", productId);
  }

  async clear(profileId: string) {
    return this.supabase.from("cart_items").delete().eq("user_id", profileId);
  }
}
