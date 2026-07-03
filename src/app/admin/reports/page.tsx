"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  DollarSign, Package, Users, ShoppingBag, Download, Calculator, Loader2
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/admin/page-header";
import { StatCard } from "@/components/admin/stat-card";
import { ChartCard } from "@/components/admin/chart-card";

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalStudents: 0,
    totalProducts: 0,
    revenueByDay: {} as Record<string, number>,
  });
  const [dateRange, setDateRange] = useState("This Month");

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/metrics`);
      if (res.ok) {
        const data = await res.json();
        setMetrics({
          totalRevenue: data.totalRevenue || 0,
          totalOrders: data.totalOrders || 0,
          totalStudents: data.totalStudents || 0,
          totalProducts: data.totalProducts || 0,
          revenueByDay: data.revenueByDay || {},
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMetrics(); }, [fetchMetrics]);

  const handleExport = (type: string) => {
    alert(`Exporting ${type} CSV feature is coming soon!`);
  };

  const chartData = Object.entries(metrics.revenueByDay)
    .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
    .map(([label, value]) => ({ label, value }));

  const avgOrderValue = metrics.totalOrders > 0 ? metrics.totalRevenue / metrics.totalOrders : 0;
  const ordersPerStudent = metrics.totalStudents > 0 ? metrics.totalOrders / metrics.totalStudents : 0;
  const revenuePerProduct = metrics.totalProducts > 0 ? metrics.totalRevenue / metrics.totalProducts : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          <p className="text-sm text-muted-foreground">Generating reports…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        subtitle="Analytics and business insights"
      />

      {/* Date Range Selector */}
      <div className="glass-card p-2 flex gap-2 w-fit">
        {["Today", "This Week", "This Month", "All Time"].map((range) => (
          <button
            key={range}
            onClick={() => setDateRange(range)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              dateRange === range ? "bg-white/10 text-white" : "text-muted-foreground hover:text-white hover:bg-white/5"
            }`}
          >
            {range}
          </button>
        ))}
      </div>

      {/* Overview Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Revenue" value={formatCurrency(metrics.totalRevenue)} icon={DollarSign} color="blue" index={0} />
        <StatCard title="Total Orders" value={metrics.totalOrders} icon={Package} color="green" index={1} />
        <StatCard title="Total Students" value={metrics.totalStudents} icon={Users} color="purple" index={2} />
        <StatCard title="Total Products" value={metrics.totalProducts} icon={ShoppingBag} color="orange" index={3} />
      </div>

      {/* Charts & Quick Insights Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2 space-y-6">
          <ChartCard title={`Revenue (${dateRange})`} data={chartData} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-6">
          {/* Quick Insights */}
          <div className="glass-card p-6">
            <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-purple-400" /> Quick Insights
            </h3>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">Avg Order Value</p>
                <p className="font-display font-bold text-xl text-white">{formatCurrency(avgOrderValue)}</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">Orders per Student</p>
                <p className="font-display font-bold text-xl text-white">{ordersPerStudent.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">orders/student</span></p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">Revenue per Product</p>
                <p className="font-display font-bold text-xl text-white">{formatCurrency(revenuePerProduct)}</p>
              </div>
            </div>
          </div>

          {/* Export Data */}
          <div className="glass-card p-6">
            <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
              <Download className="w-5 h-5 text-blue-400" /> Export Data
            </h3>
            <div className="space-y-3">
              <button onClick={() => handleExport("Orders")} className="w-full flex items-center justify-between p-3 rounded-xl border border-white/10 hover:bg-white/5 transition-all text-left">
                <span className="text-sm font-bold">Export Orders (CSV)</span>
                <Download className="w-4 h-4 text-muted-foreground" />
              </button>
              <button onClick={() => handleExport("Users")} className="w-full flex items-center justify-between p-3 rounded-xl border border-white/10 hover:bg-white/5 transition-all text-left">
                <span className="text-sm font-bold">Export Users (CSV)</span>
                <Download className="w-4 h-4 text-muted-foreground" />
              </button>
              <button onClick={() => handleExport("Transactions")} className="w-full flex items-center justify-between p-3 rounded-xl border border-white/10 hover:bg-white/5 transition-all text-left">
                <span className="text-sm font-bold">Export Transactions (CSV)</span>
                <Download className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
