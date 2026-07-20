import { NextResponse } from "next/server";
import { requireRole } from "@/lib/middleware/auth";
import { handleApiError } from "@/lib/errors/app-error";
import { getOrSetCache } from "@/lib/cache";
import type { TypedSupabaseClient } from "@/lib/supabase/types";

// 17 queries (several full-table counts) on every dashboard load, with no
// caching, will degrade linearly as tables grow. The data is identical for
// every admin viewing it (nothing per-request/per-user), so a short-TTL
// shared cache trades a little staleness (up to 30s) for cutting real load
// on a dashboard that gets polled/reloaded often. The admin-role check still
// runs on every request regardless of cache state — only the expensive query
// fan-out is skipped on a cache hit.
export async function GET() {
  try {
    const { supabase } = await requireRole(["admin"]);
    const data = await getOrSetCache("admin:metrics", 30, () => fetchMetrics(supabase));
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}

async function fetchMetrics(supabase: TypedSupabaseClient) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString();

  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

  const [
    usersResult,
    studentsResult,
    productsResult,
    ridersResult,
    pendingResult,
    ordersResult,
    ordersTodayResult,
    revenueResult,
    revenueTodayResult,
    tasksResult,
    ridesResult,
    recentUsersResult,

    pendingRidersResult,
    recentTransactionsResult,
    monthlyRevenueResult,
    recentOrdersResult,
    recentProductsResult,
  ] = await Promise.all([
    // Total users
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    // Students
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student"),
    // Products
    supabase.from("products").select("id", { count: "exact", head: true }),
    // Riders
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "rider"),
    // Pending approvals
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status", "pending"),
    // Total orders
    supabase.from("orders").select("id", { count: "exact", head: true }),
    // Orders today
    supabase.from("orders").select("id", { count: "exact", head: true }).gte("created_at", todayISO),
    // Total revenue (successful payments)
    supabase.from("transactions").select("amount").eq("status", "success").eq("type", "payment"),
    // Revenue today
    supabase.from("transactions").select("amount").eq("status", "success").eq("type", "payment").gte("created_at", todayISO),
    // Total tasks
    supabase.from("tasks").select("id", { count: "exact", head: true }),
    // Total rides
    supabase.from("rides").select("id", { count: "exact", head: true }),
    // Recent users (last 10)
    supabase.from("profiles").select("id, full_name, role, status, created_at, avatar_url").order("created_at", { ascending: false }).limit(10),

    // Pending rider approvals
    supabase.from("profiles").select("id, full_name, role, created_at, avatar_url").eq("role", "rider").eq("status", "pending").limit(5),
    // Recent transactions
    supabase.from("transactions").select("id, amount, type, status, payment_method, created_at, user_id").order("created_at", { ascending: false }).limit(10),
    // Monthly revenue (last 30 days by day)
    supabase.from("transactions").select("amount, created_at").eq("status", "success").eq("type", "payment").gte("created_at", thisMonth),
    // Recent orders
    supabase.from("orders").select(`
      id, total_amount, status, created_at,
      buyer:buyer_id (full_name),
      seller:seller_id (full_name)
    `).order("created_at", { ascending: false }).limit(10),
    // Recent products
    supabase.from("products").select("id, title, price, stock_quantity, status, created_at").order("created_at", { ascending: false }).limit(20),
  ]);

  const totalRevenue = (revenueResult.data as { amount: number }[] | null)?.reduce((sum, t) => sum + t.amount, 0) || 0;
  const todayRevenue = (revenueTodayResult.data as { amount: number }[] | null)?.reduce((sum, t) => sum + t.amount, 0) || 0;

  // Aggregate monthly revenue by day
  const revenueByDay: Record<string, number> = {};
  (monthlyRevenueResult.data as { created_at: string; amount: number }[] | null)?.forEach((t) => {
    const day = t.created_at.split("T")[0];
    revenueByDay[day] = (revenueByDay[day] || 0) + t.amount;
  });

  return {
    metrics: {
      totalUsers: usersResult.count || 0,
      totalStudents: studentsResult.count || 0,
      totalProducts: productsResult.count || 0,
      totalRiders: ridersResult.count || 0,
      pendingApprovals: pendingResult.count || 0,
      totalOrders: ordersResult.count || 0,
      ordersToday: ordersTodayResult.count || 0,
      totalRevenue,
      todayRevenue,
      totalTasks: tasksResult.count || 0,
      totalRides: ridesResult.count || 0,
    },
    recentUsers: recentUsersResult.data || [],
    pendingApprovals: [
      ...(pendingRidersResult.data || []),
    ],
    recentTransactions: recentTransactionsResult.data || [],
    recentOrders: recentOrdersResult.data || [],
    recentProducts: recentProductsResult.data || [],
    revenueByDay,
  };
}
