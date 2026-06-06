"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft, Clock, MapPin, Users, Star, Flame,
  MessageSquare, CheckCircle, Share2, Flag, DollarSign,
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { useAuth } from "@/contexts/auth-context";
import type { Task, TaskApplication, Profile } from "@/types";

type TaskWithRelations = Task & {
  poster?: Profile;
  assignee?: Profile;
  applications?: (TaskApplication & { applicant?: Profile })[];
};

function getInitials(name?: string | null) {
  if (!name) return "?";
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

function formatDeadline(deadline: string) {
  return new Date(deadline).toLocaleString(undefined, {
    weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} mins ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function statusLabel(status: string) {
  return status.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase());
}

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const [task, setTask] = useState<TaskWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);
  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState("");
  const [proposedPrice, setProposedPrice] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchTask = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const res = await fetch(`/api/tasks/${id}`);
    if (res.ok) {
      const { data } = await res.json();
      setTask(data);
      setProposedPrice(String(data.reward));
      const alreadyApplied = data.applications?.some(
        (a: TaskApplication) => a.applicant_id === profile?.id
      );
      setApplied(!!alreadyApplied);
    } else {
      setError("Task not found");
    }
    setLoading(false);
  }, [id, profile?.id]);

  useEffect(() => { fetchTask(); }, [fetchTask]);

  const handleApply = async () => {
    if (!id || !message) return;
    setApplying(true);
    try {
      const res = await apiFetch(`/api/tasks/${id}/apply`, {
        method: "POST",
        body: JSON.stringify({
          coverMessage: message,
          proposedPrice: proposedPrice ? parseFloat(proposedPrice) : undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to apply");
      }
      setApplied(true);
      await fetchTask();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply");
    } finally {
      setApplying(false);
    }
  };

  const handleAccept = async (applicationId: string) => {
    if (!id) return;
    setActionLoading(applicationId);
    try {
      const res = await apiFetch(`/api/tasks/${id}/accept`, {
        method: "POST",
        body: JSON.stringify({ applicationId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to accept");
      }
      await fetchTask();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (applicationId: string) => {
    if (!id) return;
    setActionLoading(applicationId);
    try {
      const res = await apiFetch(`/api/tasks/${id}/reject`, {
        method: "POST",
        body: JSON.stringify({ applicationId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to reject");
      }
      await fetchTask();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject");
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusUpdate = async (status: string) => {
    if (!id) return;
    setActionLoading(status);
    try {
      const res = await apiFetch(`/api/tasks/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update status");
      }
      await fetchTask();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">{error || "Task not found"}</p>
          <Link href="/y3adwuma" className="text-emerald-400 text-sm">Back to Tasks</Link>
        </div>
      </div>
    );
  }

  const isPoster = profile?.id === task.poster_id;
  const isAssignee = profile?.id === task.assignee_id;
  const applicants = task.applications || [];

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <Link href="/y3adwuma" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Tasks
        </Link>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main */}
          <div className="lg:col-span-2 space-y-5">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    {task.is_urgent && <span className="badge-hot flex items-center gap-1"><Flame className="w-3 h-3" /> URGENT</span>}
                    <span className="text-xs font-semibold text-emerald-400 uppercase bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-0.5">{task.category}</span>
                    <span className="text-xs text-muted-foreground">{timeAgo(task.created_at)}</span>
                  </div>
                  <h1 className="font-display font-black text-2xl text-foreground">{task.title}</h1>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-display font-black text-3xl text-emerald-400">GHS {task.reward}</div>
                  <div className="text-xs text-muted-foreground">reward</div>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                {[
                  { icon: Clock, label: "Deadline", value: formatDeadline(task.deadline), color: "text-orange-400" },
                  { icon: MapPin, label: "Location", value: task.location || "Not specified", color: "text-blue-400" },
                  { icon: Users, label: "Applicants", value: `${applicants.length} applied`, color: "text-purple-400" },
                  { icon: CheckCircle, label: "Status", value: statusLabel(task.status), color: "text-green-400" },
                ].map(({ icon: Icon, label, value, color }) => (
                  <div key={label} className="glass border border-white/10 rounded-xl p-3">
                    <Icon className={`w-4 h-4 ${color} mb-1`} />
                    <div className="text-[10px] text-muted-foreground">{label}</div>
                    <div className="text-xs font-semibold text-foreground">{value}</div>
                  </div>
                ))}
              </div>
              <h2 className="font-display font-bold text-base mb-2">Description</h2>
              <pre className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap font-sans">{task.description}</pre>

              {(isPoster || isAssignee) && task.status !== "completed" && task.status !== "cancelled" && (
                <div className="mt-5 pt-5 border-t border-white/5 flex flex-wrap gap-2">
                  {isAssignee && task.status === "assigned" && (
                    <button onClick={() => handleStatusUpdate("in_progress")} disabled={actionLoading === "in_progress"}
                      className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium disabled:opacity-50">
                      {actionLoading === "in_progress" ? "Updating..." : "Start Task"}
                    </button>
                  )}
                  {isAssignee && task.status === "in_progress" && (
                    <button onClick={() => handleStatusUpdate("completed")} disabled={actionLoading === "completed"}
                      className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium disabled:opacity-50">
                      {actionLoading === "completed" ? "Updating..." : "Mark Complete"}
                    </button>
                  )}
                  {isPoster && task.status === "open" && (
                    <button onClick={() => handleStatusUpdate("cancelled")} disabled={actionLoading === "cancelled"}
                      className="px-4 py-2 rounded-xl glass border border-red-500/20 text-red-400 text-sm font-medium disabled:opacity-50">
                      Cancel Task
                    </button>
                  )}
                  {isPoster && task.status === "in_progress" && (
                    <button onClick={() => handleStatusUpdate("completed")} disabled={actionLoading === "completed"}
                      className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium disabled:opacity-50">
                      Confirm Complete
                    </button>
                  )}
                </div>
              )}
            </motion.div>

            {/* Apply form */}
            {!isPoster && task.status === "open" && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
                <h2 className="font-display font-bold text-lg mb-4">Apply for this Task</h2>
                {applied ? (
                  <div className="text-center py-6">
                    <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                    <h3 className="font-display font-bold text-lg mb-1">Application Sent! 🎉</h3>
                    <p className="text-sm text-muted-foreground">The poster will review and contact you soon.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium block mb-2">Cover Message</label>
                      <textarea value={message} onChange={e => setMessage(e.target.value)}
                        placeholder="Why are you the best person for this task?" rows={4} className="input-premium resize-none" />
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-2">Your Price (GHS)</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input type="number" value={proposedPrice} onChange={e => setProposedPrice(e.target.value)} className="input-premium pl-9" />
                      </div>
                    </div>
                    <button id="apply-task-btn"
                      onClick={handleApply}
                      disabled={applying || !message}
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-semibold py-3 rounded-xl hover:shadow-glow transition-all disabled:opacity-50">
                      {applying ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sending...</> : "Apply Now"}
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* Applicants */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-6">
              <h2 className="font-display font-bold text-lg mb-4">Applicants ({applicants.length})</h2>
              <div className="space-y-3">
                {applicants.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No applications yet</p>
                ) : (
                  applicants.map((app) => {
                    const name = app.applicant?.full_name || "Unknown";
                    const avatar = getInitials(app.applicant?.full_name);
                    const rating = app.applicant?.rating ?? 0;
                    return (
                      <div key={app.id} className="flex items-start gap-3 p-4 glass border border-white/10 rounded-xl">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{avatar}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-sm">{name}</span>
                            <span className="text-emerald-400 font-bold text-sm">GHS {app.proposed_price ?? task.reward}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-1">
                            <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />{rating}</span>
                            <span className={`capitalize ${app.status === "accepted" ? "text-green-400" : app.status === "rejected" ? "text-red-400" : ""}`}>{app.status}</span>
                          </div>
                          {app.cover_message && <p className="text-xs text-muted-foreground">{app.cover_message}</p>}
                          {isPoster && task.status === "open" && app.status === "pending" && (
                            <div className="flex gap-2 mt-3">
                              <button onClick={() => handleAccept(app.id)} disabled={actionLoading === app.id}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium disabled:opacity-50">
                                Accept
                              </button>
                              <button onClick={() => handleReject(app.id)} disabled={actionLoading === app.id}
                                className="px-3 py-1.5 rounded-lg glass border border-white/10 text-xs font-medium disabled:opacity-50">
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5">
              <h3 className="font-display font-bold text-base mb-4">Task Poster</h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-400 flex items-center justify-center text-white font-bold">{getInitials(task.poster?.full_name)}</div>
                <div>
                  <div className="font-semibold text-sm flex items-center gap-1">
                    {task.poster?.full_name || "Unknown"}
                    {task.poster?.is_verified && <CheckCircle className="w-3.5 h-3.5 text-blue-400" />}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />{task.poster?.rating ?? 0}
                  </div>
                </div>
              </div>
              <div className="space-y-2 text-xs border-t border-white/5 pt-3 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Member Since</span>
                  <span className="font-medium">{task.poster?.created_at ? new Date(task.poster.created_at).toLocaleDateString(undefined, { month: "short", year: "numeric" }) : "—"}</span>
                </div>
              </div>
              <Link href="/messages" className="w-full flex items-center justify-center gap-2 glass border border-white/10 rounded-xl py-2.5 text-sm font-medium hover:bg-white/10 transition-all">
                <MessageSquare className="w-4 h-4" /> Message
              </Link>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="glass-card p-5 space-y-2">
              <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all text-sm text-muted-foreground">
                <Share2 className="w-4 h-4" /> Share Task
              </button>
              <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-500/10 transition-all text-sm text-red-400">
                <Flag className="w-4 h-4" /> Report Task
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
