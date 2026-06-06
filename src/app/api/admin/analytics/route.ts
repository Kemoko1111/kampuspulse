import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/errors/app-error";
import { requireRole } from "@/lib/middleware/auth";

export async function GET() {
  try {
    const { supabase } = await requireRole(["admin"]);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [users, orders, revenue, tasks, rides] = await Promise.all([
      supabase.from("profiles").select("created_at").gte("created_at", thirtyDaysAgo.toISOString()),
      supabase.from("orders").select("created_at, total_amount").gte("created_at", thirtyDaysAgo.toISOString()),
      supabase.from("transactions").select("amount, created_at").eq("status", "success").gte("created_at", thirtyDaysAgo.toISOString()),
      supabase.from("tasks").select("created_at, status").gte("created_at", thirtyDaysAgo.toISOString()),
      supabase.from("rides").select("created_at, status").gte("created_at", thirtyDaysAgo.toISOString()),
    ]);

    return NextResponse.json({
      data: {
        userGrowth: users.data || [],
        orders: orders.data || [],
        revenue: revenue.data || [],
        tasks: tasks.data || [],
        rides: rides.data || [],
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
