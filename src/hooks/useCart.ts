"use client";

import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "@/lib/api-client";

export function useCart() {
  const [items, setItems] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCart = useCallback(async () => {
    setLoading(true);
    const res = await apiFetch("/api/cart");
    if (res.ok) {
      const { data } = await res.json();
      setItems(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addItem = useCallback(async (productId: string, quantity = 1) => {
    const res = await apiFetch("/api/cart", {
      method: "POST",
      body: JSON.stringify({ productId, quantity }),
    });
    if (res.ok) await fetchCart();
    return res.ok;
  }, [fetchCart]);

  const updateQuantity = useCallback(async (productId: string, quantity: number) => {
    const res = await apiFetch("/api/cart", {
      method: "PATCH",
      body: JSON.stringify({ productId, quantity }),
    });
    if (res.ok) await fetchCart();
    return res.ok;
  }, [fetchCart]);

  const removeItem = useCallback(async (productId: string) => {
    const res = await apiFetch(`/api/cart?productId=${productId}`, { method: "DELETE" });
    if (res.ok) await fetchCart();
    return res.ok;
  }, [fetchCart]);

  const total = items.reduce((sum: number, item: unknown) => {
    const i = item as { quantity: number; product: { price: number } };
    return sum + i.quantity * i.product.price;
  }, 0);

  const count = items.reduce((sum: number, item: unknown) => {
    const i = item as { quantity: number };
    return sum + i.quantity;
  }, 0);

  return { items, loading, addItem, updateQuantity, removeItem, total, count, refetch: fetchCart };
}
