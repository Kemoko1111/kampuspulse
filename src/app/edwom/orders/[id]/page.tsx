"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { use, useEffect, useState } from "react";
import {
  ArrowLeft, Package, Clock, CheckCircle, Truck, XCircle,
  Loader2, MapPin, Home, Bike, MessageSquare,
} from "lucide-react";
import { useOrders } from "@/hooks/index";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import type { Order, OrderItem } from "@/types";

interface OrderDelivery {
  id: string;
  status: string;
  rider_id: string | null;
  rider?: { full_name: string | null; phone: string | null } | null;
}

const DELIVERY_STATUS_LABEL: Record<string, string> = {
  searching: "Finding a rider…",
  accepted: "Rider assigned",
  en_route: "Rider heading to pickup",
  picked_up: "Picked up — on the way to you",
  delivered: "Delivered",
  cancelled: "Delivery cancelled",
};

// Delivery happy-path lifecycle. An order (a marketplace purchase) is NOT a
// ride — the old "Track" button pointed at /ezzyride/track/<orderId>, which
// loaded the ride tracker with an order id and always showed "Ride not found".
// This page tracks the order's own delivery status instead.
const STEPS = [
  { key: "confirmed",  label: "Confirmed",  description: "Your order has been placed and paid for", icon: CheckCircle },
  { key: "processing", label: "Processing", description: "The seller is preparing your items",       icon: Package },
  { key: "shipped",    label: "On the way", description: "Your order is out for delivery",           icon: Truck },
  { key: "delivered",  label: "Delivered",  description: "Your order has arrived",                   icon: Home },
];

export default function OrderTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { orders, loading } = useOrders();
  const [delivery, setDelivery] = useState<OrderDelivery | null>(null);

  const order = (orders as Order[]).find((o) => o.id === id) || null;

  // Fetch (and live-subscribe to) the rider delivery dispatched for this order.
  // RLS lets the buyer read it (deliveries_select: sender or rider; the buyer
  // is the sender). Shows who's delivering + their progress.
  useEffect(() => {
    const supabase = createClient();
    let active = true;

    const load = () => {
      supabase
        .from("deliveries")
        .select("id, status, rider_id, rider:profiles!deliveries_rider_id_fkey(full_name, phone)")
        .eq("order_id", id)
        .maybeSingle()
        .then(({ data }) => {
          if (active) setDelivery(data as OrderDelivery | null);
        });
    };
    load();

    const channel = supabase
      .channel(`order-delivery:${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "deliveries", filter: `order_id=eq.${id}` }, load)
      .subscribe();

    return () => { active = false; supabase.removeChannel(channel); };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <Package className="w-12 h-12 text-muted-foreground/30 mb-3" />
        <h2 className="font-display font-bold text-xl mb-1">Order not found</h2>
        <p className="text-muted-foreground text-sm mb-4">This order may have been removed, or it isn&apos;t yours.</p>
        <Link href="/edwom/orders" className="text-blue-400 hover:text-blue-300 text-sm font-medium">
          Back to My Orders
        </Link>
      </div>
    );
  }

  const isCancelled = order.status === "cancelled" || order.status === "refunded";
  // How far along the happy path we are. "pending" (pre-payment) sits before
  // step 0; anything not in STEPS (e.g. a status we don't render a step for)
  // clamps to the confirmed stage.
  const currentIndex = STEPS.findIndex((s) => s.key === order.status);
  const activeIndex = order.status === "delivered" ? STEPS.length - 1 : currentIndex;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <Link href="/edwom/orders" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to My Orders
      </Link>

      <div>
        <h1 className="font-display font-black text-2xl">Track Order</h1>
        <p className="text-muted-foreground text-sm">
          #{order.id.slice(0, 8).toUpperCase()} · placed {formatDate(order.created_at)}
        </p>
      </div>

      {isCancelled ? (
        <div className="glass-card p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
            <XCircle className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <p className="font-display font-bold">
              {order.status === "refunded" ? "Order refunded" : "Order cancelled"}
            </p>
            <p className="text-sm text-muted-foreground">
              {order.status === "refunded"
                ? "This order was refunded. The amount should return to your account shortly."
                : "This order was cancelled. If you were charged, a refund will follow."}
            </p>
          </div>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
          {order.status === "pending" && (
            <div className="mb-6 flex items-center gap-2 text-sm text-yellow-400">
              <Clock className="w-4 h-4" /> Awaiting payment confirmation…
            </div>
          )}
          <div className="space-y-6">
            {STEPS.map((step, i) => {
              const done = activeIndex >= i && order.status !== "pending";
              const current = activeIndex === i && order.status !== "pending";
              const Icon = step.icon;
              return (
                <div key={step.key} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border transition-colors ${
                      done ? "bg-blue-500/20 border-blue-500/40 text-blue-400" : "bg-white/5 border-white/10 text-muted-foreground/40"
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={`w-0.5 flex-1 min-h-[24px] mt-1 ${done && activeIndex > i ? "bg-blue-500/40" : "bg-white/10"}`} />
                    )}
                  </div>
                  <div className="pb-2">
                    <p className={`font-semibold text-sm ${done ? "text-foreground" : "text-muted-foreground/60"}`}>
                      {step.label}
                      {current && <span className="ml-2 text-[10px] uppercase tracking-wider text-blue-400 font-bold">Current</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {delivery && !isCancelled && (
        <div className="glass-card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
              <Bike className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">
                {delivery.rider?.full_name || (delivery.status === "searching" ? "Finding a rider…" : "Rider")}
              </p>
              <p className="text-xs text-muted-foreground">
                {DELIVERY_STATUS_LABEL[delivery.status] || delivery.status}
              </p>
            </div>
            {delivery.rider_id && delivery.status !== "delivered" && (
              <div className="flex items-center gap-2 flex-shrink-0">
                {delivery.rider?.phone && (
                  <a href={`tel:${delivery.rider.phone}`}
                    className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
                    <Truck className="w-4 h-4" />
                  </a>
                )}
                <Link href={`/messages?user=${delivery.rider_id}`}
                  className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
                  <MessageSquare className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {order.delivery_address && (
        <div className="glass-card p-5">
          <div className="flex items-start gap-3">
            <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Delivery address</p>
              <p className="text-sm font-medium">{order.delivery_address}</p>
            </div>
          </div>
        </div>
      )}

      <div className="glass-card p-5 space-y-3">
        <h2 className="font-display font-bold text-sm">Items</h2>
        {(order.items || []).map((item: OrderItem) => (
          <div key={item.id} className="flex items-center gap-3">
            {item.product?.images?.[0] ? (
              <Image src={item.product.images[0]} alt="" width={40} height={40} className="w-10 h-10 rounded-lg object-cover" />
            ) : (
              <Package className="w-5 h-5 text-muted-foreground/30" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{item.product?.title || "Product"}</p>
              <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
            </div>
            <span className="font-bold text-sm flex-shrink-0">GHS {item.unit_price.toLocaleString()}</span>
          </div>
        ))}
        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <span className="text-xs text-muted-foreground">Total</span>
          <span className="font-display font-black text-base text-blue-400">GHS {order.total_amount.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
