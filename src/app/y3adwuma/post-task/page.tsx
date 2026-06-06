"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRef, useState } from "react";
import {
  ArrowLeft, Upload, MapPin, Clock, DollarSign,
  Flame, CheckCircle, BookOpen, Printer, Coffee,
  Shirt, Laptop, Palette, Mic2, Package, X,
} from "lucide-react";
import { apiFetch, uploadFile } from "@/lib/api-client";

const categories = [
  { id: "academic", label: "Academic", icon: BookOpen },
  { id: "delivery", label: "Delivery", icon: Package },
  { id: "printing", label: "Printing", icon: Printer },
  { id: "food", label: "Food Pickup", icon: Coffee },
  { id: "laundry", label: "Laundry", icon: Shirt },
  { id: "tech", label: "Tech Help", icon: Laptop },
  { id: "design", label: "Design", icon: Palette },
  { id: "event", label: "Event Help", icon: Mic2 },
];

export default function PostTaskPage() {
  const [form, setForm] = useState({
    title: "", description: "", category: "", reward: "",
    deadline: "", location: "", isUrgent: false,
  });
  const [files, setFiles] = useState<File[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const update = (k: string, v: string | boolean) => setForm(p => ({ ...p, [k]: v }));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...selected].slice(0, 5));
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const imageUrls: string[] = [];
      for (const file of files) {
        const uploadRes = await uploadFile("task-attachments", file);
        if (!uploadRes.ok) {
          const err = await uploadRes.json();
          throw new Error(err.error || "Failed to upload attachment");
        }
        const { data } = await uploadRes.json();
        imageUrls.push(data.url);
      }

      const res = await apiFetch("/api/tasks", {
        method: "POST",
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          category: form.category,
          reward: parseFloat(form.reward),
          deadline: new Date(form.deadline).toISOString(),
          location: form.location || undefined,
          isUrgent: form.isUrgent,
          images: imageUrls,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to post task");
      }

      setSubmitted(true);
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
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="font-display font-black text-2xl mb-2">Task Posted! 🎉</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Your task has been submitted and is now live. Workers will start applying soon!
          </p>
          <div className="space-y-3">
            <Link href="/y3adwuma" className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-semibold py-3 rounded-xl">
              View All Tasks
            </Link>
            <button onClick={() => { setSubmitted(false); setFiles([]); setForm({ title: "", description: "", category: "", reward: "", deadline: "", location: "", isUrgent: false }); }} className="w-full glass border border-white/10 rounded-xl py-3 text-sm font-medium hover:bg-white/5 transition-all">
              Post Another Task
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        <Link href="/y3adwuma" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Tasks
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display font-black text-3xl mb-1">Post a <span className="text-emerald-400">Task</span></h1>
          <p className="text-muted-foreground text-sm mb-6">Describe what you need and set a fair reward for workers</p>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Title */}
            <div className="glass-card p-5 space-y-4">
              <h2 className="font-display font-bold text-base">Task Details</h2>
              <div>
                <label className="text-sm font-medium block mb-2">Task Title *</label>
                <input id="task-title" type="text" required minLength={5} value={form.title} onChange={e => update("title", e.target.value)}
                  placeholder="e.g. Type my 10-page assignment in Word"
                  className="input-premium" maxLength={200} />
                <p className="text-xs text-muted-foreground mt-1">{form.title.length}/200 · minimum 5 characters</p>
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">Description *</label>
                <textarea id="task-description" required minLength={10} value={form.description} onChange={e => update("description", e.target.value)}
                  placeholder="Describe the task in detail – what you need done, any specific requirements, materials to be provided..."
                  rows={5} className="input-premium resize-none" />
                <p className="text-xs text-muted-foreground mt-1">
                  {form.description.length}/5000 · minimum 10 characters
                </p>
              </div>
            </div>

            {/* Category */}
            <div className="glass-card p-5">
              <h2 className="font-display font-bold text-base mb-3">Category *</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {categories.map(({ id, label, icon: Icon }) => (
                  <button key={id} type="button" id={`task-category-${id}`}
                    onClick={() => update("category", id)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition-all
                      ${form.category === id
                        ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                        : "glass border-white/10 text-muted-foreground hover:border-white/20"}`}>
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Reward & Deadline */}
            <div className="glass-card p-5 space-y-4">
              <h2 className="font-display font-bold text-base">Reward & Timing</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium block mb-2">Reward (GHS) *</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input id="task-reward" type="number" required min={5} value={form.reward} onChange={e => update("reward", e.target.value)}
                      placeholder="e.g. 80" className="input-premium pl-9" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Min GHS 5</p>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-2">Deadline *</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input id="task-deadline" type="datetime-local" required value={form.deadline} onChange={e => update("deadline", e.target.value)}
                      className="input-premium pl-9" />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input id="task-location" type="text" value={form.location} onChange={e => update("location", e.target.value)}
                    placeholder="e.g. Atlantic Hall, Room 204" className="input-premium pl-9" />
                </div>
              </div>

              {/* Urgent toggle */}
              <div className="flex items-center justify-between p-4 glass border border-white/10 rounded-xl">
                <div className="flex items-center gap-3">
                  <Flame className="w-5 h-5 text-red-400" />
                  <div>
                    <div className="text-sm font-medium">Mark as Urgent</div>
                    <div className="text-xs text-muted-foreground">Urgent tasks get 3× more visibility</div>
                  </div>
                </div>
                <button type="button" id="urgent-toggle"
                  onClick={() => update("isUrgent", !form.isUrgent)}
                  className={`relative w-12 h-6 rounded-full transition-all ${form.isUrgent ? "bg-red-500" : "bg-white/20"}`}>
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${form.isUrgent ? "left-6" : "left-0.5"}`} />
                </button>
              </div>
            </div>

            {/* Attachments */}
            <div className="glass-card p-5">
              <h2 className="font-display font-bold text-base mb-3">Attachments (Optional)</h2>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,application/pdf"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:border-emerald-500/30 transition-all cursor-pointer"
              >
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Drop files here or <span className="text-emerald-400">browse</span></p>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG, PDF up to 10MB</p>
              </div>
              {files.length > 0 && (
                <div className="mt-3 space-y-2">
                  {files.map((file, i) => (
                    <div key={`${file.name}-${i}`} className="flex items-center justify-between p-2 glass border border-white/10 rounded-lg text-sm">
                      <span className="truncate text-muted-foreground">{file.name}</span>
                      <button type="button" onClick={() => removeFile(i)} className="text-muted-foreground hover:text-red-400">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Preview & fee notice */}
            {form.reward && (
              <div className="glass border border-emerald-500/20 bg-emerald-500/5 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Worker receives</span>
                  <span className="font-bold text-emerald-400">GHS {(parseFloat(form.reward) * 0.9).toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">CampusPulse fee (10%)</span>
                  <span className="text-xs text-muted-foreground">GHS {(parseFloat(form.reward) * 0.1).toFixed(2)}</span>
                </div>
              </div>
            )}

            <button id="post-task-submit" type="submit" disabled={submitting || form.title.length < 5 || form.description.length < 10 || !form.category || !form.reward || !form.deadline}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-semibold py-4 rounded-xl hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              {submitting ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Posting Task...</>
              ) : "Post Task Now 🚀"}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
