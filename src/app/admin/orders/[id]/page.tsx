"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft, Package, User, CreditCard,
  MapPin, FileText, Loader2, CheckCircle,
  XCircle, ChefHat, Bike, Check, Undo2,
  AlertCircle,
  type LucideIcon,
} from "lucide-react";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import { apiFetch } from "@/lib/api-client";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { ConfirmModal } from "@/components/admin/confirm-modal";

interface OrderDetail {
  id: string;
  total_amount: number;
  delivery_fee: number;
  status: string;
  payment_method: string;
  payment_status: string;
  payment_reference?: string;
  delivery_address: string;
  notes: string;
  created_at: string;
  transaction?: { id: string; amount: number; status: string } | null;
  buyer: {
    id: string;
    full_name: string;
    phone?: string;
    avatar_url?: string;
    hall_of_residence?: string;
  } | null;
  seller: {
    id: string;
    full_name: string;
  } | null;
  order_items: {
    id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    product?: { title: string } | null;
  }[];
}

// Statuses MUST match the orders.status DB CHECK (pending, confirmed,
// processing, shipped, delivered, cancelled, refunded) — the old flow used
// preparing/ready/picked_up, which the DB rejected, so every advance past
// "confirmed" 500'd. This also matches the buyer's order-tracking timeline.
const statusFlow: Record<string, { next: string; label: string; icon: LucideIcon }> = {
  pending: { next: "confirmed", label: "Accept Order", icon: Check },
  confirmed: { next: "processing", label: "Mark as Preparing", icon: ChefHat },
  processing: { next: "shipped", label: "Mark as Out for Delivery", icon: Bike },
  shipped: { next: "delivered", label: "Mark as Delivered", icon: CheckCircle },
};

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    action: string;
    status: string;
    title: string;
    message: string;
    variant: "default" | "danger";
  } | null>(null);

  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [refundConfirmOpen, setRefundConfirmOpen] = useState(false);
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundResult, setRefundResult] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`);
      if (res.ok) {
        const data = await res.json();
        const fetchedOrder = (data.order || data) as OrderDetail;
        setOrder(fetchedOrder);
        setRefundAmount(String(fetchedOrder.transaction?.amount ?? fetchedOrder.total_amount ?? ""));
      }
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  const handleStatusUpdate = async () => {
    if (!confirmModal) return;
    setActionLoading(true);
    try {
      await apiFetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        body: JSON.stringify({
          action: confirmModal.action === "reject" ? "reject" : "update_status",
          status: confirmModal.status,
        }),
      });
      setConfirmModal(null);
      fetchOrder();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefund = async () => {
    if (!order?.transaction) return;
    setRefundLoading(true);
    setRefundResult(null);
    try {
      const res = await apiFetch("/api/paystack/refund", {
        method: "POST",
        body: JSON.stringify({
          transactionId: order.transaction.id,
          amount: parseFloat(refundAmount),
          reason: refundReason || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Refund failed");
      setRefundResult({ type: "success", message: "Refund initiated successfully." });
      setRefundConfirmOpen(false);
      fetchOrder();
    } catch (err) {
      setRefundResult({ type: "error", message: err instanceof Error ? err.message : "Refund failed" });
    } finally {
      setRefundLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          <p className="text-sm text-muted-foreground">Loading order details…</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Package className="w-12 h-12 text-muted-foreground/30 mb-3" />
        <h2 className="font-display font-bold text-xl mb-1">Order not found</h2>
        <p className="text-muted-foreground text-sm mb-4">This order may have been deleted.</p>
        <Link href="/admin/orders" className="btn-primary text-sm">
          Back to Orders
        </Link>
      </div>
    );
  }

  const nextStep = statusFlow[order.status];
  const isTerminal = order.status === "delivered" || order.status === "cancelled";

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link href="/admin/orders" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Orders
      </Link>

      <PageHeader
        title={`Order #${order.id.slice(0, 8)}`}
        subtitle={`Created ${formatRelativeTime(order.created_at)}`}
        actions={
          <div className="flex items-center gap-3">
            <StatusBadge status={order.status} variant="order" />
            {isTerminal && (
              <span className="text-xs text-muted-foreground italic">
                {order.status === "delivered" ? "✓ Completed" : "✗ Cancelled"}
              </span>
            )}
          </div>
        }
      />

      {/* Order Info + Customer Info */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Order Information */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 space-y-4">
          <h3 className="font-display font-bold text-lg flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-400" /> Order Information
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Order ID</span>
              <span className="text-sm font-mono">{order.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <StatusBadge status={order.status} variant="order" />
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Created</span>
              <span className="text-sm">{new Date(order.created_at).toLocaleString()}</span>
            </div>
            {order.delivery_address && (
              <div className="pt-2 border-t border-white/5">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Delivery Address</p>
                    <p className="text-sm">{order.delivery_address}</p>
                  </div>
                </div>
              </div>
            )}
            {order.notes && (
              <div className="pt-2 border-t border-white/5">
                <div className="flex items-start gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Notes</p>
                    <p className="text-sm">{order.notes}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Customer + Payment */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6 space-y-4">
          <h3 className="font-display font-bold text-lg flex items-center gap-2">
            <User className="w-5 h-5 text-green-400" /> Customer Information
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Name</span>
              <span className="text-sm font-medium">{order.buyer?.full_name || "Unknown"}</span>
            </div>
            {order.buyer?.phone && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Phone</span>
                <span className="text-sm">{order.buyer.phone}</span>
              </div>
            )}
            {order.buyer?.hall_of_residence && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Hostel</span>
                <span className="text-sm">{order.buyer.hall_of_residence}</span>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-white/5 space-y-3">
            <h4 className="font-display font-bold text-sm flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-purple-400" /> Payment
            </h4>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Method</span>
              <span className="text-sm capitalize">{order.payment_method || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Payment Status</span>
              <StatusBadge status={order.payment_status || "pending"} variant="payment" />
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="text-lg font-display font-black text-blue-400">
                {formatCurrency(order.total_amount)}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Order Items */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card overflow-hidden">
        <div className="p-5 border-b border-white/5">
          <h3 className="font-display font-bold text-lg">Order Items</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Product</th>
                <th className="text-center text-xs font-medium text-muted-foreground px-5 py-3">Qty</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">Unit Price</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {(order.order_items || []).map((item) => (
                <tr key={item.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-5 py-3 text-sm font-medium">
                    {item.product?.title || "Unknown Product"}
                  </td>
                  <td className="px-5 py-3 text-sm text-center">{item.quantity}</td>
                  <td className="px-5 py-3 text-sm text-right text-muted-foreground">
                    {formatCurrency(item.unit_price)}
                  </td>
                  <td className="px-5 py-3 text-sm text-right font-display font-bold">
                    {formatCurrency(item.total_price)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t border-white/10">
              {order.delivery_fee > 0 && (
                <tr>
                  <td colSpan={3} className="px-5 py-2 text-sm text-right text-muted-foreground">Delivery Fee</td>
                  <td className="px-5 py-2 text-sm text-right">{formatCurrency(order.delivery_fee)}</td>
                </tr>
              )}
              <tr>
                <td colSpan={3} className="px-5 py-3 text-right font-display font-bold text-lg">Total</td>
                <td className="px-5 py-3 text-right font-display font-black text-lg text-blue-400">
                  {formatCurrency(order.total_amount)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </motion.div>

      {/* Action Buttons */}
      {!isTerminal && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-wrap gap-3">
          {nextStep && (
            <button
              onClick={() =>
                setConfirmModal({
                  isOpen: true,
                  action: "update_status",
                  status: nextStep.next,
                  title: nextStep.label,
                  message: `Update this order to "${nextStep.next}"?`,
                  variant: "default",
                })
              }
              className="btn-primary flex items-center gap-2"
            >
              <nextStep.icon className="w-4 h-4" /> {nextStep.label}
            </button>
          )}
          {order.status === "pending" && (
            <button
              onClick={() =>
                setConfirmModal({
                  isOpen: true,
                  action: "reject",
                  status: "cancelled",
                  title: "Reject Order",
                  message: "Are you sure you want to reject this order? This action cannot be undone.",
                  variant: "danger",
                })
              }
              className="px-6 py-3 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all flex items-center gap-2 font-semibold"
            >
              <XCircle className="w-4 h-4" /> Reject Order
            </button>
          )}
        </motion.div>
      )}

      {/* Refund */}
      {order.payment_status === "paid" && order.transaction && order.transaction.status === "success" && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="glass-card p-6 space-y-4">
          <h3 className="font-display font-bold text-lg flex items-center gap-2">
            <Undo2 className="w-5 h-5 text-orange-400" /> Refund
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Amount (GHS)</label>
              <input
                type="number"
                min="0"
                max={order.transaction.amount}
                step="0.01"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                className="input-premium"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Reason (optional)</label>
              <input
                type="text"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="e.g. Item not delivered"
                className="input-premium"
              />
            </div>
          </div>
          <button
            onClick={() => { setRefundResult(null); setRefundConfirmOpen(true); }}
            disabled={!refundAmount || parseFloat(refundAmount) <= 0}
            className="px-6 py-3 rounded-xl border border-orange-500/30 text-orange-400 hover:bg-orange-500/10 transition-all flex items-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Undo2 className="w-4 h-4" /> Refund Order
          </button>
          {refundResult && (
            <p className={`text-sm flex items-center gap-1.5 ${refundResult.type === "success" ? "text-green-400" : "text-red-400"}`}>
              {refundResult.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {refundResult.message}
            </p>
          )}
        </motion.div>
      )}

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

      {/* Refund Confirm Modal */}
      <ConfirmModal
        isOpen={refundConfirmOpen}
        onClose={() => setRefundConfirmOpen(false)}
        onConfirm={handleRefund}
        title="Refund Order"
        message={`Refund GHS ${refundAmount || "0"} to the customer${refundReason ? ` (reason: "${refundReason}")` : ""}? This calls Paystack directly and cannot be undone.`}
        confirmLabel="Refund"
        variant="danger"
        loading={refundLoading}
      />
    </div>
  );
}
