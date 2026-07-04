"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import {
  Package, Search, Clock,
  CheckCircle, Truck, XCircle, Star, MessageSquare,
  Loader2, X, Send,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useOrders } from "@/hooks/index";
import { useAuth } from "@/contexts/auth-context";
import { createClient } from "@/lib/supabase/client";
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
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null);
  const [reviewProductId, setReviewProductId] = useState<string>("");
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const orderList = orders as Order[];

  const openReviewModal = (order: Order) => {
    setReviewOrder(order);
    setReviewProductId(order.items?.[0]?.product_id || "");
    setReviewRating(0);
    setReviewComment("");
  };

  const closeReviewModal = () => {
    setReviewOrder(null);
  };

  const submitReview = async () => {
    if (!reviewOrder || !reviewRating || !reviewProductId || !profile) return;
    setSubmittingReview(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("reviews").insert({
        reviewer_id: profile.id,
        reviewed_id: reviewOrder.seller_id,
        type: "product",
        reference_id: reviewProductId,
        rating: reviewRating,
        comment: reviewComment || null,
      } as never);

      if (error) throw error;
      toast.success("Thanks for your review!");
      closeReviewModal();
    } catch {
      toast.error("Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

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
                            <Image src={item.product.images[0]} alt="" width={40} height={40} className="w-10 h-10 rounded-lg object-cover" />
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
                          <button onClick={() => openReviewModal(order)}
                            className="flex items-center gap-1.5 text-xs text-yellow-400 glass border border-yellow-500/20 rounded-lg px-3 py-1.5 hover:bg-yellow-500/10 transition-all">
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

          {/* Review Modal */}
          {reviewOrder && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="glass border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative">
                <button onClick={closeReviewModal} className="absolute top-4 right-4 text-muted-foreground hover:text-white">
                  <X className="w-5 h-5" />
                </button>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto bg-yellow-500/10 rounded-full flex items-center justify-center mb-3">
                    <Star className="w-8 h-8 text-yellow-400" />
                  </div>
                  <h3 className="font-display font-bold text-2xl">Leave a Review</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    How was {(reviewOrder as Order & { seller?: { full_name?: string } }).seller?.full_name || "the seller"}&apos;s product?
                  </p>
                </div>

                {(reviewOrder.items || []).length > 1 && (
                  <div className="mb-4">
                    <label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Which item?</label>
                    <select value={reviewProductId} onChange={e => setReviewProductId(e.target.value)}
                      className="w-full input-premium mt-1 text-sm">
                      {(reviewOrder.items || []).map((item: OrderItem) => (
                        <option key={item.product_id} value={item.product_id}>
                          {item.product?.title || "Product"}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex justify-center gap-2 mb-6">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} onClick={() => setReviewRating(star)} className="focus:outline-none transition-transform hover:scale-110">
                      <Star className={`w-10 h-10 ${reviewRating >= star ? "fill-yellow-400 text-yellow-400" : "text-white/20"}`} />
                    </button>
                  ))}
                </div>

                <textarea
                  placeholder="Leave a comment (optional)"
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  className="w-full input-premium h-24 mb-4 resize-none"
                />

                <button onClick={submitReview} disabled={!reviewRating || submittingReview}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-600 to-yellow-500 text-white font-bold py-3.5 rounded-2xl hover:opacity-90 transition-opacity disabled:opacity-50">
                  {submittingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Submit Review
                </button>
              </motion.div>
            </div>
          )}
    </div>
  );
}
