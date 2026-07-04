"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Star, MessageSquare, EyeOff, Check
} from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import { apiFetch } from "@/lib/api-client";
import { PageHeader } from "@/components/admin/page-header";
import { FilterBar } from "@/components/admin/filter-bar";
import { DataTable } from "@/components/admin/data-table";
import { StatusBadge } from "@/components/admin/status-badge";
import { StatCard } from "@/components/admin/stat-card";
import { ConfirmModal } from "@/components/admin/confirm-modal";

interface Review {
  id: string;
  rating: number;
  comment: string;
  is_hidden: boolean;
  created_at: string;
  reviewer?: { full_name: string } | null;
  product?: { title: string } | null;
}

const statusOptions = [
  { value: "", label: "All Statuses" },
  { value: "published", label: "Published" },
  { value: "hidden", label: "Hidden" },
];

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    reviewId: string;
    action: "hidden" | "published";
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");
      if (status) params.set("status", status);
      if (debouncedSearch) params.set("search", debouncedSearch);

      const res = await fetch(`/api/admin/reviews?${params}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.data || []);
        setTotal(data.count || 0);
        setTotalPages(Math.ceil((data.count || 0) / 20));
      }
    } finally {
      setLoading(false);
    }
  }, [page, status, debouncedSearch]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [status, debouncedSearch]);

  const handleAction = async () => {
    if (!actionModal) return;
    setActionLoading(true);
    try {
      await apiFetch(`/api/admin/reviews`, {
        method: "PATCH",
        body: JSON.stringify({ reviewId: actionModal.reviewId, action: actionModal.action }),
      });
      setActionModal(null);
      fetchReviews();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const hiddenCount = reviews.filter(r => r.is_hidden).length;
  const avgRating = reviews.length > 0
    ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1)
    : "0";

  const columns = [
    {
      key: "comment",
      label: "Review",
      render: (val: unknown, row: Review) => (
        <div className="max-w-[300px]">
          <div className="flex items-center gap-1 mb-1 text-yellow-400">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={`w-3 h-3 ${i < row.rating ? "fill-yellow-400" : "text-white/20"}`} />
            ))}
          </div>
          <p className="text-sm truncate">{String(val || "No comment")}</p>
        </div>
      ),
    },
    {
      key: "reviewer",
      label: "Customer / Product",
      render: (_: unknown, row: Review) => (
        <div>
          <p className="text-sm font-medium">{row.reviewer?.full_name || "Unknown User"}</p>
          <p className="text-xs text-muted-foreground truncate max-w-[200px]">{row.product?.title || "Unknown Product"}</p>
        </div>
      ),
    },
    {
      key: "is_hidden",
      label: "Status",
      render: (val: unknown) => <StatusBadge status={val ? "hidden" : "published"} />,
    },
    {
      key: "created_at",
      label: "Date",
      render: (val: unknown) => <span className="text-xs text-muted-foreground">{formatRelativeTime(String(val))}</span>,
    },
  ];

  const actions = [
    {
      label: "Hide Review",
      icon: EyeOff,
      onClick: (row: Review) => {
        if (row.is_hidden) return;
        setActionModal({
          isOpen: true,
          reviewId: row.id,
          action: "hidden",
        });
      },
    },
    {
      label: "Approve",
      icon: Check,
      onClick: (row: Review) => {
        if (!row.is_hidden) return;
        setActionModal({
          isOpen: true,
          reviewId: row.id,
          action: "published",
        });
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reviews"
        subtitle="Monitor customer feedback and ratings"
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total Reviews" value={total} icon={MessageSquare} color="blue" index={0} />
        <StatCard title="Average Rating" value={avgRating} icon={Star} color="yellow" index={1} />
        <StatCard title="Hidden Reviews" value={hiddenCount} icon={EyeOff} color="orange" index={2} />
      </div>

      {/* Filters */}
      <FilterBar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: "Search reviews...",
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

      {/* Reviews Table */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <DataTable
          columns={columns}
          data={reviews}
          loading={loading}
          emptyMessage="No reviews found"
          emptyIcon={MessageSquare}
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
          title={actionModal.action === "hidden" ? "Hide Review" : "Approve Review"}
          message={actionModal.action === "hidden" 
            ? "Are you sure you want to hide this review? It will no longer be visible to customers."
            : "Are you sure you want to approve this review? It will be visible to customers."}
          confirmLabel={actionModal.action === "hidden" ? "Hide Review" : "Approve Review"}
          variant={actionModal.action === "hidden" ? "warning" : "default"}
          loading={actionLoading}
        />
      )}
    </div>
  );
}
