"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  CreditCard, DollarSign, Activity, CheckCircle, Clock
} from "lucide-react";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import { PageHeader } from "@/components/admin/page-header";
import { FilterBar } from "@/components/admin/filter-bar";
import { DataTable } from "@/components/admin/data-table";
import { StatusBadge } from "@/components/admin/status-badge";
import { StatCard } from "@/components/admin/stat-card";

interface Transaction {
  id: string;
  amount: number;
  type: string;
  status: string;
  payment_method: string;
  reference: string;
  created_at: string;
  order?: {
    id: string;
    buyer: {
      full_name: string;
    } | null;
  } | null;
}

const statusOptions = [
  { value: "", label: "All Statuses" },
  { value: "completed", label: "Completed" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
];

const typeOptions = [
  { value: "", label: "All Types" },
  { value: "payment", label: "Payment" },
  { value: "refund", label: "Refund" },
  { value: "payout", label: "Payout" },
];

export default function PaymentsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    todayRevenue: 0,
  });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");
      if (status) params.set("status", status);
      if (type) params.set("type", type);
      if (debouncedSearch) params.set("search", debouncedSearch);

      const [res, metricsRes] = await Promise.all([
        fetch(`/api/admin/payments?${params}`),
        fetch(`/api/admin/metrics`)
      ]);

      if (res.ok) {
        const data = await res.json();
        setTransactions(data.data || []);
        setTotal(data.count || 0);
        setTotalPages(Math.ceil((data.count || 0) / 20));
      }
      if (metricsRes.ok) {
        const data = await metricsRes.json();
        setMetrics({
          totalRevenue: data.totalRevenue || 0,
          todayRevenue: data.todayRevenue || 0,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [page, status, type, debouncedSearch]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [status, type, debouncedSearch]);

  const columns = [
    {
      key: "id",
      label: "Transaction ID",
      render: (val: string, row: Transaction) => (
        <div>
          <span className="font-mono text-xs text-muted-foreground">#{val.slice(0, 8)}</span>
          {row.reference && (
            <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">{row.reference}</p>
          )}
        </div>
      ),
    },
    {
      key: "order",
      label: "Customer / Order",
      render: (_: any, row: Transaction) => (
        <div>
          <p className="text-sm font-medium">{row.order?.buyer?.full_name || "Unknown Customer"}</p>
          {row.order && (
            <p className="text-xs text-blue-400 font-mono">Order #{row.order.id.slice(0, 8)}</p>
          )}
        </div>
      ),
    },
    {
      key: "amount",
      label: "Amount",
      render: (val: number, row: Transaction) => (
        <span className={`font-display font-bold ${row.type === 'refund' || row.type === 'payout' ? 'text-red-400' : 'text-green-400'}`}>
          {row.type === 'refund' || row.type === 'payout' ? '-' : '+'}{formatCurrency(val)}
        </span>
      ),
    },
    {
      key: "payment_method",
      label: "Method",
      render: (val: string) => <span className="text-sm capitalize">{val || "—"}</span>,
    },
    {
      key: "type",
      label: "Type",
      render: (val: string) => <span className="text-sm capitalize text-muted-foreground">{val}</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (val: string) => <StatusBadge status={val} variant="payment" />,
    },
    {
      key: "created_at",
      label: "Date",
      render: (val: string) => (
        <span className="text-xs text-muted-foreground">{formatRelativeTime(val)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        subtitle="Manage transactions and revenue"
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Revenue" value={formatCurrency(metrics.totalRevenue)} icon={DollarSign} color="blue" index={0} />
        <StatCard title="Today's Revenue" value={formatCurrency(metrics.todayRevenue)} icon={Activity} color="green" index={1} />
        <StatCard title="Total Transactions" value={total} icon={CreditCard} color="purple" index={2} />
        <StatCard title="Successful Payments" value={transactions.filter(t => t.status === 'completed').length} icon={CheckCircle} color="green" index={3} />
      </div>

      {/* Filters */}
      <FilterBar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: "Search by reference...",
        }}
        filters={[
          {
            key: "status",
            label: "Status",
            options: statusOptions,
            value: status,
            onChange: setStatus,
          },
          {
            key: "type",
            label: "Type",
            options: typeOptions,
            value: type,
            onChange: setType,
          },
        ]}
      />

      {/* Transactions Table */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <DataTable
          columns={columns}
          data={transactions}
          loading={loading}
          emptyMessage="No transactions found"
          emptyIcon={CreditCard}
          pagination={{
            page,
            totalPages,
            onPageChange: setPage,
          }}
        />
      </motion.div>
    </div>
  );
}
