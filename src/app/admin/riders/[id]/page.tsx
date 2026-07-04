"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft, Bike, Phone, Mail, Loader2,
  ShieldAlert, Ban, Check, MapPin, Truck, Award, Package
} from "lucide-react";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import { apiFetch } from "@/lib/api-client";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { ConfirmModal } from "@/components/admin/confirm-modal";
import { StatCard } from "@/components/admin/stat-card";
import { DataTable } from "@/components/admin/data-table";

interface DeliveryOrder {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  buyer: { full_name: string } | null;
}

interface RiderDetail {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  status: string;
  created_at: string;
  rider_profiles: {
    vehicle_type: string;
    vehicle_number: string;
    is_verified: boolean;
    is_available: boolean;
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
  const [deliveries, setDeliveries] = useState<DeliveryOrder[]>([]);
  const [deliveriesLoading, setDeliveriesLoading] = useState(true);
  const [deliveriesPage, setDeliveriesPage] = useState(1);
  const [deliveriesTotalPages, setDeliveriesTotalPages] = useState(1);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    action: "suspend" | "ban" | "activate";
    title: string;
    message: string;
    variant: "default" | "warning" | "danger";
  } | null>(null);
  const [verifyLoading, setVerifyLoading] = useState(false);

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

  const fetchDeliveries = useCallback(async () => {
    setDeliveriesLoading(true);
    try {
      const params = new URLSearchParams({ riderId, page: String(deliveriesPage), limit: "10" });
      const res = await fetch(`/api/admin/orders?${params}`);
      if (res.ok) {
        const data = await res.json();
        setDeliveries(data.orders || []);
        setDeliveriesTotalPages(data.totalPages || 1);
      }
    } finally {
      setDeliveriesLoading(false);
    }
  }, [riderId, deliveriesPage]);

  useEffect(() => { fetchDeliveries(); }, [fetchDeliveries]);

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

  const handleVerifyToggle = async (nextVerified: boolean) => {
    setVerifyLoading(true);
    try {
      await apiFetch(`/api/admin/riders/${riderId}`, {
        method: "PATCH",
        body: JSON.stringify({ is_verified: nextVerified }),
      });
      fetchRider();
    } catch (err) {
      console.error(err);
    } finally {
      setVerifyLoading(false);
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
            <StatusBadge status={profile?.is_available ? "online" : "offline"} variant="rider" />
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
                {profile.vehicle_number && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">License Plate</p>
                      <p className="text-sm font-medium uppercase">{profile.vehicle_number}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Verification — gates whether this rider is matchable to rides */}
          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-display font-bold text-sm">Ride Verification</h4>
              {profile?.is_verified ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-semibold border border-green-500/20">
                  <Check className="w-3 h-3" /> Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-400 text-xs font-semibold border border-orange-500/20">
                  <ShieldAlert className="w-3 h-3" /> Unverified
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {profile?.is_verified
                ? "This rider can receive ride requests. Revoke to stop matching them to new rides."
                : "Unverified riders never receive ride requests. Verify to make them matchable."}
            </p>
            <button
              onClick={() => handleVerifyToggle(!profile?.is_verified)}
              disabled={verifyLoading}
              className={`w-full px-4 py-2.5 rounded-xl flex justify-center items-center gap-2 text-sm font-semibold transition-colors disabled:opacity-50 ${
                profile?.is_verified
                  ? "border border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
                  : "btn-primary"
              }`}
            >
              {verifyLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : profile?.is_verified ? (
                <><ShieldAlert className="w-4 h-4" /> Revoke Verification</>
              ) : (
                <><Check className="w-4 h-4" /> Verify Rider</>
              )}
            </button>
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

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-lg">Delivery History</h3>
              <Link href={`/admin/orders?search=${rider.full_name}`} className="text-sm text-blue-400 hover:text-blue-300">
                View All
              </Link>
            </div>
            <DataTable
              columns={[
                {
                  key: "id",
                  label: "Order",
                  render: (val: unknown) => (
                    <span className="font-mono text-xs text-muted-foreground">#{String(val).slice(0, 8)}</span>
                  ),
                },
                {
                  key: "buyer",
                  label: "Customer",
                  render: (_: unknown, row: DeliveryOrder) => row.buyer?.full_name || "Unknown",
                },
                {
                  key: "total_amount",
                  label: "Amount",
                  render: (val: unknown) => (
                    <span className="font-display font-bold text-blue-400">{formatCurrency(Number(val))}</span>
                  ),
                },
                {
                  key: "status",
                  label: "Status",
                  render: (val: unknown) => <StatusBadge status={String(val)} variant="order" />,
                },
                {
                  key: "created_at",
                  label: "Date",
                  render: (val: unknown) => (
                    <span className="text-xs text-muted-foreground">{formatRelativeTime(String(val))}</span>
                  ),
                },
              ]}
              data={deliveries}
              loading={deliveriesLoading}
              emptyMessage="No deliveries yet"
              emptyIcon={Package}
              onRowClick={(row) => router.push(`/admin/orders/${row.id}`)}
              pagination={{
                page: deliveriesPage,
                totalPages: deliveriesTotalPages,
                onPageChange: setDeliveriesPage,
              }}
            />
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
