"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Package, Clock, CheckCircle, XCircle,
  Loader2, Eye, Check, X,
} from "lucide-react";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import { apiFetch } from "@/lib/api-client";
import { PageHeader } from "@/components/admin/page-header";
import { FilterBar } from "@/components/admin/filter-bar";
import { DataTable } from "@/components/admin/data-table";
import { StatusBadge } from "@/components/admin/status-badge";
import { StatCard } from "@/components/admin/stat-card";
import { ConfirmModal } from "@/components/admin/confirm-modal";

interface OrderBuyer {
  id: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  hall_of_residence?: string;
}

interface Order {
  id: string;
  total_amount: number;
  delivery_fee: number;
  status: string;
  payment_method: string;
  payment_status: string;
  delivery_address: string;
  notes: string;
  created_at: string;
  buyer: OrderBuyer | null;
  seller: { full_name: string } | null;
}

const statusOptions = [
  { value: "", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "preparing", label: "Preparing" },
  { value: "ready", label: "Ready" },
  { value: "picked_up", label: "Picked Up" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    orderId: string;
    action: "accept" | "reject";
    title: string;
    message: string;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");
      if (status) params.set("status", status);
      if (debouncedSearch) params.set("search", debouncedSearch);

      const res = await fetch(`/api/admin/orders?${params}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } finally {
      setLoading(false);
    }
  }, [page, status, debouncedSearch]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [status, debouncedSearch]);

  const handleAction = async () => {
    if (!actionModal) return;
    setActionLoading(true);
    try {
      await apiFetch(`/api/admin/orders/${actionModal.orderId}`, {
        method: "PATCH",
        body: JSON.stringify({ action: actionModal.action }),
      });
      setActionModal(null);
      fetchOrders();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // Compute quick stats from current data
  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const deliveredCount = orders.filter((o) => o.status === "delivered").length;
  const cancelledCount = orders.filter((o) => o.status === "cancelled").length;

  const columns = [
    {
      key: "id",
      label: "Order",
      render: (val: string) => (
        <span className="font-mono text-xs text-muted-foreground">#{val.slice(0, 8)}</span>
      ),
    },
    {
      key: "buyer",
      label: "Customer",
      render: (_: any, row: Order) => (
        <div>
          <p className="text-sm font-medium">{row.buyer?.full_name || "Unknown"}</p>
          {row.buyer?.phone && (
            <p className="text-xs text-muted-foreground">{row.buyer.phone}</p>
          )}
        </div>
      ),
    },
    {
      key: "total_amount",
      label: "Amount",
      render: (val: number) => (
        <span className="font-display font-bold text-blue-400">{formatCurrency(val)}</span>
      ),
    },
    {
      key: "payment_status",
      label: "Payment",
      render: (val: string) => <StatusBadge status={val} variant="payment" />,
    },
    {
      key: "status",
      label: "Status",
      render: (val: string) => <StatusBadge status={val} variant="order" />,
    },
    {
      key: "created_at",
      label: "Date",
      render: (val: string) => (
        <span className="text-xs text-muted-foreground">{formatRelativeTime(val)}</span>
      ),
    },
  ];

  const actions = [
    {
      label: "View Details",
      icon: Eye,
      onClick: (row: Order) => router.push(`/admin/orders/${row.id}`),
    },
    {
      label: "Accept",
      icon: Check,
      onClick: (row: Order) => {
        if (row.status !== "pending") return;
        setActionModal({
          isOpen: true,
          orderId: row.id,
          action: "accept",
          title: "Accept Order",
          message: `Accept order #${row.id.slice(0, 8)} from ${row.buyer?.full_name || "Unknown"}?`,
        });
      },
    },
    {
      label: "Reject",
      icon: X,
      variant: "danger" as const,
      onClick: (row: Order) => {
        if (row.status !== "pending") return;
        setActionModal({
          isOpen: true,
          orderId: row.id,
          action: "reject",
          title: "Reject Order",
          message: `Are you sure you want to reject order #${row.id.slice(0, 8)}? This cannot be undone.`,
        });
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        subtitle="Manage all platform orders"
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Orders" value={total} icon={Package} color="blue" index={0} />
        <StatCard title="Pending" value={pendingCount} icon={Clock} color="yellow" index={1} />
        <StatCard title="Delivered" value={deliveredCount} icon={CheckCircle} color="green" index={2} />
        <StatCard title="Cancelled" value={cancelledCount} icon={XCircle} color="red" index={3} />
      </div>

      {/* Filters */}
      <FilterBar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: "Search orders by customer name...",
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

      {/* Orders Table */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <DataTable
          columns={columns}
          data={orders}
          loading={loading}
          emptyMessage="No orders found"
          emptyIcon={Package}
          onRowClick={(row) => router.push(`/admin/orders/${row.id}`)}
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
          confirmLabel={actionModal.action === "accept" ? "Accept Order" : "Reject Order"}
          variant={actionModal.action === "reject" ? "danger" : "default"}
          loading={actionLoading}
        />
      )}
    </div>
  );
}
