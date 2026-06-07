"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ShoppingBag, Briefcase, Bike, ArrowRight,
  TrendingUp, Package, Star, Bell, Search,
  Flame, Clock, MapPin, ChevronRight, Zap,
  ShieldCheck, Gift,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useRealtimeNotifications, useOrders } from "@/hooks";
import { createClient } from "@/lib/supabase/client";
import { formatRelativeTime } from "@/lib/utils";

const modules = [
  {
    id: "edwom", name: "EDWOM", subtitle: "Student Marketplace",
    desc: "Shop products, textbooks, electronics & more",
    icon: ShoppingBag, href: "/edwom", color: "#60a5fa",
    gradient: "from-blue-900/80 to-blue-700/80", bg: "module-card-edwom",
    badge: "🛍️",
  },
  {
    id: "y3adwuma", name: "Y3 ADWUMA", subtitle: "Task Platform",
    desc: "Post or complete campus tasks & earn GHS",
    icon: Briefcase, href: "/y3adwuma", color: "#34d399",
    gradient: "from-emerald-900/80 to-emerald-700/80", bg: "module-card-y3adwuma",
    badge: "💼",
  },
  {
    id: "ezzyride", name: "EZZYRIDE", subtitle: "Campus Rides",
    desc: "Book rides & deliveries across campus",
    icon: Bike, href: "/ezzyride", color: "#a78bfa",
    gradient: "from-purple-900/80 to-purple-700/80", bg: "module-card-ezzyride",
    badge: "🏍️",
  },
];

