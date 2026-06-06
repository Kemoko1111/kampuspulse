"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState, useCallback } from "react";
import {
  Search, Plus, Clock, MapPin, Star, Filter,
  Flame, Users, BookOpen, Printer, Coffee,
  Shirt, Laptop, Mic2, Palette, Zap,
  ArrowRight, DollarSign, Loader2, Briefcase,
} from "lucide-react";
import { useTasks } from "@/hooks";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";

const taskCategories = [
  { id: "all",      label: "All Tasks",  icon: Zap },
  { id: "academic", label: "Academic",   icon: BookOpen },
  { id: "delivery", label: "Delivery",   icon: Coffee },
  { id: "printing", label: "Printing",   icon: Printer },
  { id: "laundry",  label: "Laundry",    icon: Shirt },
  { id: "tech",     label: "Tech Help",  icon: Laptop },
  { id: "design",   label: "Design",     icon: Palette },
  { id: "event",    label: "Events",     icon: Mic2 },
];

export default function Y3AdwumaPage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch]                 = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [urgentOnly, setUrgentOnly]         = useState(false);

  const { tasks, count, loading } = useTasks({
    category: activeCategory === "all" ? undefined : activeCategory,
    search: debouncedSearch || undefined,
    urgent: urgentOnly || undefined,
  });

  const handleSearch = useCallback((val: string) => {
    setSearch(val);
    clearTimeout((window as any).__taskSearch);
    (window as any).__taskSearch = setTimeout(() => setDebouncedSearch(val), 400);
  }, []);

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ── HEADER ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h1 className="font-display font-black text-3xl md:text-4xl">
              <span className="text-emerald-400">Y3 ADWUMA</span>
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Campus Task & Errand Platform {count > 0 && `· ${count} open tasks`}
            </p>
          </div>
          <Link href="/y3adwuma/post-task" id="post-task-btn"
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-sm font-semibold rounded-xl px-4 py-2.5 hover:shadow-glow hover:scale-105 transition-all">
            <Plus className="w-4 h-4" /> Post Task
          </Link>
        </motion.div>

        {/* ── LIVE STATS ── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Open Tasks",      value: loading ? "—" : String(count),  color: "text-emerald-400" },
              { label: "Urgent Tasks",    value: loading ? "—" : String((tasks as any[]).filter((t: any) => t.is_urgent).length), color: "text-red-400" },
              { label: "Avg. Reward",     value: loading || !(tasks as any[]).length ? "—" : formatCurrency((tasks as any[]).reduce((s: number, t: any) => s + t.reward, 0) / (tasks as any[]).length), color: "text-yellow-400" },
              { label: "Categories",      value: String(taskCategories.length - 1), color: "text-purple-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="glass-card p-3 text-center">
                <div className={`font-display font-black text-lg ${color}`}>{value}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── PROMO ── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="relative overflow-hidden rounded-2xl p-6 module-card-y3adwuma">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/80 to-emerald-700/80" />
            <div className="relative flex items-center justify-between">
              <div>
                <h2 className="font-display font-black text-xl text-white mb-1">💼 Earn While You Study!</h2>
                <p className="text-emerald-200 text-sm">Top earners make GHS 2,400+ per month on Y3 ADWUMA</p>
              </div>
              <DollarSign className="w-10 h-10 text-emerald-300 opacity-50" />
            </div>
          </div>
        </motion.div>

        {/* ── SEARCH + FILTERS ── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input id="task-search" type="search" value={search} onChange={e => handleSearch(e.target.value)}
              placeholder="Search tasks, skills, locations..." className="input-premium pl-11" />
          </div>
          <button onClick={() => setUrgentOnly(u => !u)}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${urgentOnly ? "bg-red-500 text-white" : "glass border border-white/10 text-muted-foreground hover:bg-white/10"}`}
            title="Urgent only">
            <Flame className="w-4 h-4" />
          </button>
          <button className="w-12 h-12 glass border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-all">
            <Filter className="w-4 h-4" />
          </button>
        </motion.div>

        {/* ── CATEGORIES ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {taskCategories.map(({ id, label, icon: Icon }) => (
              <button key={id} id={`task-cat-${id}`} onClick={() => setActiveCategory(id)}
                className={`flex-none flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium transition-all border
                  ${activeCategory === id
                    ? "bg-emerald-500 text-white border-emerald-500"
                    : "glass border-white/10 text-muted-foreground hover:text-foreground"}`}>
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* ── TASK CARDS ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-lg">
              {loading ? "Loading tasks..." : `${count} Tasks Available`}
            </h2>
            <span className="text-xs text-muted-foreground">Urgent first</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
            </div>
          ) : (tasks as any[]).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center glass-card">
              <Briefcase className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <h3 className="font-display font-bold text-lg mb-1">No tasks found</h3>
              <p className="text-muted-foreground text-sm mb-4">
                {search ? "Try a different search term" : "Be the first to post a task!"}
              </p>
              <Link href="/y3adwuma/post-task" className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-sm font-semibold rounded-xl px-4 py-2.5">
                <Plus className="w-4 h-4" /> Post a Task
              </Link>
            </div>
          ) : (tasks as any[]).map((task: any, i: number) => (
            <motion.div key={task.id}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Link href={`/y3adwuma/task/${task.id}`}>
                <div className="glass-card p-5 hover:border-emerald-500/20 hover:bg-emerald-500/3 transition-all cursor-pointer group">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {task.is_urgent && (
                          <span className="badge-hot flex items-center gap-1 text-[10px]">
                            <Flame className="w-2.5 h-2.5" /> URGENT
                          </span>
                        )}
                        <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wide">{task.category}</span>
                        <span className="text-[10px] text-muted-foreground">{formatRelativeTime(task.created_at)}</span>
                      </div>
                      <h3 className="font-display font-bold text-base text-foreground leading-tight group-hover:text-emerald-400 transition-colors">
                        {task.title}
                      </h3>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-display font-black text-xl text-emerald-400">{formatCurrency(task.reward)}</div>
                      <div className="text-[10px] text-muted-foreground">reward</div>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{task.description}</p>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3 flex-wrap">
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-orange-400" />{new Date(task.deadline).toLocaleDateString("en-GH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                    {task.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-blue-400" />{task.location}</span>}
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-purple-400" />{task.total_applicants} applicants</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-400 flex items-center justify-center text-white text-[10px] font-bold">
                        {task.poster?.full_name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2) || "??"}
                      </div>
                      <div>
                        <span className="text-xs font-medium text-foreground">{task.poster?.full_name || "Anonymous"}</span>
                        <div className="flex items-center gap-0.5">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-[10px] text-muted-foreground">{task.poster?.rating?.toFixed(1) || "New"}</span>
                        </div>
                      </div>
                    </div>
                    <span className="flex items-center gap-1 text-xs text-emerald-400 font-semibold group-hover:translate-x-1 transition-transform">
                      Apply Now <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
