"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Receipt, ArrowDownLeft, ArrowUpRight, Loader2 } from "lucide-react";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import type { Transaction } from "@/types";

const STATUS_COLOR: Record<string, string> = {
  success: "text-green-400",
  pending: "text-yellow-400",
  failed: "text-red-400",
  reversed: "text-orange-400",
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/transactions")
      .then((res) => res.json())
      .then((res) => setTransactions(res.data || []))
      .finally(() => setLoading(false));
  }, []);

  const isCredit = (type: Transaction["type"]) => type === "refund" || type === "top_up";

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <Link href="/settings" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Settings
      </Link>

      <div>
        <h1 className="font-display font-black text-3xl mb-1">Transaction History</h1>
        <p className="text-muted-foreground text-sm">Your last 50 wallet and payment transactions</p>
      </div>

      <div className="glass-card divide-y divide-white/5 overflow-hidden">
        {loading ? (
          <div className="p-8 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center">
            <Receipt className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No transactions yet.</p>
          </div>
        ) : (
          transactions.map((txn, i) => (
            <motion.div
              key={txn.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              className="flex items-center gap-4 p-4 hover:bg-white/3 transition-colors"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isCredit(txn.type) ? "bg-green-500/10" : "bg-blue-500/10"}`}>
                {isCredit(txn.type) ? (
                  <ArrowDownLeft className="w-5 h-5 text-green-400" />
                ) : (
                  <ArrowUpRight className="w-5 h-5 text-blue-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium capitalize truncate">
                  {txn.description || txn.type.replace("_", " ")}
                </p>
                <p className="text-xs text-muted-foreground">{formatRelativeTime(txn.created_at)}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className={`text-sm font-bold ${isCredit(txn.type) ? "text-green-400" : "text-foreground"}`}>
                  {isCredit(txn.type) ? "+" : "-"}{formatCurrency(txn.amount)}
                </p>
                <span className={`text-[10px] uppercase tracking-wider ${STATUS_COLOR[txn.status] || "text-muted-foreground"}`}>
                  {txn.status}
                </span>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
