"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import {
  Star, Package, Briefcase, Bike, Edit, Settings, Bell,
  Shield, MapPin, Calendar, Loader2, User, LogOut,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useProfile, useOrders } from "@/hooks";
import { formatCurrency, formatDate, getInitials } from "@/lib/utils";

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const { profile, loading } = useProfile();
  const { orders } = useOrders();
  const [activeTab, setActiveTab] = useState("all");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-4">
        <div>
          <User className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">Profile not found.</p>
          <Link href="/login" className="text-blue-400 text-sm mt-2 inline-block">Sign in →</Link>
        </div>
      </div>
    );
  }

  const p = profile as any;
  const initials = getInitials(p.full_name || user?.email || "U");
  const walletBalance = p.wallet?.balance ?? 0;

  const quickStats = [
    { label: "Orders",      value: String(orders.length || 0), icon: Package,   color: "text-blue-400" },
    { label: "Rating",      value: p.rating ? `${Number(p.rating).toFixed(1)}` : "—", icon: Star, color: "text-yellow-400" },
    { label: "Reviews",     value: String(p.total_reviews || 0), icon: Star,    color: "text-purple-400" },
    { label: "Member Since", value: formatDate(p.created_at).split(" ")[2] || "2024", icon: Calendar, color: "text-emerald-400" },
  ];

  const filteredOrders = orders as any[];

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ── PROFILE HEADER ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-purple-600/5" />
          <div className="relative flex items-start gap-5">
            <div className="relative flex-shrink-0">
              {p.avatar_url ? (
                <img src={p.avatar_url} alt={p.full_name} className="w-20 h-20 rounded-2xl object-cover" />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-white text-2xl font-black">
                  {initials}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 status-dot-online border-2 border-background" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h1 className="font-display font-black text-2xl text-foreground">{p.full_name || "No name set"}</h1>
                  <p className="text-muted-foreground text-sm">
                    {p.department ? `${p.department} · ` : ""}
                    {p.year_of_study ? `Level ${p.year_of_study * 100}` : p.role}
                  </p>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    {p.hall_of_residence && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5 text-blue-400" />{p.hall_of_residence}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5 text-blue-400" />Joined {formatDate(p.created_at)}
                    </span>
                    {p.is_verified && (
                      <span className="badge-new flex items-center gap-1"><Shield className="w-3 h-3" /> Verified</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Link href="/settings" className="flex items-center gap-1.5 glass border border-white/10 rounded-xl px-3 py-2 text-sm font-medium hover:bg-white/10 transition-all">
                    <Edit className="w-3.5 h-3.5" /> Edit
                  </Link>
                  <button onClick={signOut} className="flex items-center gap-1.5 glass border border-red-500/20 text-red-400 rounded-xl px-3 py-2 text-sm font-medium hover:bg-red-500/10 transition-all">
                    <LogOut className="w-3.5 h-3.5" /> Sign Out
                  </button>
                </div>
              </div>
              {p.bio && (
                <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{p.bio}</p>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── STATS ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="grid grid-cols-4 gap-4">
            {quickStats.map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="glass-card p-4 text-center">
                <Icon className={`w-6 h-6 ${color} mx-auto mb-2`} />
                <div className={`font-display font-black text-2xl ${color}`}>{value}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── WALLET ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="glass-card p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/10 to-blue-600/10" />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">CampusPulse Wallet</p>
                <div className="font-display font-black text-4xl text-foreground">{formatCurrency(walletBalance)}</div>
                <p className="text-xs text-muted-foreground mt-1">Available balance</p>
              </div>
              <div className="flex flex-col gap-2">
                <button className="btn-primary text-sm px-4 py-2">Top Up</button>
                <button className="glass border border-white/10 rounded-xl px-4 py-2 text-sm font-medium hover:bg-white/10 transition-all">Withdraw</button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── ORDER HISTORY ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-xl">Order History</h2>
          </div>
          <div className="glass-card divide-y divide-white/5 overflow-hidden">
            {filteredOrders.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                No orders yet. <Link href="/edwom" className="text-blue-400 hover:underline">Start shopping!</Link>
              </div>
            ) : filteredOrders.slice(0, 5).map((order: any, i: number) => (
              <div key={order.id || i} className="flex items-center gap-4 p-4 hover:bg-white/3 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <Package className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {order.items?.[0]?.product?.title || `Order #${order.id?.slice(0, 8).toUpperCase()}`}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-foreground">{formatCurrency(order.total_amount)}</p>
                  <span className={`text-xs ${order.status === "delivered" ? "text-green-400" : order.status === "cancelled" ? "text-red-400" : "text-orange-400"}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── QUICK LINKS ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "My Listings",   href: "/edwom",          icon: Package,   color: "text-blue-400",    bg: "bg-blue-500/10" },
              { label: "My Tasks",      href: "/y3adwuma",       icon: Briefcase, color: "text-emerald-400", bg: "bg-emerald-500/10" },
              { label: "Notifications", href: "/notifications",  icon: Bell,      color: "text-yellow-400",  bg: "bg-yellow-500/10" },
              { label: "Settings",      href: "/settings",       icon: Settings,  color: "text-muted-foreground", bg: "bg-white/5" },
            ].map(({ label, href, icon: Icon, color, bg }) => (
              <Link key={label} href={href}>
                <div className="glass-card p-4 flex items-center gap-3 hover:scale-[1.02] transition-all cursor-pointer">
                  <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <span className="font-medium text-sm text-foreground">{label}</span>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
