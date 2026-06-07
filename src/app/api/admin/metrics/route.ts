import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  // Verify admin role
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if ((profile as { role: string } | null)?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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

  return NextResponse.json({
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
  });
}
