"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Package, Users, ShoppingBag, Bike,
  DollarSign, Clock, Loader2, RefreshCcw,
  ArrowRight, TrendingUp,
} from "lucide-react";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import { StatCard } from "@/components/admin/stat-card";
import { ChartCard } from "@/components/admin/chart-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { PageHeader } from "@/components/admin/page-header";

interface AdminMetrics {
  totalUsers: number;
  totalStudents: number;
  totalProducts: number;
  totalRiders: number;
  pendingApprovals: number;
  totalOrders: number;
  ordersToday: number;
  totalRevenue: number;
  todayRevenue: number;
  totalTasks: number;
  totalRides: number;
}

interface AdminOrder {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  buyer?: { full_name: string } | null;
  seller?: { full_name: string } | null;
}

interface AdminProduct {
  id: string;
  title: string;
  price: number;
  stock_quantity: number;
  status: string;
}

interface AdminTransaction {
  id: string;
  amount: number;
  type: string;
  status: string;
  payment_method?: string;
  created_at: string;
}

interface DashboardData {
  metrics: AdminMetrics;
  recentOrders: AdminOrder[];
  recentProducts: AdminProduct[];
  recentTransactions: AdminTransaction[];
  revenueByDay: Record<string, number>;
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/metrics");
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Transform revenueByDay into chart data (last 7 days)
  const chartData = (() => {
    if (!data?.revenueByDay) return [];
    const entries = Object.entries(data.revenueByDay).sort(([a], [b]) => a.localeCompare(b));
    const last7 = entries.slice(-7);
    return last7.map(([date, value]) => ({
      label: new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
      value,
    }));
  })();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          <p className="text-sm text-muted-foreground">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  const m = data?.metrics;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        subtitle="Overview of your platform activity"
        actions={
          <button onClick={fetchData} className="btn-ghost flex items-center gap-2 text-sm">
            <RefreshCcw className="w-4 h-4" /> Refresh
          </button>
        }
      />

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Today's Orders" value={m?.ordersToday ?? 0} icon={Package} color="blue" index={0} />
        <StatCard title="Pending Orders" value={m?.pendingApprovals ?? 0} icon={Clock} color="yellow" index={1} />
        <StatCard title="Total Orders" value={m?.totalOrders ?? 0} icon={Package} color="green" index={2} />
        <StatCard title="Active Riders" value={m?.totalRiders ?? 0} icon={Bike} color="purple" index={3} />
        <StatCard title="Today's Revenue" value={formatCurrency(m?.todayRevenue ?? 0)} icon={DollarSign} color="green" index={4} />
        <StatCard title="Total Revenue" value={formatCurrency(m?.totalRevenue ?? 0)} icon={DollarSign} color="blue" index={5} />
        <StatCard title="Students" value={m?.totalStudents ?? 0} icon={Users} color="orange" index={6} />
        <StatCard title="Products" value={m?.totalProducts ?? 0} icon={ShoppingBag} color="red" index={7} />
      </div>

      {/* ── Revenue Chart ── */}
      {chartData.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <ChartCard title="Revenue (Last 7 Days)" data={chartData} color="#3b82f6" />
        </motion.div>
      )}

      {/* ── Recent Activity ── */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card overflow-hidden">
          <div className="p-5 border-b border-white/5">
            <h2 className="font-display font-bold text-lg flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-400" /> Recent Orders
            </h2>
          </div>
          <div className="divide-y divide-white/5">
            {(data?.recentOrders ?? []).length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">No orders yet</div>
            ) : (
              (data?.recentOrders ?? []).slice(0, 6).map((order) => (
                <div key={order.id} className="px-5 py-3 flex items-center justify-between hover:bg-white/5 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground">#{order.id.slice(0, 8)}</span>
                      <StatusBadge status={order.status} variant="order" />
                    </div>
                    <p className="text-sm font-medium mt-0.5 truncate">
                      {(order.buyer as any)?.full_name || "Unknown Customer"}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <div className="text-sm font-display font-bold text-blue-400">
                      {formatCurrency(order.total_amount)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatRelativeTime(order.created_at)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="p-4 border-t border-white/5">
            <Link href="/admin/orders" className="flex items-center justify-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium">
              View all orders <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>

        {/* Recent Products */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card overflow-hidden">
          <div className="p-5 border-b border-white/5">
            <h2 className="font-display font-bold text-lg flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-orange-400" /> Recent Products
            </h2>
          </div>
          <div className="divide-y divide-white/5">
            {(data?.recentProducts ?? []).length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">No products yet</div>
            ) : (
              (data?.recentProducts ?? []).slice(0, 6).map((product) => (
                <div key={product.id} className="px-5 py-3 flex items-center justify-between hover:bg-white/5 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{product.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <StatusBadge status={product.status} />
                      <span className="text-xs text-muted-foreground">
                        Stock: {product.stock_quantity}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <div className="text-sm font-display font-bold text-orange-400">
                      {formatCurrency(product.price)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="p-4 border-t border-white/5">
            <Link href="/admin/shop" className="flex items-center justify-center gap-2 text-sm text-orange-400 hover:text-orange-300 transition-colors font-medium">
              View all products <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      </div>

      {/* ── Recent Transactions ── */}
      {(data?.recentTransactions ?? []).length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="glass-card overflow-hidden">
          <div className="p-5 border-b border-white/5">
            <h2 className="font-display font-bold text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" /> Recent Transactions
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">ID</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Type</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Method</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Status</th>
                  <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">Amount</th>
                  <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {(data?.recentTransactions ?? []).slice(0, 8).map((tx) => (
                  <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-5 py-3 text-xs font-mono text-muted-foreground">#{tx.id.slice(0, 8)}</td>
                    <td className="px-5 py-3 text-sm capitalize">{tx.type}</td>
                    <td className="px-5 py-3 text-sm text-muted-foreground capitalize">{tx.payment_method || "—"}</td>
                    <td className="px-5 py-3"><StatusBadge status={tx.status} variant="payment" /></td>
                    <td className="px-5 py-3 text-sm font-display font-bold text-right text-green-400">{formatCurrency(tx.amount)}</td>
                    <td className="px-5 py-3 text-xs text-muted-foreground text-right">{formatRelativeTime(tx.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}
