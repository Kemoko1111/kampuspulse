"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Tag, Plus, AlertTriangle, Percent, Loader2
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { PageHeader } from "@/components/admin/page-header";
import { FilterBar } from "@/components/admin/filter-bar";
import { DataTable } from "@/components/admin/data-table";
import { StatusBadge } from "@/components/admin/status-badge";
import { StatCard } from "@/components/admin/stat-card";

interface Promotion {
  id: string;
  code: string;
  description: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_order_amount: number;
  max_uses: number | null;
  expires_at: string | null;
  status: string;
  created_at: string;
}

const statusOptions = [
  { value: "", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "expired", label: "Expired" },
  { value: "disabled", label: "Disabled" },
];

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discount_type: "percentage",
    discount_value: "",
    min_order_amount: "",
    max_uses: "",
    expires_at: "",
  });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchPromotions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");
      if (status) params.set("status", status);
      if (debouncedSearch) params.set("search", debouncedSearch);

      const res = await fetch(`/api/admin/promotions?${params}`);
      if (res.ok) {
        const data = await res.json();
        setPromotions(data.data || []);
        setTotal(data.count || 0);
        setTotalPages(Math.ceil((data.count || 0) / 20));
      }
    } finally {
      setLoading(false);
    }
  }, [page, status, debouncedSearch]);

  useEffect(() => { fetchPromotions(); }, [fetchPromotions]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [status, debouncedSearch]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await apiFetch(`/api/admin/promotions`, {
        method: "POST",
        body: JSON.stringify({
          ...formData,
          discount_value: Number(formData.discount_value),
          min_order_amount: formData.min_order_amount ? Number(formData.min_order_amount) : 0,
          max_uses: formData.max_uses ? Number(formData.max_uses) : null,
          expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null,
        }),
      });
      if (!res.ok) {
          const err = await res.json();
          alert(err.error || "Failed to create promotion");
          return;
      }
      setIsModalOpen(false);
      setFormData({
        code: "", description: "", discount_type: "percentage", discount_value: "", min_order_amount: "", max_uses: "", expires_at: ""
      });
      fetchPromotions();
    } catch {
      alert("Error creating promotion");
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      key: "code",
      label: "Code",
      render: (val: unknown) => <span className="font-mono font-bold px-2 py-1 bg-white/10 rounded-md uppercase">{String(val)}</span>,
    },
    {
      key: "description",
      label: "Description",
      render: (val: unknown) => <span className="text-sm text-muted-foreground truncate max-w-[200px] block">{String(val)}</span>,
    },
    {
      key: "discount",
      label: "Discount",
      render: (_: unknown, row: Promotion) => (
        <span className="font-bold text-green-400">
          {row.discount_type === "percentage" ? `${row.discount_value}%` : `GHC ${row.discount_value}`}
        </span>
      ),
    },
    {
      key: "min_order_amount",
      label: "Min Order",
      render: (val: unknown) => <span className="text-sm">GHC {Number(val) || 0}</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (val: unknown) => <StatusBadge status={String(val)} />,
    },
    {
      key: "expires_at",
      label: "Expires",
      render: (val: unknown) => <span className="text-xs text-muted-foreground">{val ? new Date(String(val)).toLocaleDateString() : "Never"}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Promotions"
        subtitle="Manage coupons and discount codes"
        actions={
          <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Create Promotion
          </button>
        }
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total Promotions" value={total} icon={Tag} color="blue" index={0} />
        <StatCard title="Active Promotions" value={promotions.filter(p => p.status === 'active').length} icon={Percent} color="green" index={1} />
        <StatCard title="Expired Promotions" value={promotions.filter(p => p.status === 'expired').length} icon={AlertTriangle} color="red" index={2} />
      </div>

      {/* Filters */}
      <FilterBar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: "Search promo code...",
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

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <DataTable
          columns={columns}
          data={promotions}
          loading={loading}
          emptyMessage="No promotions found (Table might not exist yet)"
          emptyIcon={Tag}
          pagination={{
            page,
            totalPages,
            onPageChange: setPage,
          }}
        />
      </motion.div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card w-full max-w-md p-6 relative">
            <h3 className="font-display font-bold text-xl mb-4">Create Promotion</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs text-muted-foreground mb-1 uppercase tracking-wider font-bold">Code</label>
                <input required type="text" className="input-premium w-full uppercase font-mono" placeholder="SUMMER24" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1 uppercase tracking-wider font-bold">Description</label>
                <input required type="text" className="input-premium w-full" placeholder="10% off summer orders" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1 uppercase tracking-wider font-bold">Type</label>
                  <select className="input-premium w-full appearance-none" value={formData.discount_type} onChange={e => setFormData({...formData, discount_type: e.target.value as "percentage" | "fixed"})}>
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1 uppercase tracking-wider font-bold">Value</label>
                  <input required type="number" step="0.01" className="input-premium w-full" placeholder="10" value={formData.discount_value} onChange={e => setFormData({...formData, discount_value: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1 uppercase tracking-wider font-bold">Min Order (Opt)</label>
                  <input type="number" className="input-premium w-full" placeholder="0" value={formData.min_order_amount} onChange={e => setFormData({...formData, min_order_amount: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1 uppercase tracking-wider font-bold">Max Uses (Opt)</label>
                  <input type="number" className="input-premium w-full" placeholder="Unlimited" value={formData.max_uses} onChange={e => setFormData({...formData, max_uses: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1 uppercase tracking-wider font-bold">Expires At (Opt)</label>
                <input type="datetime-local" className="input-premium w-full" value={formData.expires_at} onChange={e => setFormData({...formData, expires_at: e.target.value})} />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 transition-colors text-sm font-bold">Cancel</button>
                <button type="submit" disabled={actionLoading} className="flex-1 btn-primary flex justify-center items-center">
                  {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
