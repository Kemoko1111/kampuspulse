"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Settings, User, Shield, Bell, Bike, CreditCard, AlertTriangle, Trash2, RotateCcw, ExternalLink, Loader2
} from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { useAuth } from "@/contexts/auth-context";
import { apiFetch } from "@/lib/api-client";
import { toast } from "react-hot-toast";
import Link from "next/link";

const DEFAULT_SETTINGS = {
  orderNotifications: true,
  autoAssignRiders: false,
  requireVerification: true,
  maintenanceMode: false,
};

export default function SettingsPage() {
  const { profile } = useAuth();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [clearingLogs, setClearingLogs] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((res) => { if (res.data) setSettings(res.data); })
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = async (key: keyof typeof settings) => {
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    try {
      await apiFetch("/api/admin/settings", {
        method: "PATCH",
        body: JSON.stringify({ [key]: next[key] }),
      });
    } catch {
      setSettings(settings);
      toast.error("Failed to save setting");
    }
  };

  const handleClearLogs = useCallback(async () => {
    if (!confirm("Permanently delete all admin action logs? This cannot be undone.")) return;
    setClearingLogs(true);
    try {
      const res = await apiFetch("/api/admin/logs", { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Admin logs cleared");
    } catch {
      toast.error("Failed to clear logs");
    } finally {
      setClearingLogs(false);
    }
  }, []);

  const [resetting, setResetting] = useState(false);

  const handleResetDashboard = async () => {
    if (!confirm("Reset all platform settings to their defaults? This cannot be undone.")) return;
    setResetting(true);
    try {
      const res = await apiFetch("/api/admin/settings", {
        method: "PATCH",
        body: JSON.stringify(DEFAULT_SETTINGS),
      });
      if (!res.ok) throw new Error();
      setSettings(DEFAULT_SETTINGS);
      toast.success("Dashboard settings reset to defaults");
    } catch {
      toast.error("Failed to reset settings");
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Settings"
        subtitle="Configure your admin panel and platform preferences"
      />

      {/* Profile Settings */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <User className="w-5 h-5 text-blue-400" />
          </div>
          <h3 className="font-display font-bold text-lg">Admin Profile</h3>
        </div>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-blue-500/20">
              {profile?.full_name?.substring(0, 2).toUpperCase() || "AD"}
            </div>
            <div>
              <h4 className="font-bold text-lg">{profile?.full_name || "Admin User"}</h4>
              <p className="text-sm text-muted-foreground">{profile?.phone || "No phone number"}</p>
              <div className="mt-2 flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-green-400" />
                <span className="text-xs font-bold text-green-400 uppercase tracking-wider">Super Admin</span>
              </div>
            </div>
          </div>
          <Link href="/profile" className="btn-primary flex items-center gap-2">
            Edit Profile <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </motion.div>

      {/* App Configuration */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <Settings className="w-5 h-5 text-purple-400" />
          </div>
          <h3 className="font-display font-bold text-lg">App Configuration</h3>
        </div>
        <div className="divide-y divide-white/5">
          <div className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors">
            <div className="flex items-start gap-4">
              <Bell className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <h4 className="font-bold">Order Notifications</h4>
                <p className="text-sm text-muted-foreground">Receive push notifications for new orders</p>
              </div>
            </div>
            <button 
              onClick={() => handleToggle('orderNotifications')}
              className={`w-12 h-6 rounded-full transition-colors relative ${settings.orderNotifications ? 'bg-blue-500' : 'bg-white/10'}`}
            >
              <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.orderNotifications ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors">
            <div className="flex items-start gap-4">
              <Bike className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <h4 className="font-bold">Auto-assign Riders</h4>
                <p className="text-sm text-muted-foreground">Automatically assign the nearest online rider to new orders</p>
              </div>
            </div>
            <button 
              onClick={() => handleToggle('autoAssignRiders')}
              className={`w-12 h-6 rounded-full transition-colors relative ${settings.autoAssignRiders ? 'bg-blue-500' : 'bg-white/10'}`}
            >
              <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.autoAssignRiders ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors">
            <div className="flex items-start gap-4">
              <CreditCard className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <h4 className="font-bold">Require Payment Verification</h4>
                <p className="text-sm text-muted-foreground">Manual admin approval required for cash payments</p>
              </div>
            </div>
            <button 
              onClick={() => handleToggle('requireVerification')}
              className={`w-12 h-6 rounded-full transition-colors relative ${settings.requireVerification ? 'bg-blue-500' : 'bg-white/10'}`}
            >
              <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.requireVerification ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-5 h-5 text-orange-400 mt-0.5" />
              <div>
                <h4 className="font-bold text-orange-400">Maintenance Mode</h4>
                <p className="text-sm text-muted-foreground">Temporarily disable access for all non-admin users</p>
              </div>
            </div>
            <button 
              onClick={() => handleToggle('maintenanceMode')}
              className={`w-12 h-6 rounded-full transition-colors relative ${settings.maintenanceMode ? 'bg-orange-500' : 'bg-white/10'}`}
            >
              <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.maintenanceMode ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>
        {loading && (
          <div className="p-4 bg-white/5 text-center flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading saved settings…
          </div>
        )}
      </motion.div>

      {/* Danger Zone */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card border-red-500/20 overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <h3 className="font-display font-bold text-lg text-red-400">Danger Zone</h3>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-muted-foreground mb-6">These actions are irreversible. Proceed with extreme caution.</p>
          <div className="flex items-center gap-4">
            <button onClick={handleClearLogs} disabled={clearingLogs} className="px-4 py-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
              {clearingLogs ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Clear All Logs
            </button>
            <button onClick={handleResetDashboard} disabled={resetting} className="px-4 py-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
              {resetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />} Reset Dashboard
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