const promos = [
  { title: "🎉 50% OFF on Electronics", sub: "Limited time on EDWOM", gradient: "from-blue-600 to-blue-400", href: "/edwom" },
  { title: "💼 New Tasks Available", sub: "Earn GHS 200+ today", gradient: "from-emerald-600 to-emerald-400", href: "/y3adwuma" },
  { title: "🏍️ Free First Ride", sub: "Try EZZYRIDE with CAMPUS1", gradient: "from-purple-600 to-purple-400", href: "/ezzyride" },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const activityIcons: Record<string, { icon: React.ElementType; color: string }> = {
  order_update: { icon: Package, color: "text-blue-400" },
  task_update:  { icon: Briefcase, color: "text-emerald-400" },
  ride_update:  { icon: Bike, color: "text-purple-400" },
  message:      { icon: Flame, color: "text-orange-400" },
};

export default function HomePage() {
  const { profile, user } = useAuth();
  const { notifications, unreadCount } = useRealtimeNotifications(user?.id ?? null);
  const { orders } = useOrders();
  const [liveTasks, setLiveTasks] = useState(0);
  const [liveRides, setLiveRides] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    const fetchStats = async () => {
      const [{ count: tasks }, { count: rides }] = await Promise.all([
        supabase.from("tasks").select("id", { count: "exact", head: true }).eq("status", "open"),
        supabase.from("rides").select("id", { count: "exact", head: true }).eq("status", "searching"),
      ]);
      setLiveTasks(tasks ?? 0);
      setLiveRides(rides ?? 0);
    };
    if (user) fetchStats();
  }, [user, supabase]);

  const quickStats = [
    { label: "Orders", value: String(orders.length || 0), icon: Package, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Tasks", value: String(liveTasks), icon: Briefcase, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Rating", value: profile?.rating ? `${profile.rating}★` : "—", icon: Star, color: "text-yellow-400", bg: "bg-yellow-500/10" },
    { label: "Alerts", value: String(unreadCount), icon: Bell, color: "text-red-400", bg: "bg-red-500/10" },
  ];

  const moduleStats: Record<string, string> = {
    edwom: "Marketplace open",
    y3adwuma: `${liveTasks} open tasks`,
    ezzyride: `${liveRides} riders online`,
  };

  const recentActivity = (notifications as any[]).slice(0, 4);

  return (
    <div className="min-h-screen">
      <div className="fixed top-0 right-0 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">

        {/* ── GREETING ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-muted-foreground text-sm">{getGreeting()}, 👋</p>
              <h1 className="font-display font-black text-3xl md:text-4xl text-foreground">
                {profile?.full_name?.split(" ")[0] || "Welcome"}
              </h1>
              <div className="flex items-center gap-1.5 mt-1">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs text-muted-foreground">
                  {profile?.hall_of_residence || "UCC Campus"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Link href="/notifications" className="w-10 h-10 rounded-xl glass border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
                  <Bell className="w-4 h-4" />
                </Link>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input id="home-search" type="search"
              placeholder="Search products, tasks, or locations..."
              className="input-premium pl-11 pr-4 py-3.5 text-sm" />
          </div>
        </motion.div>

        {/* ── PROMOS ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
            {promos.map(({ title, sub, gradient, href }, i) => (
              <Link key={i} href={href} className="flex-none w-72 snap-start">
                <div className={`bg-gradient-to-r ${gradient} rounded-2xl p-5 h-28 flex flex-col justify-between hover:scale-[1.02] transition-transform`}>
                  <div className="text-white font-display font-bold text-sm">{title}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/80 text-xs">{sub}</span>
                    <ArrowRight className="w-4 h-4 text-white" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* ── LIVE STATS ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="grid grid-cols-4 gap-3">
            {quickStats.map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="glass-card p-3 text-center">
                <div className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center mx-auto mb-2`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <div className={`font-display font-black text-lg ${color}`}>{value}</div>
                <div className="text-[10px] text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── MODULES ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-xl">Our Platforms</h2>
            <span className="text-xs text-muted-foreground">All 3 active</span>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {modules.map(({ id, name, subtitle, desc, icon: Icon, href, gradient, bg, badge }) => (
              <motion.div key={id} whileHover={{ scale: 1.02, y: -4 }} whileTap={{ scale: 0.98 }}>
                <Link href={href}>
                  <div className={`relative overflow-hidden rounded-2xl p-6 h-48 ${bg} cursor-pointer group`}>
                    <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
                    <div className="relative z-10 h-full flex flex-col justify-between">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-3xl mb-1">{badge}</div>
                          <h3 className="font-display font-black text-xl text-white">{name}</h3>
                          <p className="text-white/70 text-xs">{subtitle}</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white/80 text-xs mb-1">{desc}</p>
                          <span className="text-[10px] font-semibold text-white/60 bg-white/10 rounded-full px-2 py-0.5">
                            {moduleStats[id] || "—"}
                          </span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-white/10 group-hover:bg-white/20 transition-all flex items-center justify-center">
                          <ArrowRight className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── RECENT ACTIVITY (from real notifications) ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-xl">Recent Activity</h2>
            <Link href="/notifications" className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="glass-card divide-y divide-white/5 overflow-hidden">
            {recentActivity.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                No recent activity yet. Start shopping, tasking or riding!
              </div>
            ) : recentActivity.map((notif: any, i) => {
              const cfg = activityIcons[notif.type] || { icon: Bell, color: "text-blue-400" };
              const Icon = cfg.icon;
              return (
                <div key={notif.id || i} className="flex items-center gap-4 p-4 hover:bg-white/3 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                    <Icon className={`w-5 h-5 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{notif.title}</p>
                    <p className="text-xs text-muted-foreground">{formatRelativeTime(notif.created_at)}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${
                    notif.is_read ? "bg-white/5 text-muted-foreground" : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                  }`}>
                    {notif.is_read ? "Read" : "New"}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* ── QUICK ACTIONS ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h2 className="font-display font-bold text-xl mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Shop Now", icon: ShoppingBag, href: "/edwom", color: "text-blue-400", bg: "bg-blue-500/10" },
              { label: "Post Task", icon: Briefcase, href: "/y3adwuma/post-task", color: "text-emerald-400", bg: "bg-emerald-500/10" },
              { label: "Book Ride", icon: Bike, href: "/ezzyride", color: "text-purple-400", bg: "bg-purple-500/10" },
              { label: "My Orders", icon: Package, href: "/edwom/orders", color: "text-orange-400", bg: "bg-orange-500/10" },
            ].map(({ label, icon: Icon, href, color, bg }) => (
              <Link key={label} href={href}>
                <div className="glass-card p-4 flex flex-col items-center gap-2 hover:scale-105 transition-all cursor-pointer text-center">
                  <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <span className="text-xs font-medium text-foreground">{label}</span>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* ── CAMPUS DEALS ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <div className="glass-card p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10" />
            <div className="relative flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center glow-blue flex-shrink-0">
                <Gift className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-display font-bold text-lg">Campus Deals 🔥</h3>
                <p className="text-sm text-muted-foreground">Exclusive offers for UCC students every day</p>
              </div>
              <Link href="/edwom" className="btn-primary text-sm px-4 py-2 flex items-center gap-1 flex-shrink-0">
                Shop <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
