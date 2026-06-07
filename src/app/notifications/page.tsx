"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Bell, Check, Package, Briefcase, Bike, MessageSquare, Tag, Info, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useRealtimeNotifications } from "@/hooks";
import { formatRelativeTime } from "@/lib/utils";

const typeConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  order_update: { icon: Package,      color: "text-blue-400",    bg: "bg-blue-500/10" },
  task_update:  { icon: Briefcase,    color: "text-emerald-400", bg: "bg-emerald-500/10" },
  message:      { icon: MessageSquare,color: "text-purple-400",  bg: "bg-purple-500/10" },
  ride_update:  { icon: Bike,         color: "text-orange-400",  bg: "bg-orange-500/10" },
  promotion:    { icon: Tag,          color: "text-yellow-400",  bg: "bg-yellow-500/10" },
  system:       { icon: Info,         color: "text-green-400",   bg: "bg-green-500/10" },
  review:       { icon: Bell,         color: "text-blue-400",    bg: "bg-blue-500/10" },
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const { notifications, unreadCount, loading, markAllRead, markOneRead } = useRealtimeNotifications(user?.id ?? null);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-5">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
            <div>
              <h1 className="font-display font-black text-3xl">Notifications</h1>
              {unreadCount > 0 && <p className="text-sm text-muted-foreground">{unreadCount} unread</p>}
            </div>
            {unreadCount > 0 && (
              <button id="mark-all-read" onClick={markAllRead}
                className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium">
                <Check className="w-4 h-4" /> Mark all read
              </button>
            )}
          </motion.div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-16">
              <Bell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <h2 className="font-display font-bold text-lg mb-1">All caught up!</h2>
              <p className="text-muted-foreground text-sm">No notifications yet. Start using the platform!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {(notifications as any[]).map((notif: any, i: number) => {
                const cfg = typeConfig[notif.type] || typeConfig.system;
                const Icon = cfg.icon;
                return (
                  <motion.div key={notif.id}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    onClick={() => !notif.is_read && markOneRead(notif.id)}
                    className={`flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${
                      notif.is_read
                        ? "glass border-white/5 opacity-70 hover:opacity-100"
                        : "glass-card border-blue-500/10 hover:border-blue-500/20"
                    }`}>
                    <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <Icon className={`w-5 h-5 ${cfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className={`font-semibold text-sm ${notif.is_read ? "text-muted-foreground" : "text-foreground"}`}>
                          {notif.title}
                        </h3>
                        {!notif.is_read && <div className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0 mt-1.5" />}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{notif.body}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1.5">{formatRelativeTime(notif.created_at)}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
    </div>
  );
}
