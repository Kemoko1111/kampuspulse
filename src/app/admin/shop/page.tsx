"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ShoppingBag, Check, Plus, AlertTriangle, Trash2, Edit
} from "lucide-react";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import { apiFetch } from "@/lib/api-client";
import { PageHeader } from "@/components/admin/page-header";
import { FilterBar } from "@/components/admin/filter-bar";
import { DataTable } from "@/components/admin/data-table";
import { StatusBadge } from "@/components/admin/status-badge";
import { StatCard } from "@/components/admin/stat-card";
import { ConfirmModal } from "@/components/admin/confirm-modal";
import Link from "next/link";

interface Product {
  id: string;
  title: string;
  price: number;
  stock_quantity: number;
  status: string;
  created_at: string;
  category?: {
    name: string;
  } | null;
}

const statusOptions = [
  { value: "", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
  { value: "archived", label: "Archived" },
];

export default function ShopPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    productId: string;
    title: string;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");
      if (status) params.set("status", status);
      if (debouncedSearch) params.set("search", debouncedSearch);

      const res = await fetch(`/api/admin/products?${params}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.data || []);
        setTotal(data.count || 0);
        setTotalPages(Math.ceil((data.count || 0) / 20));
      }
    } finally {
      setLoading(false);
    }
  }, [page, status, debouncedSearch]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [status, debouncedSearch]);

  const handleDelete = async () => {
    if (!actionModal) return;
    setActionLoading(true);
    try {
      await apiFetch(`/api/admin/products`, {
        method: "DELETE",
        body: JSON.stringify({ id: actionModal.productId }),
      });
      setActionModal(null);
      fetchProducts();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const lowStockCount = products.filter(p => p.stock_quantity > 0 && p.stock_quantity < 10).length;
  const outOfStockCount = products.filter(p => p.stock_quantity === 0).length;

  const columns = [
    {
      key: "title",
      label: "Product",
      render: (val: string, row: Product) => (
        <div>
          <p className="text-sm font-medium truncate max-w-[250px]">{val}</p>
          <p className="text-xs text-muted-foreground capitalize">{row.category?.name || "Uncategorized"}</p>
        </div>
      ),
    },
    {
      key: "price",
      label: "Price",
      render: (val: number) => <span className="font-display font-bold text-orange-400">{formatCurrency(val)}</span>,
    },
    {
      key: "stock_quantity",
      label: "Stock",
      render: (val: number) => (
        <div className="flex items-center gap-1.5">
          <span className={`text-sm ${val === 0 ? "text-red-400 font-bold" : val < 10 ? "text-yellow-400 font-bold" : "text-muted-foreground"}`}>
            {val}
          </span>
          {val === 0 && <AlertTriangle className="w-3 h-3 text-red-400" />}
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (val: string) => <StatusBadge status={val} />,
    },
    {
      key: "created_at",
      label: "Added",
      render: (val: string) => <span className="text-xs text-muted-foreground">{formatRelativeTime(val)}</span>,
    },
  ];

  const actions = [
    {
      label: "Delete",
      icon: Trash2,
      variant: "danger" as const,
      onClick: (row: Product) => {
        setActionModal({
          isOpen: true,
          productId: row.id,
          title: row.title,
        });
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Shop Management"
        subtitle="Manage inventory, prices, and products"
        actions={
          <Link href="/edwom" className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Product
          </Link>
        }
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total Products" value={total} icon={ShoppingBag} color="blue" index={0} />
        <StatCard title="Low Stock" value={lowStockCount} icon={AlertTriangle} color="yellow" index={1} />
        <StatCard title="Out of Stock" value={outOfStockCount} icon={AlertTriangle} color="red" index={2} />
      </div>

      {/* Filters */}
      <FilterBar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: "Search products...",
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

      {/* Products Table */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <DataTable
          columns={columns}
          data={products}
          loading={loading}
          emptyMessage="No products found"
          emptyIcon={ShoppingBag}
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
          onConfirm={handleDelete}
          title="Delete Product"
          message={`Are you sure you want to delete "${actionModal.title}"? This cannot be undone.`}
          confirmLabel="Delete Product"
          variant="danger"
          loading={actionLoading}
        />
      )}
    </div>
  );
}
