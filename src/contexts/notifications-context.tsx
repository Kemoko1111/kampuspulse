"use client";

import { createContext, useContext } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRealtimeNotifications } from "@/hooks";
import type { Notification } from "@/types";

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAllRead: () => Promise<void>;
  markOneRead: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

// Single subscription point for the whole app. useRealtimeNotifications opens a
// Supabase Realtime channel named `notifications:${userId}` and throws if a
// second subscribe() is attempted on the same channel name — so every consumer
// (nav badges, home page, notifications page) must share one hook instance via
// this context rather than each calling useRealtimeNotifications directly.
export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const value = useRealtimeNotifications(user?.id ?? null);

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within a NotificationsProvider");
  return ctx;
}
