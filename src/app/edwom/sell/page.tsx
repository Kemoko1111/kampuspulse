"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Package, Image as ImageIcon, X } from "lucide-react";
import Link from "next/link";
import { apiFetch, uploadFile } from "@/lib/api-client";
import { createClient } from "@/lib/supabase/client";

// Student-facing "sell an item" form for the peer marketplace (product
// creation was previously admin-only with no student entry point). Posts to
// POST /api/products, which forces seller_id to the caller's own profile.
export default function SellItemPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      const supabase = createClient();
      const { data } = await supabase.from("categories").select("id, name");
      if (data) setCategories(data);
    };
    fetchCategories();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    try {
      let imageUrls: string[] = [];
      if (imageFile) {
        const uploadRes = await uploadFile("product-images", imageFile);
        if (!uploadRes.ok) {
          const upData = await uploadRes.json();
          throw new Error(upData.error || "Failed to upload image");
        }
        const upResult = await uploadRes.json();
        imageUrls = [upResult.data.url];
      }

      const body = {
        title: formData.get("title") as string,
        description: formData.get("description") as string,
        price: Number(formData.get("price")),
        stockQuantity: Number(formData.get("stockQuantity")),
        condition: formData.get("condition") as string,
        categoryId: formData.get("categoryId") ? String(formData.get("categoryId")) : undefined,
        location: (formData.get("location") as string) || undefined,
        images: imageUrls,
        tags: [],
      };

      const res = await apiFetch("/api/products", {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to list item");
      }

      router.push("/edwom");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to list item");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen max-w-3xl mx-auto px-4 py-8">
      <Link href="/edwom" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Marketplace
      </Link>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display font-black text-3xl mb-2">Sell an Item</h1>
        <p className="text-muted-foreground text-sm mb-8">List something for sale on the EDWOM marketplace.</p>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="glass-card p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Photo</label>
              <div className="relative border-2 border-dashed border-white/10 rounded-2xl hover:border-blue-500/50 transition-colors bg-white/5 overflow-hidden">
                {imagePreview ? (
                  <div className="relative aspect-video">
                    {/* eslint-disable-next-line @next/next/no-img-element -- local blob: object URL; next/image can't fetch blob: URLs */}
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }} className="absolute top-2 right-2 w-8 h-8 bg-red-500/80 hover:bg-red-500 text-white flex items-center justify-center rounded-full transition-colors backdrop-blur">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-3">
                      <ImageIcon className="w-6 h-6 text-blue-400" />
                    </div>
                    <p className="text-sm font-medium mb-1">Upload a photo</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG or WEBP (max 5MB)</p>
                    <input type="file" name="image" accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Title</label>
              <input name="title" required placeholder="e.g. Textbook, Mini fridge" className="input-premium w-full" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Description</label>
              <textarea name="description" required rows={4} placeholder="Describe the item, its condition, etc." className="input-premium w-full resize-none" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Price (GHS)</label>
                <input name="price" type="number" step="0.01" required placeholder="0.00" className="input-premium w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Quantity</label>
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
                  <option value="">Select Category (Optional)</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Pickup location (optional)</label>
              <input name="location" placeholder="e.g. Casely Hayford Hall" className="input-premium w-full" />
            </div>
          </div>

          <div className="pt-4 border-t border-white/5">
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Package className="w-5 h-5" />}
              {loading ? "Listing..." : "List Item"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
