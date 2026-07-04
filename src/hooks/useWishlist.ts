"use client";

import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "@/lib/api-client";

interface WishlistRow {
  product_id: string;
  created_at: string;
  product?: unknown;
}

export function useWishlist() {
  const [items, setItems] = useState<WishlistRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = useCallback(async () => {
    setLoading(true);
    const res = await apiFetch("/api/wishlist");
    if (res.ok) {
      const { data } = await res.json();
      setItems(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const isWishlisted = useCallback(
    (productId: string) => items.some((item) => item.product_id === productId),
    [items]
  );

  const toggleWishlist = useCallback(
    async (productId: string) => {
      const wasWishlisted = items.some((item) => item.product_id === productId);

      // Optimistic update, matching the pattern in useCart/useCart-adjacent hooks.
      if (wasWishlisted) {
        setItems((prev) => prev.filter((item) => item.product_id !== productId));
      } else {
        setItems((prev) => [...prev, { product_id: productId, created_at: new Date().toISOString() }]);
      }

      const res = wasWishlisted
        ? await apiFetch(`/api/wishlist?productId=${productId}`, { method: "DELETE" })
        : await apiFetch("/api/wishlist", { method: "POST", body: JSON.stringify({ productId }) });

      if (!res.ok) {
        // Revert by resyncing with the server on failure.
        await fetchWishlist();
      }

      return res.ok;
    },
    [items, fetchWishlist]
  );

  return { items, loading, isWishlisted, toggleWishlist, refetch: fetchWishlist };
}
