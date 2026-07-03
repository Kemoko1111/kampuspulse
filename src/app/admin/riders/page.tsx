"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Bike, Check, ShieldAlert, Ban,
  Eye
} from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import { apiFetch } from "@/lib/api-client";
import { PageHeader } from "@/components/admin/page-header";
import { FilterBar } from "@/components/admin/filter-bar";
import { DataTable } from "@/components/admin/data-table";
import { StatusBadge } from "@/components/admin/status-badge";
import { StatCard } from "@/components/admin/stat-card";
import { ConfirmModal } from "@/components/admin/confirm-modal";

interface Rider {
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
}

const statusOptions = [
  { value: "", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
  { value: "banned", label: "Banned" },
];

export default function RidersPage() {
  const router = useRouter();
  const [riders, setRiders] = useState<Rider[]>([]);
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

  const fetchRiders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");
      if (status) params.set("status", status);
      if (debouncedSearch) params.set("search", debouncedSearch);

      const res = await fetch(`/api/admin/riders?${params}`);
      if (res.ok) {
        const data = await res.json();
        setRiders(data.data || []);
        setTotal(data.count || 0);
        setTotalPages(Math.ceil((data.count || 0) / 20));
      }
    } finally {
      setLoading(false);
    }
  }, [page, status, debouncedSearch]);

  useEffect(() => { fetchRiders(); }, [fetchRiders]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [status, debouncedSearch]);

  const handleAction = async () => {
    if (!actionModal) return;
    setActionLoading(true);
    try {
      await apiFetch(`/api/admin/riders/${actionModal.userId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: actionModal.action === "activate" ? "active" : actionModal.action }),
      });
      setActionModal(null);
      fetchRiders();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // Compute stats
  const activeCount = riders.filter((s) => s.status === "active").length;
  const onlineCount = riders.filter((s) => s.rider_profiles?.[0]?.current_status === "online").length;

  const columns = [
    {
      key: "full_name",
      label: "Name",
      render: (val: string, row: Rider) => (
        <div>
          <p className="text-sm font-medium">{val || "Unknown"}</p>
          {row.phone && <p className="text-xs text-muted-foreground">{row.phone}</p>}
        </div>
      ),
    },
    {
      key: "vehicle",
      label: "Vehicle",
      render: (_: any, row: Rider) => {
        const profile = row.rider_profiles?.[0];
        if (!profile) return <span className="text-sm text-muted-foreground">—</span>;
        return (
          <div>
            <p className="text-sm capitalize">{profile.vehicle_type || "—"}</p>
            {profile.vehicle_plate && <p className="text-xs text-muted-foreground">{profile.vehicle_plate}</p>}
          </div>
        );
      },
    },
    {
      key: "rider_status",
      label: "Duty Status",
      render: (_: any, row: Rider) => {
        const dutyStatus = row.rider_profiles?.[0]?.current_status || "offline";
        return <StatusBadge status={dutyStatus} variant="rider" />;
      },
    },
    {
      key: "status",
      label: "Account Status",
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
      onClick: (row: Rider) => router.push(`/admin/riders/${row.id}`),
    },
    {
      label: "Activate",
      icon: Check,
      onClick: (row: Rider) => {
        if (row.status === "active") return;
        setActionModal({
          isOpen: true,
          userId: row.id,
          action: "activate",
          title: "Activate Rider",
          message: `Are you sure you want to activate ${row.full_name}?`,
        });
      },
    },
    {
      label: "Suspend",
      icon: ShieldAlert,
      onClick: (row: Rider) => {
        if (row.status === "suspended") return;
        setActionModal({
          isOpen: true,
          userId: row.id,
          action: "suspend",
          title: "Suspend Rider",
          message: `Are you sure you want to suspend ${row.full_name}? They won't be able to log in or accept orders.`,
        });
      },
    },
    {
      label: "Ban",
      icon: Ban,
      variant: "danger" as const,
      onClick: (row: Rider) => {
        if (row.status === "banned") return;
        setActionModal({
          isOpen: true,
          userId: row.id,
          action: "ban",
          title: "Ban Rider",
          message: `Are you sure you want to ban ${row.full_name}? This will permanently block their access.`,
        });
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Riders"
        subtitle="Manage delivery personnel"
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total Riders" value={total} icon={Bike} color="blue" index={0} />
        <StatCard title="Active Accounts" value={activeCount} icon={Check} color="green" index={1} />
        <StatCard title="Currently Online" value={onlineCount} icon={Bike} color="purple" index={2} />
      </div>

      {/* Filters */}
      <FilterBar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: "Search riders by name...",
        }}
        filters={[
          {
            key: "status",
            label: "Account Status",
            options: statusOptions,
            value: status,
            onChange: setStatus,
          },
        ]}
      />

      {/* Riders Table */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <DataTable
          columns={columns}
          data={riders}
          loading={loading}
          emptyMessage="No riders found"
          emptyIcon={Bike}
          onRowClick={(row) => router.push(`/admin/riders/${row.id}`)}
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
