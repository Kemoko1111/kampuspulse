"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Package, Search, Clock,
  CheckCircle, Truck, XCircle, Star, MessageSquare,
  Loader2,
} from "lucide-react";
import { useOrders } from "@/hooks/index";
import { formatDate } from "@/lib/utils";
import type { Order, OrderItem } from "@/types";

const statusConfig: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  pending:    { label: "Pending",    color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20", icon: Clock },
  confirmed:  { label: "Confirmed",  color: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-500/20",   icon: CheckCircle },
  processing: { label: "Processing", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20", icon: Truck },
  shipped:    { label: "Shipped",    color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20", icon: Truck },
  delivered:  { label: "Delivered",  color: "text-green-400",  bg: "bg-green-500/10",  border: "border-green-500/20",  icon: CheckCircle },
  cancelled:  { label: "Cancelled",  color: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/20",    icon: XCircle },
  refunded:   { label: "Refunded",   color: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/20",    icon: XCircle },
};

const tabs = ["All", "Active", "Delivered", "Cancelled"];

const ACTIVE_STATUSES = ["pending", "confirmed", "processing", "shipped"];

export default function OrdersPage() {
  const { orders, loading } = useOrders();
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");

  const orderList = orders as Order[];

  const filtered = useMemo(() => orderList.filter(order => {
    const matchTab =
      activeTab === "All" ? true :
      activeTab === "Active" ? ACTIVE_STATUSES.includes(order.status) :
      activeTab === "Delivered" ? order.status === "delivered" :
      order.status === "cancelled" || order.status === "refunded";
    const matchSearch = order.id.toLowerCase().includes(search.toLowerCase()) ||
      (order.items || []).some((i: OrderItem) => i.product?.title?.toLowerCase().includes(search.toLowerCase()));
    return matchTab && matchSearch;
  }), [orderList, activeTab, search]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
            <div>
              <h1 className="font-display font-black text-3xl">My Orders</h1>
              <p className="text-muted-foreground text-sm">{orderList.length} total orders</p>
            </div>
          </motion.div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="search" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by order ID or item..." className="input-premium pl-9 text-sm" />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {tabs.map(tab => (
              <button key={tab} id={`order-tab-${tab.toLowerCase()}`} onClick={() => setActiveTab(tab)}
                className={`flex-none px-4 py-2 rounded-full text-xs font-medium transition-all border ${
                  activeTab === tab ? "bg-blue-500 text-white border-blue-500" : "glass border-white/10 text-muted-foreground hover:text-foreground"
                }`}>{tab}</button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.length === 0 ? (
                <div className="text-center py-16">
                  <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">No orders found</p>
                </div>
              ) : filtered.map((order, i) => {
                const cfg = statusConfig[order.status] || statusConfig.pending;
                const Icon = cfg.icon;
                const sellerName = (order as Order & { seller?: { full_name?: string } }).seller?.full_name || "Seller";

                return (
                  <motion.div key={order.id}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="glass-card p-5">
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div>
                        <div className="font-mono text-xs text-muted-foreground mb-0.5">{order.id.slice(0, 8).toUpperCase()}</div>
                        <div className="font-semibold text-sm text-foreground">{sellerName}</div>
                        <div className="text-xs text-muted-foreground">{formatDate(order.created_at)}</div>
                      </div>
                      <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                        <Icon className="w-3.5 h-3.5" />
                        {cfg.label}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      {(order.items || []).map((item: OrderItem) => (
                        <div key={item.id} className="flex items-center gap-3 p-2.5 glass border border-white/10 rounded-xl">
                          {item.product?.images?.[0] ? (
                            <img src={item.product.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover" />
                          ) : (
                            <Package className="w-5 h-5 text-muted-foreground/30" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.product?.title || "Product"}</p>
                            <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                          </div>
                          <span className="font-bold text-sm text-foreground flex-shrink-0">GHS {item.unit_price.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-white/10">
                      <div>
                        <span className="text-xs text-muted-foreground">Total: </span>
                        <span className="font-display font-black text-base text-blue-400">GHS {order.total_amount.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {order.status === "delivered" && (
                          <button className="flex items-center gap-1.5 text-xs text-yellow-400 glass border border-yellow-500/20 rounded-lg px-3 py-1.5 hover:bg-yellow-500/10 transition-all">
                            <Star className="w-3.5 h-3.5" /> Review
                          </button>
                        )}
                        {ACTIVE_STATUSES.includes(order.status) && order.status !== "pending" && (
                          <Link href={`/ezzyride/track/${order.id}`}
                            className="flex items-center gap-1.5 text-xs text-blue-400 glass border border-blue-500/20 rounded-lg px-3 py-1.5 hover:bg-blue-500/10 transition-all">
                            <Truck className="w-3.5 h-3.5" /> Track
                          </Link>
                        )}
                        <button className="flex items-center gap-1.5 text-xs text-muted-foreground glass border border-white/10 rounded-lg px-3 py-1.5 hover:bg-white/10 transition-all">
                          <MessageSquare className="w-3.5 h-3.5" /> Help
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
    </div>
  );
}
