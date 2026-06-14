"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Users, Check, X, ShieldAlert, Ban,
  Search, Eye, Loader2
} from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import { apiFetch } from "@/lib/api-client";
import { PageHeader } from "@/components/admin/page-header";
import { FilterBar } from "@/components/admin/filter-bar";
import { DataTable } from "@/components/admin/data-table";
import { StatusBadge } from "@/components/admin/status-badge";
import { StatCard } from "@/components/admin/stat-card";
import { ConfirmModal } from "@/components/admin/confirm-modal";

interface Student {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  hall_of_residence?: string;
  status: string;
  created_at: string;
}

const statusOptions = [
  { value: "", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
  { value: "banned", label: "Banned" },
];

export default function StudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    userId: string;
    action: "suspend" | "ban" | "activate";
    title: string;
    message: string;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");
      params.set("role", "student");
      if (status) params.set("status", status);
      if (debouncedSearch) params.set("search", debouncedSearch);

      const res = await fetch(`/api/admin/users?${params}`);
      if (res.ok) {
        const data = await res.json();
        setStudents(data.data || []);
        setTotal(data.count || 0);
        setTotalPages(Math.ceil((data.count || 0) / 20));
      }
    } finally {
      setLoading(false);
    }
  }, [page, status, debouncedSearch]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [status, debouncedSearch]);

  const handleAction = async () => {
    if (!actionModal) return;
    setActionLoading(true);
    try {
      await apiFetch(`/api/admin/users`, {
        method: "PATCH",
        body: JSON.stringify({ userId: actionModal.userId, action: actionModal.action }),
      });
      setActionModal(null);
      fetchStudents();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // Compute stats
  const activeCount = students.filter((s) => s.status === "active").length;
  const suspendedCount = students.filter((s) => s.status === "suspended").length;

  const columns = [
    {
      key: "full_name",
      label: "Name",
      render: (val: string, row: Student) => (
        <div>
          <p className="text-sm font-medium">{val || "Unknown"}</p>
          {row.email && <p className="text-xs text-muted-foreground">{row.email}</p>}
        </div>
      ),
    },
    {
      key: "phone",
      label: "Phone",
      render: (val?: string) => <span className="text-sm">{val || "—"}</span>,
    },
    {
      key: "hall_of_residence",
      label: "Hostel",
      render: (val?: string) => <span className="text-sm">{val || "—"}</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (val: string) => <StatusBadge status={val} variant="user" />,
    },
    {
      key: "created_at",
      label: "Joined",
      render: (val: string) => (
        <span className="text-xs text-muted-foreground">{formatRelativeTime(val)}</span>
      ),
    },
  ];

  const actions = [
    {
      label: "View Details",
      icon: Eye,
      onClick: (row: Student) => router.push(`/admin/students/${row.id}`),
    },
    {
      label: "Activate",
      icon: Check,
      onClick: (row: Student) => {
        if (row.status === "active") return;
        setActionModal({
          isOpen: true,
          userId: row.id,
          action: "activate",
          title: "Activate Student",
          message: `Are you sure you want to activate ${row.full_name}?`,
        });
      },
    },
    {
      label: "Suspend",
      icon: ShieldAlert,
      onClick: (row: Student) => {
        if (row.status === "suspended") return;
        setActionModal({
          isOpen: true,
          userId: row.id,
          action: "suspend",
          title: "Suspend Student",
          message: `Are you sure you want to suspend ${row.full_name}? They won't be able to log in.`,
        });
      },
    },
    {
      label: "Ban",
      icon: Ban,
      variant: "danger" as const,
      onClick: (row: Student) => {
        if (row.status === "banned") return;
        setActionModal({
          isOpen: true,
          userId: row.id,
          action: "ban",
          title: "Ban Student",
          message: `Are you sure you want to ban ${row.full_name}? This will permanently block their access.`,
        });
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Students"
        subtitle="Manage student accounts and access"
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total Students" value={total} icon={Users} color="blue" index={0} />
        <StatCard title="Active Students" value={activeCount} icon={Check} color="green" index={1} />
        <StatCard title="Suspended" value={suspendedCount} icon={ShieldAlert} color="orange" index={2} />
      </div>

      {/* Filters */}
      <FilterBar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: "Search students by name...",
        }}
        filters={[
          {
            key: "status",
            label: "Status",
            options: statusOptions,
            value: status,
            onChange: setStatus,
          },
        ]}
      />

      {/* Students Table */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <DataTable
          columns={columns}
          data={students}
          loading={loading}
          emptyMessage="No students found"
          emptyIcon={Users}
          onRowClick={(row) => router.push(`/admin/students/${row.id}`)}
          actions={actions}
          pagination={{
            page,
            totalPages,
            onPageChange: setPage,
          }}
        />
      </motion.div>

      {/* Confirm Modal */}
      {actionModal && (
        <ConfirmModal
          isOpen={actionModal.isOpen}
          onClose={() => setActionModal(null)}
          onConfirm={handleAction}
          title={actionModal.title}
          message={actionModal.message}
          confirmLabel={actionModal.title}
          variant={actionModal.action === "ban" ? "danger" : actionModal.action === "suspend" ? "warning" : "default"}
          loading={actionLoading}
        />
      )}
    </div>
  );
}
