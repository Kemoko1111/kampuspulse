import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/errors/app-error";
import { requireRole } from "@/lib/middleware/auth";

export async function GET() {
  try {
    const { supabase, profile } = await requireRole(["vendor", "student", "admin"]);

    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select(`*, items:order_items(*, product:products(title, images))`)
      .eq("seller_id", profile.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(20);

    if (ordersError) return NextResponse.json({ error: ordersError.message }, { status: 500 });

    const { data: products } = await supabase
      .from("products")
      .select("id, title, status, stock_quantity, price")
      .eq("seller_id", profile.id)
      .is("deleted_at", null);

    type OrderRow = { payment_status: string; total_amount: number; status: string };
    type ProductRow = { status: string };
    const orderList = (orders || []) as OrderRow[];
    const productList = (products || []) as ProductRow[];

    const totalRevenue = orderList
      .filter((o) => o.payment_status === "paid")
      .reduce((sum, o) => sum + Number(o.total_amount), 0);

    const pendingOrders = orderList.filter((o) => o.status === "pending" || o.status === "confirmed").length;

    return NextResponse.json({
      data: {
        orders: orderList,
        products: productList,
        metrics: {
          totalRevenue,
          totalOrders: orderList.length,
          pendingOrders,
          activeProducts: productList.filter((p) => p.status === "active").length,
        },
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
