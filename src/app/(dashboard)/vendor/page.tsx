"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ShoppingBag, DollarSign, Package, TrendingUp,
  Plus, MoreVertical, Star, CheckCircle, Clock, Loader2,
} from "lucide-react";
import { TopBar } from "@/components/layout/navigation";
import { useAuth } from "@/contexts/auth-context";
import { apiFetch } from "@/lib/api-client";
import { formatRelativeTime } from "@/lib/utils";

interface VendorOrder {
  id: string;
  status: string;
  payment_status: string;
  total_amount: number;
  created_at: string;
  items?: { product?: { title?: string; images?: string[] } }[];
}

interface VendorDashboard {
  orders: VendorOrder[];
  products: { id: string; title: string; status: string }[];
  metrics: {
    totalRevenue: number;
    totalOrders: number;
    pendingOrders: number;
    activeProducts: number;
  };
}

export default function VendorDashboard() {
  const { profile } = useAuth();
  const [dashboard, setDashboard] = useState<VendorDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/vendor/dashboard")
      .then(async (res) => {
        if (res.ok) {
          const { data } = await res.json();
          setDashboard(data);
        }
        setLoading(false);
      });
  }, []);

  const metrics = dashboard?.metrics;
  const recentOrders = dashboard?.orders?.slice(0, 5) || [];

  return (
    <div className="flex flex-col min-h-screen pb-20 lg:pb-8">
      <TopBar title="Vendor Dashboard" />

      <main className="flex-1 p-4 max-w-7xl mx-auto w-full space-y-6 lg:pt-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">
              Hello, {profile?.full_name?.split(" ")[0] || "Vendor"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Here&apos;s what&apos;s happening with your store today.
            </p>
          </div>
          <Link href="/edwom/sell" className="btn-primary flex items-center justify-center gap-2 py-2 px-4 whitespace-nowrap w-full md:w-auto">
            <Plus className="w-4 h-4" /> Add New Product
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4 border-emerald-500/20">
                <div className="flex items-start justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  {metrics && metrics.totalRevenue > 0 && (
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> Paid
                    </span>
                  )}
                </div>
                <div className="text-2xl font-bold">GHS {(metrics?.totalRevenue || 0).toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Total Revenue</div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold">{metrics?.totalOrders || 0}</div>
                <div className="text-xs text-muted-foreground">Total Orders</div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                    <Package className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold">{metrics?.activeProducts || 0}</div>
                <div className="text-xs text-muted-foreground">Active Products</div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-400">
                    <Star className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold">{profile?.rating?.toFixed(1) || "—"}</div>
                <div className="text-xs text-muted-foreground">Store Rating</div>
              </motion.div>
            </div>

            <div className="glass-card border border-white/5 overflow-hidden">
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <h2 className="font-semibold text-lg">Recent Orders</h2>
                <span className="text-xs text-muted-foreground">
                  {metrics?.pendingOrders || 0} pending
                </span>
              </div>

              {recentOrders.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">No orders yet</div>
              ) : (
                <div className="divide-y divide-white/5">
                  {recentOrders.map((order) => {
                    const productTitle = order.items?.[0]?.product?.title || "Order";
                    const isPending = order.status === "pending" || order.status === "confirmed" || order.payment_status === "pending";

                    return (
                      <div key={order.id} className="p-4 hover:bg-white/5 transition-colors flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0 border border-white/10 overflow-hidden">
                            {order.items?.[0]?.product?.images?.[0] ? (
                              <img src={order.items[0].product.images[0]} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <ShoppingBag className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-sm text-foreground truncate">{productTitle}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-2">
                              <span>{order.id.slice(0, 8).toUpperCase()}</span>
                              <span>•</span>
                              <span>{formatRelativeTime(order.created_at)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 flex-shrink-0">
                          <div className="text-right hidden sm:block">
                            <div className="font-bold text-sm">GHS {Number(order.total_amount).toFixed(2)}</div>
                            {isPending ? (
                              <span className="text-[10px] font-medium text-orange-400 flex items-center gap-1 justify-end">
                                <Clock className="w-3 h-3" /> Pending
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium text-green-400 flex items-center gap-1 justify-end">
                                <CheckCircle className="w-3 h-3" /> {order.payment_status === "paid" ? "Paid" : order.status}
                              </span>
                            )}
                          </div>
                          <button className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-muted-foreground transition-colors">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
