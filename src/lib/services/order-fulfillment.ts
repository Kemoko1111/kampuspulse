import type { TypedSupabaseClient } from "@/lib/supabase/types";

// Called once when an order's payment is CONFIRMED. Stock decrement and cart
// clearing happen here (at success) rather than at order creation, so an
// abandoned or failed payment never silently loses inventory or empties the
// buyer's cart. Callers must invoke this exactly once per order (the webhook's
// transaction guard and the single dev-payment path both ensure that).
export async function fulfillPaidOrder(supabase: TypedSupabaseClient, orderId: string) {
  const { data: orderRow } = await supabase
    .from("orders")
    .select("buyer_id")
    .eq("id", orderId)
    .single();
  const buyerId = (orderRow as { buyer_id: string } | null)?.buyer_id;

  const { data: items } = await supabase
    .from("order_items")
    .select("product_id, quantity")
    .eq("order_id", orderId);

  for (const item of (items || []) as { product_id: string; quantity: number }[]) {
    const { data: ok, error } = await supabase.rpc("decrement_product_stock", {
      p_product_id: item.product_id,
      p_quantity: item.quantity,
    } as never);
    // A false/error here means the item sold out between order creation and
    // payment (rare, low-concurrency) — the order is paid but short on stock,
    // which needs manual resolution. Log rather than fail the payment webhook.
    if (error || !ok) {
      console.error(`Stock decrement failed for product ${item.product_id} on order ${orderId}`);
    }
  }

  if (buyerId) {
    await supabase.from("cart_items").delete().eq("user_id", buyerId);
  }
}
