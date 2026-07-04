import type { TypedSupabaseClient } from "@/lib/supabase/types";

export class WishlistRepository {
  constructor(private supabase: TypedSupabaseClient) {}

  async findByUser(profileId: string) {
    return this.supabase
      .from("wishlists")
      .select(`
        product_id,
        created_at,
        product:products(id, title, price, images, stock_quantity, seller_id, status, rating, total_reviews, original_price)
      `)
      .eq("user_id", profileId)
      .order("created_at", { ascending: false });
  }

  async add(profileId: string, productId: string) {
    return this.supabase
      .from("wishlists")
      .upsert(
        { user_id: profileId, product_id: productId } as never,
        { onConflict: "user_id,product_id", ignoreDuplicates: true }
      )
      .select()
      .maybeSingle();
  }

  async remove(profileId: string, productId: string) {
    return this.supabase
      .from("wishlists")
      .delete()
      .eq("user_id", profileId)
      .eq("product_id", productId);
  }
}
