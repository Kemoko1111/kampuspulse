"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Package, Upload } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";

export default function AddProductPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const body = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      price: Number(formData.get("price")),
      stockQuantity: Number(formData.get("stockQuantity")),
      condition: formData.get("condition") as string,
      categoryId: formData.get("categoryId") as string,
      images: [], // Placeholder for image upload
      tags: [],
    };

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || "",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create product");
      }

      router.push("/admin");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (profile?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-400">Unauthorized. Admins only.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-3xl mx-auto px-4 py-8">
      <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display font-black text-3xl mb-2">Add New Product</h1>
        <p className="text-muted-foreground text-sm mb-8">List a new product on the EDWOM marketplace.</p>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="glass-card p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Product Title</label>
              <input name="title" required placeholder="e.g. iPhone 13 Pro" className="input-premium w-full" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Description</label>
              <textarea name="description" required rows={4} placeholder="Describe the product..." className="input-premium w-full resize-none" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Price (GHS)</label>
                <input name="price" type="number" step="0.01" required placeholder="0.00" className="input-premium w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Stock Quantity</label>
                <input name="stockQuantity" type="number" required defaultValue="1" min="1" className="input-premium w-full" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Condition</label>
                <select name="condition" required className="input-premium w-full appearance-none">
                  <option value="new">New</option>
                  <option value="like_new">Like New</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Category</label>
                <select name="categoryId" className="input-premium w-full appearance-none">
                  <option value="">Select Category</option>
                  <option value="electronics">Electronics</option>
                  <option value="books">Books</option>
                  <option value="clothing">Clothing</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/5">
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Package className="w-5 h-5" />}
              {loading ? "Publishing..." : "Publish Product"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
