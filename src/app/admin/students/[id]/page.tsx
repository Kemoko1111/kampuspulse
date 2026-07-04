"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft, User, Phone, MapPin, Mail, Loader2,
  ShieldAlert, Ban, Check, Package, DollarSign
} from "lucide-react";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import { apiFetch } from "@/lib/api-client";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { ConfirmModal } from "@/components/admin/confirm-modal";
import { StatCard } from "@/components/admin/stat-card";
import { DataTable } from "@/components/admin/data-table";

interface StudentOrder {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  seller: { full_name: string } | null;
}

interface StudentDetail {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  hall_of_residence?: string;
  status: string;
  created_at: string;
  stats?: {
    totalOrders: number;
    totalSpent: number;
  };
}

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;

  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [studentOrders, setStudentOrders] = useState<StudentOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersTotalPages, setOrdersTotalPages] = useState(1);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    action: "suspend" | "ban" | "activate";
    title: string;
    message: string;
    variant: "default" | "warning" | "danger";
  } | null>(null);

  const fetchStudent = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${studentId}`);
      if (res.ok) {
        const data = await res.json();
        setStudent(data.data);
      }
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => { fetchStudent(); }, [fetchStudent]);

  const fetchStudentOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const params = new URLSearchParams({ buyerId: studentId, page: String(ordersPage), limit: "10" });
      const res = await fetch(`/api/admin/orders?${params}`);
      if (res.ok) {
        const data = await res.json();
        setStudentOrders(data.orders || []);
        setOrdersTotalPages(data.totalPages || 1);
      }
    } finally {
      setOrdersLoading(false);
    }
  }, [studentId, ordersPage]);

  useEffect(() => { fetchStudentOrders(); }, [fetchStudentOrders]);

  const handleStatusUpdate = async () => {
    if (!confirmModal) return;
    setActionLoading(true);
    try {
      await apiFetch(`/api/admin/users`, {
        method: "PATCH",
        body: JSON.stringify({
          userId: studentId,
          action: confirmModal.action,
        }),
      });
      setConfirmModal(null);
      fetchStudent();
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
          <p className="text-sm text-muted-foreground">Loading student details…</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <User className="w-12 h-12 text-muted-foreground/30 mb-3" />
        <h2 className="font-display font-bold text-xl mb-1">Student not found</h2>
        <p className="text-muted-foreground text-sm mb-4">This user may have been deleted.</p>
        <Link href="/admin/students" className="btn-primary text-sm">
          Back to Students
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link href="/admin/students" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Students
      </Link>

      <PageHeader
        title={student.full_name || "Unknown Student"}
        subtitle={`Joined ${formatRelativeTime(student.created_at)}`}
        actions={
          <div className="flex items-center gap-3">
            <StatusBadge status={student.status} variant="user" />
          </div>
        }
      />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-1 space-y-6">
          <div className="glass-card p-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-white text-xl font-bold flex-shrink-0 shadow-lg shadow-blue-500/20">
                {student.full_name?.substring(0, 2).toUpperCase() || "ST"}
              </div>
              <div>
                <h3 className="font-display font-bold text-lg">{student.full_name}</h3>
                <p className="text-sm text-muted-foreground">{student.email}</p>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/5">
              {student.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="text-sm font-medium">{student.phone}</p>
                  </div>
                </div>
              )}
              {student.email && (
                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-medium">{student.email}</p>
                  </div>
                </div>
              )}
              {student.hall_of_residence && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Hostel</p>
                    <p className="text-sm font-medium">{student.hall_of_residence}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="glass-card p-6 space-y-3">
            <h4 className="font-display font-bold text-sm mb-4">Account Actions</h4>
            {student.status !== "active" && (
              <button
                onClick={() => setConfirmModal({
                  isOpen: true, action: "activate", title: "Activate Account", message: `Are you sure you want to activate ${student.full_name}?`, variant: "default"
                })}
                className="w-full btn-primary flex justify-center items-center gap-2"
              >
                <Check className="w-4 h-4" /> Activate Account
              </button>
            )}
            {student.status !== "suspended" && (
              <button
                onClick={() => setConfirmModal({
                  isOpen: true, action: "suspend", title: "Suspend Account", message: `Are you sure you want to suspend ${student.full_name}? They will not be able to order.`, variant: "warning"
                })}
                className="w-full px-4 py-2.5 rounded-xl border border-orange-500/30 text-orange-400 hover:bg-orange-500/10 transition-colors flex justify-center items-center gap-2 text-sm font-semibold"
              >
                <ShieldAlert className="w-4 h-4" /> Suspend Account
              </button>
            )}
            {student.status !== "banned" && (
              <button
                onClick={() => setConfirmModal({
                  isOpen: true, action: "ban", title: "Ban Account", message: `Are you sure you want to ban ${student.full_name}? This permanently blocks access.`, variant: "danger"
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
            <StatCard title="Total Orders" value={student.stats?.totalOrders || 0} icon={Package} color="blue" index={0} />
            <StatCard title="Total Spent" value={formatCurrency(student.stats?.totalSpent || 0)} icon={DollarSign} color="green" index={1} />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-lg">Order History</h3>
              <Link href={`/admin/orders?search=${student.full_name}`} className="text-sm text-blue-400 hover:text-blue-300">
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
                  key: "seller",
                  label: "Seller",
                  render: (_: unknown, row: StudentOrder) => row.seller?.full_name || "Unknown",
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
              data={studentOrders}
              loading={ordersLoading}
              emptyMessage="No orders yet"
              emptyIcon={Package}
              onRowClick={(row) => router.push(`/admin/orders/${row.id}`)}
              pagination={{
                page: ordersPage,
                totalPages: ordersTotalPages,
                onPageChange: setOrdersPage,
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
