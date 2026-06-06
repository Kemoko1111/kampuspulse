"use client";

export { useCart } from "./useCart";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Message } from "@/types";

export function useRealtimeMessages(roomId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeout = useRef<ReturnType<typeof setTimeout>>();
  const supabase = createClient();

  const fetchMessages = useCallback(async () => {
    if (!roomId) return;
    setLoading(true);
    const res = await fetch(`/api/messages/${roomId}`);
    if (res.ok) {
      const { data } = await res.json();
      setMessages(data || []);
    }
    setLoading(false);
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;
    fetchMessages();

    // Subscribe to new messages via Supabase Realtime
    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          // Fetch full message with sender profile
          const { data } = await supabase
            .from("messages")
            .select(`
              *,
              sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url)
            `)
            .eq("id", payload.new.id)
            .single();

          if (data) {
            setMessages((prev) => [...prev, data as Message]);
          }
        }
      )
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        setIsTyping(payload.isTyping);
        clearTimeout(typingTimeout.current);
        if (payload.isTyping) {
          typingTimeout.current = setTimeout(() => setIsTyping(false), 3000);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      clearTimeout(typingTimeout.current);
    };
  }, [roomId, fetchMessages, supabase]);

  const sendMessage = useCallback(
    async (content: string, type: "text" | "image" = "text") => {
      if (!roomId || !content.trim()) return;

      const res = await fetch(`/api/messages/${roomId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim(), type }),
      });

      return res.ok;
    },
    [roomId]
  );

  const sendTypingIndicator = useCallback(
    async (isTypingNow: boolean) => {
      if (!roomId) return;
      const channel = supabase.channel(`room:${roomId}`);
      await channel.send({
        type: "broadcast",
        event: "typing",
        payload: { isTyping: isTypingNow },
      });
    },
    [roomId, supabase]
  );

  return { messages, loading, isTyping, sendMessage, sendTypingIndicator, refetch: fetchMessages };
}

export function useRealtimeNotifications(userId: string | null) {
  const [notifications, setNotifications] = useState<unknown[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchNotifications = useCallback(async () => {
    const res = await fetch("/api/notifications");
    if (res.ok) {
      const { data, unreadCount: count } = await res.json();
      setNotifications(data || []);
      setUnreadCount(count || 0);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!userId) return;
    fetchNotifications();

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new, ...prev]);
          setUnreadCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, fetchNotifications, supabase]);

  const markAllRead = useCallback(async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    setNotifications((prev) =>
      prev.map((n: unknown) => ({ ...(n as object), is_read: true }))
    );
    setUnreadCount(0);
  }, []);

  const markOneRead = useCallback(async (id: string) => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setNotifications((prev) =>
      prev.map((n: unknown) => {
        const notif = n as { id: string };
        return notif.id === id ? { ...notif, is_read: true } : notif;
      })
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  return { notifications, unreadCount, loading, markAllRead, markOneRead, refetch: fetchNotifications };
}

export function useProducts(filters?: {
  category?: string;
  search?: string;
  condition?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
}) {
  const [products, setProducts] = useState<unknown[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (filters?.category) params.set("category", filters.category);
    if (filters?.search) params.set("search", filters.search);
    if (filters?.condition) params.set("condition", filters.condition);
    if (filters?.minPrice) params.set("minPrice", String(filters.minPrice));
    if (filters?.maxPrice) params.set("maxPrice", String(filters.maxPrice));
    if (filters?.sort) params.set("sort", filters.sort);

    const res = await fetch(`/api/products?${params}`);
    if (res.ok) {
      const { data, count: total } = await res.json();
      setProducts(data || []);
      setCount(total || 0);
    } else {
      setError("Failed to load products");
    }
    setLoading(false);
  }, [filters?.category, filters?.search, filters?.condition, filters?.sort]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, count, loading, error, refetch: fetchProducts };
}

export function useTasks(filters?: {
  category?: string;
  search?: string;
  urgent?: boolean;
}) {
  const [tasks, setTasks] = useState<unknown[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters?.category) params.set("category", filters.category);
    if (filters?.search) params.set("search", filters.search);
    if (filters?.urgent) params.set("urgent", "true");

    const res = await fetch(`/api/tasks?${params}`);
    if (res.ok) {
      const { data, count: total } = await res.json();
      setTasks(data || []);
      setCount(total || 0);
    }
    setLoading(false);
  }, [filters?.category, filters?.search, filters?.urgent]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return { tasks, count, loading, refetch: fetchTasks };
}

export function useOrders(status?: string) {
  const [orders, setOrders] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      const params = status ? `?status=${status}` : "";
      const res = await fetch(`/api/orders${params}`);
      if (res.ok) {
        const { data } = await res.json();
        setOrders(data || []);
      }
      setLoading(false);
    };
    fetchOrders();
  }, [status]);

  return { orders, loading };
}

export function useProfile() {
  const [profile, setProfile] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    const res = await fetch("/api/profile");
    if (res.ok) {
      const { data } = await res.json();
      setProfile(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = useCallback(async (updates: Record<string, unknown>) => {
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      const { data } = await res.json();
      setProfile(data);
    }
    return res.ok;
  }, []);

  return { profile, loading, updateProfile, refetch: fetchProfile };
}
