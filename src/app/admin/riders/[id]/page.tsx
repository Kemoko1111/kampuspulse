"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft, Bike, Phone, Mail, Loader2,
  ShieldAlert, Ban, Check, MapPin, Truck, Award
} from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import { apiFetch } from "@/lib/api-client";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { ConfirmModal } from "@/components/admin/confirm-modal";
import { StatCard } from "@/components/admin/stat-card";

interface RiderDetail {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  status: string;
  created_at: string;
  rider_profiles: {
    current_status: string;
    vehicle_type: string;
    vehicle_plate: string;
  }[];
  stats?: {
    completedOrders: number;
  };
}

export default function RiderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const riderId = params.id as string;

  const [rider, setRider] = useState<RiderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    action: "suspend" | "ban" | "activate";
    title: string;
    message: string;
    variant: "default" | "warning" | "danger";
  } | null>(null);

  const fetchRider = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/riders/${riderId}`);
      if (res.ok) {
        const data = await res.json();
        setRider(data.data);
      }
    } finally {
      setLoading(false);
    }
  }, [riderId]);

  useEffect(() => { fetchRider(); }, [fetchRider]);

  const handleStatusUpdate = async () => {
    if (!confirmModal) return;
    setActionLoading(true);
    try {
      await apiFetch(`/api/admin/riders/${riderId}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: confirmModal.action === "activate" ? "active" : confirmModal.action,
        }),
      });
      setConfirmModal(null);
      fetchRider();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          <p className="text-sm text-muted-foreground">Loading rider details…</p>
        </div>
      </div>
    );
  }

  if (!rider) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Bike className="w-12 h-12 text-muted-foreground/30 mb-3" />
        <h2 className="font-display font-bold text-xl mb-1">Rider not found</h2>
        <p className="text-muted-foreground text-sm mb-4">This user may have been deleted.</p>
        <Link href="/admin/riders" className="btn-primary text-sm">
          Back to Riders
        </Link>
      </div>
    );
  }

  const profile = rider.rider_profiles?.[0];

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link href="/admin/riders" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Riders
      </Link>

      <PageHeader
        title={rider.full_name || "Unknown Rider"}
        subtitle={`Joined ${formatRelativeTime(rider.created_at)}`}
        actions={
          <div className="flex items-center gap-3">
            <StatusBadge status={profile?.current_status || "offline"} variant="rider" />
            <StatusBadge status={rider.status} variant="user" />
          </div>
        }
      />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-1 space-y-6">
          <div className="glass-card p-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-purple-400 flex items-center justify-center text-white text-xl font-bold flex-shrink-0 shadow-lg shadow-purple-500/20">
                {rider.full_name?.substring(0, 2).toUpperCase() || "RD"}
              </div>
              <div>
                <h3 className="font-display font-bold text-lg">{rider.full_name}</h3>
                <p className="text-sm text-muted-foreground">{rider.email}</p>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/5">
              {rider.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="text-sm font-medium">{rider.phone}</p>
                  </div>
                </div>
              )}
              {rider.email && (
                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-medium">{rider.email}</p>
                  </div>
                </div>
              )}
            </div>
            
            {profile && (
              <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="flex items-start gap-3">
                  <Truck className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Vehicle</p>
                    <p className="text-sm font-medium capitalize">{profile.vehicle_type || "Not specified"}</p>
                  </div>
                </div>
                {profile.vehicle_plate && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">License Plate</p>
                      <p className="text-sm font-medium uppercase">{profile.vehicle_plate}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="glass-card p-6 space-y-3">
            <h4 className="font-display font-bold text-sm mb-4">Account Actions</h4>
            {rider.status !== "active" && (
              <button
                onClick={() => setConfirmModal({
                  isOpen: true, action: "activate", title: "Activate Account", message: `Are you sure you want to activate ${rider.full_name}?`, variant: "default"
                })}
                className="w-full btn-primary flex justify-center items-center gap-2"
              >
                <Check className="w-4 h-4" /> Activate Account
              </button>
            )}
            {rider.status !== "suspended" && (
              <button
                onClick={() => setConfirmModal({
                  isOpen: true, action: "suspend", title: "Suspend Account", message: `Are you sure you want to suspend ${rider.full_name}? They will not be able to log in or accept orders.`, variant: "warning"
                })}
                className="w-full px-4 py-2.5 rounded-xl border border-orange-500/30 text-orange-400 hover:bg-orange-500/10 transition-colors flex justify-center items-center gap-2 text-sm font-semibold"
              >
                <ShieldAlert className="w-4 h-4" /> Suspend Account
              </button>
            )}
            {rider.status !== "banned" && (
              <button
                onClick={() => setConfirmModal({
                  isOpen: true, action: "ban", title: "Ban Account", message: `Are you sure you want to ban ${rider.full_name}? This permanently blocks access.`, variant: "danger"
                })}
                className="w-full px-4 py-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors flex justify-center items-center gap-2 text-sm font-semibold"
              >
                <Ban className="w-4 h-4" /> Ban Account
              </button>
            )}
          </div>
        </motion.div>

        {/* Right Column - Stats & History */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <StatCard title="Completed Orders" value={rider.stats?.completedOrders || 0} icon={Award} color="green" index={0} />
          </div>

          <div className="glass-card overflow-hidden">
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <h3 className="font-display font-bold text-lg">Delivery History</h3>
              <Link href={`/admin/orders?search=${rider.full_name}`} className="text-sm text-blue-400 hover:text-blue-300">
                View All
              </Link>
            </div>
            <div className="p-8 text-center text-muted-foreground text-sm">
              Use the Orders page to view the full delivery history for this rider.
            </div>
          </div>
        </motion.div>
      </div>

      {/* Confirm Modal */}
      {confirmModal && (
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal(null)}
          onConfirm={handleStatusUpdate}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmLabel={confirmModal.title}
          variant={confirmModal.variant}
          loading={actionLoading}
        />
      )}
    </div>
  );
}
