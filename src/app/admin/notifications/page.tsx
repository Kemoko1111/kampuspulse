"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Bell, Send, AlertTriangle, Users, Bike, Megaphone, Loader2
} from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { formatRelativeTime } from "@/lib/utils";

const sampleNotifications = [
  { id: 1, title: "Welcome to KampusPulse!", message: "We are glad to have you on board.", target: "Everyone", priority: "Normal", created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
  { id: 2, title: "New feature: EZZYRIDE", message: "Try out our new campus ride-hailing service.", target: "All Students", priority: "Important", created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString() },
  { id: 3, title: "System maintenance notice", message: "The app will be down for 30 minutes tonight.", target: "Everyone", priority: "Urgent", created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString() },
];

export default function NotificationsPage() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    target: "Everyone",
    priority: "Normal",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert("Notification system integration coming soon! Your message would have been sent to: " + formData.target);
      setFormData({ title: "", message: "", target: "Everyone", priority: "Normal" });
    }, 1000);
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
                value={formData.message} 
                onChange={e => setFormData({...formData, message: e.target.value})} 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5 uppercase tracking-wider font-bold">Target Audience</label>
                <select 
                  className="input-premium w-full appearance-none" 
                  value={formData.target} 
                  onChange={e => setFormData({...formData, target: e.target.value})}
                >
                  <option value="Everyone">Everyone</option>
                  <option value="All Students">All Students</option>
                  <option value="All Riders">All Riders</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5 uppercase tracking-wider font-bold">Priority</label>
                <select 
                  className="input-premium w-full appearance-none" 
                  value={formData.priority} 
                  onChange={e => setFormData({...formData, priority: e.target.value})}
                >
                  <option value="Normal">Normal</option>
                  <option value="Important">Important</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full btn-primary flex justify-center items-center gap-2 mt-2">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" /> Send Notification</>}
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
            {sampleNotifications.map((n) => (
              <div key={n.id} className="p-5 border-b border-white/5 flex items-start gap-4 hover:bg-white/5 transition-colors">
                <div className={`mt-1 flex-shrink-0 ${n.priority === 'Urgent' ? 'text-red-400' : n.priority === 'Important' ? 'text-yellow-400' : 'text-blue-400'}`}>
                  {n.priority === 'Urgent' ? <AlertTriangle className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="font-bold text-sm truncate">{n.title}</h4>
                    <span className="text-xs text-muted-foreground flex-shrink-0">{formatRelativeTime(n.created_at)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{n.message}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-white/10 text-white">
                      {n.target}
                    </span>
                    <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded ${n.priority === 'Urgent' ? 'bg-red-500/20 text-red-400' : n.priority === 'Important' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'}`}>
                      {n.priority}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            <div className="p-6 text-center">
              <p className="text-sm text-muted-foreground italic">
                Notification history will sync automatically once the system is fully configured.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
