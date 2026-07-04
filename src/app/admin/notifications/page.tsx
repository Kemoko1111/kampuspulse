"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Bell, Send, AlertCircle, CheckCircle2, Megaphone, Loader2
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { PageHeader } from "@/components/admin/page-header";
import { formatRelativeTime } from "@/lib/utils";

interface Broadcast {
  id: string;
  title: string;
  body: string;
  audience: "all" | "students" | "riders";
  recipient_count: number;
  created_at: string;
}

const audienceLabels: Record<Broadcast["audience"], string> = {
  all: "Everyone",
  students: "All Students",
  riders: "All Riders",
};

export default function NotificationsPage() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    body: "",
    audience: "all" as Broadcast["audience"],
  });

  const fetchBroadcasts = useCallback(async () => {
    setListLoading(true);
    try {
      const res = await fetch("/api/admin/notifications");
      if (res.ok) {
        const { data } = await res.json();
        setBroadcasts(data || []);
      }
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => { fetchBroadcasts(); }, [fetchBroadcasts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await apiFetch("/api/admin/notifications", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to send notification");
        return;
      }
      setSuccess(`Sent to ${json.data.recipient_count} recipient${json.data.recipient_count === 1 ? "" : "s"}.`);
      setFormData({ title: "", body: "", audience: "all" });
      fetchBroadcasts();
    } catch {
      setError("Failed to send notification");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        subtitle="Send announcements and manage system alerts"
      />

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Compose Notification */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 h-fit">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="font-display font-bold text-lg">Compose Message</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5 uppercase tracking-wider font-bold">Title</label>
              <input
                required
                type="text"
                className="input-premium w-full"
                placeholder="Holiday Discount!"
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-1.5 uppercase tracking-wider font-bold">Message</label>
              <textarea
                required
                className="input-premium w-full min-h-[120px] resize-none py-3"
                placeholder="Enter your message here..."
                value={formData.body}
                onChange={e => setFormData({...formData, body: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-1.5 uppercase tracking-wider font-bold">Target Audience</label>
              <select
                className="input-premium w-full appearance-none"
                value={formData.audience}
                onChange={e => setFormData({...formData, audience: e.target.value as Broadcast["audience"]})}
              >
                <option value="all">Everyone</option>
                <option value="students">All Students</option>
                <option value="riders">All Riders</option>
              </select>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> {success}
              </div>
            )}

            <button type="submit" disabled={sending} className="w-full btn-primary flex justify-center items-center gap-2 mt-2">
              {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" /> Send Notification</>}
            </button>
          </form>
        </motion.div>

        {/* Recent Notifications */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card flex flex-col">
          <div className="p-6 border-b border-white/5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="font-display font-bold text-lg">Recent Broadcasts</h3>
          </div>

          <div className="flex-1 overflow-y-auto">
            {listLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
              </div>
            ) : broadcasts.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-sm text-muted-foreground italic">No broadcasts sent yet.</p>
              </div>
            ) : (
              broadcasts.map((n) => (
                <div key={n.id} className="p-5 border-b border-white/5 flex items-start gap-4 hover:bg-white/5 transition-colors">
                  <div className="mt-1 flex-shrink-0 text-blue-400">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="font-bold text-sm truncate">{n.title}</h4>
                      <span className="text-xs text-muted-foreground flex-shrink-0">{formatRelativeTime(n.created_at)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{n.body}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-white/10 text-white">
                        {audienceLabels[n.audience] || n.audience}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">
                        {n.recipient_count} recipient{n.recipient_count === 1 ? "" : "s"}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
