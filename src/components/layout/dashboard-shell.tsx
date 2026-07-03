"use client";

import { Sidebar, MobileNav, TopBar } from "@/components/layout/navigation";
import { useNotifications } from "@/contexts/notifications-context";

/** Single app shell — use only in route layouts, never inside page components. */
export function DashboardShell({ children }: { children: React.ReactNode }) {
  // unreadCount comes from the app-wide NotificationsProvider (see
  // notifications-context.tsx) rather than calling useRealtimeNotifications
  // directly here — that hook opens a Supabase Realtime channel and throws if
  // more than one component tries to subscribe to the same channel name, so
  // every consumer (this shell, home page, notifications page) must share one
  // subscription via context.
  const { unreadCount } = useNotifications();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar unreadCount={unreadCount} />
      <TopBar unreadCount={unreadCount} />
      <main className="lg:pl-64 pb-20 lg:pb-0 min-h-screen">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
