"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Upload, Plus, X, CheckCircle, DollarSign } from "lucide-react";
import { apiFetch, uploadFile } from "@/lib/api-client";
import { createClient } from "@/lib/supabase/client";

const conditions = [
  { id: "new", label: "New", desc: "Brand new, never used" },
  { id: "like_new", label: "Like New", desc: "Used once or twice" },
  { id: "good", label: "Good", desc: "Minor signs of use" },
  { id: "fair", label: "Fair", desc: "Visible wear & tear" },
];

const SELL_CATEGORY_SLUGS = [
  "electronics", "fashion", "books", "food", "beauty",
  "hostel", "furniture", "tech-accessories",
];

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function SellPage() {
  const [form, setForm] = useState({
    title: "", description: "", price: "", category: "", condition: "", location: "", phone: "",
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const up = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("categories")
      .select("id, name, slug")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => {
        const cats = (data || []) as Category[];
        setCategories(cats.filter(c => SELL_CATEGORY_SLUGS.includes(c.slug)));
      });
  }, []);

  const addImages = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files).slice(0, 5 - images.length);
    setImages(prev => [...prev, ...newFiles]);
    setPreviews(prev => [...prev, ...newFiles.map(f => URL.createObjectURL(f))]);
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const imageUrls: string[] = [];
      for (const file of images) {
        const res = await uploadFile("product-images", file);
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Image upload failed");
        }
        const { data } = await res.json();
        imageUrls.push(data.url);
      }

      const category = categories.find(c => c.slug === form.category);
      const res = await apiFetch("/api/products", {
        method: "POST",
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          price: parseFloat(form.price),
          categoryId: category?.id || null,
          condition: form.condition,
          images: imageUrls,
          location: form.location || undefined,
          stockQuantity: 1,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to post listing");
      }

      setSubmitted(true);
      setForm({ title: "", description: "", price: "", category: "", condition: "", location: "", phone: "" });
      previews.forEach(URL.revokeObjectURL);
      setImages([]);
      setPreviews([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-10 max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-blue-400" />
          </div>
          <h2 className="font-display font-black text-2xl mb-2">Listing Posted! 🎉</h2>
          <p className="text-muted-foreground text-sm mb-6">Your product is now live on the marketplace.</p>
          <div className="space-y-3">
            <Link href="/edwom" className="w-full flex items-center justify-center gap-2 btn-primary py-3">View Marketplace</Link>
            <button onClick={() => setSubmitted(false)} className="w-full glass border border-white/10 rounded-xl py-3 text-sm font-medium hover:bg-white/5 transition-all">List Another Item</button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        <Link href="/edwom" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Marketplace
        </Link>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display font-black text-3xl mb-1">Sell on <span className="text-blue-400">EDWOM</span></h1>
          <p className="text-muted-foreground text-sm mb-6">List your item and reach thousands of UCC students</p>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Photos */}
            <div className="glass-card p-5">
              <h2 className="font-display font-bold text-base mb-3">Photos</h2>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                className="hidden"
                onChange={e => addImages(e.target.files)}
              />
              <div className="grid grid-cols-4 gap-3">
                {previews.length > 0 ? (
                  <div className="col-span-2 row-span-2 relative rounded-xl overflow-hidden h-40">
                    <img src={previews[0]} alt="Main" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeImage(0)}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center">
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ) : (
                  <div onClick={() => fileInputRef.current?.click()}
                    className="col-span-2 row-span-2 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center p-6 h-40 hover:border-blue-500/30 transition-all cursor-pointer">
                    <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                    <span className="text-xs text-muted-foreground text-center">Main Photo</span>
                  </div>
                )}
                {[1, 2, 3, 4].map(i => {
                  const idx = i;
                  const preview = previews[idx];
                  return preview ? (
                    <div key={i} className="relative rounded-xl overflow-hidden h-[72px]">
                      <img src={preview} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center">
                        <X className="w-2.5 h-2.5 text-white" />
                      </button>
                    </div>
                  ) : (
                    <div key={i} onClick={() => images.length < 5 && fileInputRef.current?.click()}
                      className="border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center h-[72px] hover:border-blue-500/30 transition-all cursor-pointer">
                      <Plus className="w-4 h-4 text-muted-foreground" />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Details */}
            <div className="glass-card p-5 space-y-4">
              <h2 className="font-display font-bold text-base">Item Details</h2>
              <div>
                <label className="text-sm font-medium block mb-2">Title *</label>
                <input id="sell-title" type="text" required value={form.title} onChange={e => up("title", e.target.value)} placeholder="e.g. Samsung Galaxy A34 5G – Black" className="input-premium" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">Description *</label>
                <textarea id="sell-desc" required value={form.description} onChange={e => up("description", e.target.value)} rows={4} placeholder="Describe your item honestly – include specs, age, reason for selling, any defects..." className="input-premium resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium block mb-2">Category *</label>
                  <select id="sell-category" required value={form.category} onChange={e => up("category", e.target.value)} className="input-premium">
                    <option value="">Select category</option>
                    {categories.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-2">Price (GHS) *</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input id="sell-price" type="number" required min={1} value={form.price} onChange={e => up("price", e.target.value)} placeholder="0.00" className="input-premium pl-9" />
                  </div>
                </div>
              </div>
            </div>

            {/* Condition */}
            <div className="glass-card p-5">
              <h2 className="font-display font-bold text-base mb-3">Condition *</h2>
              <div className="grid grid-cols-2 gap-3">
                {conditions.map(({ id, label, desc }) => (
                  <button key={id} type="button" id={`condition-${id}`} onClick={() => up("condition", id)}
                    className={`p-3 rounded-xl border text-left transition-all ${form.condition === id ? "bg-blue-500/10 border-blue-500/40" : "glass border-white/10 hover:border-white/20"}`}>
                    <div className={`font-semibold text-sm ${form.condition === id ? "text-blue-400" : "text-foreground"}`}>{label}</div>
                    <div className="text-xs text-muted-foreground">{desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Contact & Location */}
            <div className="glass-card p-5 space-y-4">
              <h2 className="font-display font-bold text-base">Contact & Location</h2>
              <div>
                <label className="text-sm font-medium block mb-2">Pickup Location</label>
                <input id="sell-location" type="text" value={form.location} onChange={e => up("location", e.target.value)} placeholder="e.g. Atlantic Hall Room 204" className="input-premium" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">Phone Number</label>
                <input id="sell-phone" type="tel" value={form.phone} onChange={e => up("phone", e.target.value)} placeholder="0244 123 456" className="input-premium" />
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-400 text-center">{error}</p>
            )}

            <button id="sell-submit" type="submit" disabled={submitting || !form.title || !form.description || !form.price || !form.category || !form.condition}
              className="w-full btn-primary flex items-center justify-center gap-2 py-4 disabled:opacity-50 disabled:cursor-not-allowed">
              {submitting ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Posting...</> : "Post Listing 🚀"}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
