"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard, Users, ShoppingBag, Bike,
  Briefcase, AlertCircle, CheckCircle,
  XCircle, Shield, BarChart3, DollarSign,
  Package, Star, Settings, Ban, Check,
  ArrowUp, Activity, Loader2,
} from "lucide-react";
import { cn, formatRelativeTime, formatCurrency, getInitials } from "@/lib/utils";
import { apiFetch } from "@/lib/api-client";

const sidebarLinks = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "users", label: "Users", icon: Users },
  { id: "marketplace", label: "Marketplace", icon: ShoppingBag },
  { id: "riders", label: "Riders", icon: Bike },
  { id: "tasks", label: "Tasks", icon: Briefcase },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "payments", label: "Payments", icon: DollarSign },
  { id: "settings", label: "Settings", icon: Settings },
];

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

interface AdminUser {
  id: string;
  full_name: string;
  role: string;
  status: string;
  created_at: string;
  avatar_url?: string;
}

interface AdminTransaction {
  id: string;
  amount: number;
  type: string;
  status: string;
  payment_method?: string;
  created_at: string;
}

interface AdminData {
  metrics: AdminMetrics;
  recentUsers: AdminUser[];
  pendingApprovals: AdminUser[];
  recentTransactions: AdminTransaction[];
  revenueByDay: Record<string, number>;
}

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState("overview");
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/metrics");
    if (res.ok) {
      setData(await res.json());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const updateUser = async (userId: string, body: { status?: string; role?: string }) => {
    setActionLoading(userId);
    const res = await apiFetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    if (res.ok) await fetchMetrics();
    setActionLoading(null);
  };

  const metricsCards = data ? [
    { label: "Total Users", value: data.metrics.totalUsers.toLocaleString(), sub: `${data.metrics.totalStudents} students`, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Total Revenue", value: formatCurrency(data.metrics.totalRevenue), sub: `${formatCurrency(data.metrics.todayRevenue)} today`, icon: DollarSign, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Total Orders", value: data.metrics.totalOrders.toLocaleString(), sub: `${data.metrics.ordersToday} today`, icon: Package, color: "text-orange-400", bg: "bg-orange-500/10" },
    { label: "Active Tasks", value: data.metrics.totalTasks.toLocaleString(), sub: `${data.metrics.totalRides} rides`, icon: Briefcase, color: "text-purple-400", bg: "bg-purple-500/10" },
    { label: "Total Riders", value: data.metrics.totalRiders.toLocaleString(), sub: `${data.metrics.totalRides} rides given`, icon: Bike, color: "text-cyan-400", bg: "bg-cyan-500/10" },
    { label: "Pending Approvals", value: data.metrics.pendingApprovals.toLocaleString(), sub: "awaiting review", icon: Star, color: "text-yellow-400", bg: "bg-yellow-500/10" },
  ] : [];

  const revenueDays = data
    ? Object.entries(data.revenueByDay).sort(([a], [b]) => a.localeCompare(b))
    : [];
  const maxRevenue = revenueDays.length
    ? Math.max(...revenueDays.map(([, v]) => v))
    : 1;

  const roleLabel = (role: string) =>
    role.charAt(0).toUpperCase() + role.slice(1);

  if (loading && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-60 glass border-r border-white/5 z-50 p-4">
        <div className="flex items-center gap-2.5 px-2 py-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 to-orange-400 flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="font-display font-black text-base text-foreground">Admin Panel</div>
            <div className="text-[10px] text-muted-foreground">KampusPulse v1.0</div>
          </div>
        </div>
        <nav className="flex-1 space-y-1">
          {sidebarLinks.map(({ id, label, icon: Icon }) => (
            <button key={id} id={`admin-nav-${id}`} onClick={() => setActiveSection(id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left",
                activeSection === id
                  ? "bg-red-500/10 text-red-400 border border-red-500/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              )}>
              <Icon className="w-4 h-4 flex-shrink-0" /> {label}
            </button>
          ))}
        </nav>
        <div className="border-t border-white/5 pt-4 mt-4">
          <Link href="/home" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all">
            <LayoutDashboard className="w-4 h-4" /> Back to App
          </Link>
        </div>
      </aside>

      <main className="flex-1 lg:pl-60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
            <div>
              <h1 className="font-display font-black text-3xl">Admin <span className="text-red-400">Dashboard</span></h1>
              <p className="text-muted-foreground text-sm">KampusPulse – University of Cape Coast</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 glass border border-green-500/20 rounded-full px-3 py-1.5">
                <Activity className="w-3.5 h-3.5 text-green-400" />
                <span className="text-xs font-medium text-green-400">All Systems Normal</span>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {metricsCards.map(({ label, value, sub, icon: Icon, color, bg }, i) => (
              <motion.div key={label}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="glass-card p-4">
                <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <div className={`font-display font-black text-xl ${color} mb-0.5`}>{value}</div>
                <div className="text-[10px] text-muted-foreground mb-1">{label}</div>
                <div className="flex items-center gap-0.5 text-[10px] font-medium text-green-400">
                  <ArrowUp className="w-3 h-3" />
                  {sub}
                </div>
              </motion.div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-1">
              <div className="glass-card p-5 h-full">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display font-bold text-base">Pending Approvals</h2>
                  <span className="w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                    {data?.pendingApprovals.length ?? 0}
                  </span>
                </div>
                <div className="space-y-3">
                  {(data?.pendingApprovals ?? []).length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">No pending approvals</p>
                  ) : (
                    data?.pendingApprovals.map(({ id, full_name, role, created_at }) => (
                      <div key={id} className="p-3 glass border border-white/10 rounded-xl">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <div className="font-semibold text-sm">{full_name}</div>
                            <div className="text-xs text-muted-foreground">{roleLabel(role)} · {formatRelativeTime(created_at)}</div>
                          </div>
                          <span className="text-[10px] bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded-full px-2 py-0.5 flex-shrink-0">Pending</span>
                        </div>
                        <div className="flex gap-2">
                          <button id={`approve-${id}`}
                            disabled={actionLoading === id}
                            onClick={() => updateUser(id, { status: "active" })}
                            className="flex-1 flex items-center justify-center gap-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg py-1.5 text-xs font-medium hover:bg-green-500/20 transition-all disabled:opacity-50">
                            <Check className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button id={`reject-${id}`}
                            disabled={actionLoading === id}
                            onClick={() => updateUser(id, { status: "banned" })}
                            className="flex-1 flex items-center justify-center gap-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg py-1.5 text-xs font-medium hover:bg-red-500/20 transition-all disabled:opacity-50">
                            <XCircle className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <div className="glass-card p-5 h-full">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display font-bold text-base">Recent Users</h2>
                  <button className="text-xs text-blue-400">View all</button>
                </div>
                <div className="space-y-3">
                  {(data?.recentUsers ?? []).map(({ id, full_name, role, created_at, status }) => (
                    <div key={id} className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {getInitials(full_name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate">{full_name}</div>
                        <div className="text-xs text-muted-foreground">{roleLabel(role)} · {formatRelativeTime(created_at)}</div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className={cn(
                          "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                          status === "active" ? "bg-green-500/10 text-green-400 border-green-500/20" :
                          status === "pending" ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" :
                          "bg-red-500/10 text-red-400 border-red-500/20"
                        )}>{status}</span>
                        {status === "active" && (
                          <button
                            disabled={actionLoading === id}
                            onClick={() => updateUser(id, { status: "suspended" })}
                            className="w-7 h-7 rounded-lg glass border border-white/10 flex items-center justify-center hover:bg-red-500/10 transition-all disabled:opacity-50"
                            title="Suspend user">
                            <Ban className="w-3 h-3 text-red-400" />
                          </button>
                        )}
                        {status === "suspended" && (
                          <button
                            disabled={actionLoading === id}
                            onClick={() => updateUser(id, { status: "active" })}
                            className="w-7 h-7 rounded-lg glass border border-white/10 flex items-center justify-center hover:bg-green-500/10 transition-all disabled:opacity-50"
                            title="Reactivate user">
                            <CheckCircle className="w-3 h-3 text-green-400" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <div className="glass-card p-5 h-full">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display font-bold text-base">Recent Transactions</h2>
                  <button className="text-xs text-blue-400">View all</button>
                </div>
                <div className="space-y-3">
                  {(data?.recentTransactions ?? []).map(({ id, amount, type, status, created_at }) => (
                    <div key={id} className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-xs text-foreground font-mono">{id.slice(0, 8).toUpperCase()}</div>
                        <div className="text-[10px] text-muted-foreground">{type} · {formatRelativeTime(created_at)}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-bold text-sm text-foreground">{formatCurrency(amount)}</div>
                        <span className={cn(
                          "text-[10px] font-medium",
                          status === "success" ? "text-green-400" : "text-red-400"
                        )}>{status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-bold text-lg">Revenue (This Month)</h2>
            </div>
            {revenueDays.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No revenue data this month</p>
            ) : (
              <>
                <div className="flex items-end gap-2 h-32">
                  {revenueDays.map(([day, amount]) => (
                    <div key={day}
                      className="flex-1 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-sm opacity-80 hover:opacity-100 transition-opacity"
                      style={{ height: `${Math.max((amount / maxRevenue) * 100, 4)}%` }}
                      title={`${day}: ${formatCurrency(amount)}`} />
                  ))}
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground mt-2">
                  <span>{revenueDays[0]?.[0]}</span>
                  <span>{revenueDays[Math.floor(revenueDays.length / 2)]?.[0]}</span>
                  <span>{revenueDays[revenueDays.length - 1]?.[0]}</span>
                </div>
              </>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <h2 className="font-display font-bold text-lg mb-4">Quick Moderation</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Total Products", count: data?.metrics.totalProducts ?? 0, icon: ShoppingBag, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" },
                { label: "Pending Approvals", count: data?.metrics.pendingApprovals ?? 0, icon: Briefcase, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
                { label: "Total Tasks", count: data?.metrics.totalTasks ?? 0, icon: Star, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
                { label: "Total Rides", count: data?.metrics.totalRides ?? 0, icon: AlertCircle, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
              ].map(({ label, count, icon: Icon, color, bg, border }) => (
                <div key={label} className={`glass-card p-4 border ${border} hover:scale-105 transition-all cursor-pointer`}>
                  <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <div className={`font-display font-black text-2xl ${color}`}>{count}</div>
                  <div className="text-xs text-muted-foreground">{label}</div>
                </div>
              ))}
            </div>
          </motion.div>

        </div>
      </main>
    </div>
  );
}
