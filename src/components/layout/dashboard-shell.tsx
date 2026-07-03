"use client";

import { Sidebar, MobileNav, TopBar } from "@/components/layout/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useRealtimeNotifications } from "@/hooks";

/** Single app shell — use only in route layouts, never inside page components. */
export function DashboardShell({ children }: { children: React.ReactNode }) {
  // Subscribed once here (not inside Sidebar/TopBar) — both are mounted at the
  // same time (shown/hidden via CSS, not conditional rendering), so calling
  // useRealtimeNotifications independently in each raced to open a Realtime
  // channel with the same topic name and crashed with "cannot add
  // postgres_changes callbacks ... after subscribe()".
  const { user } = useAuth();
  const { unreadCount } = useRealtimeNotifications(user?.id ?? null);

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
