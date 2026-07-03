"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { createClient } from "@/lib/supabase/client";
import { DollarSign, TrendingUp, Calendar, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import type { Ride } from "@/types";

export default function EarningsPage() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [earnings, setEarnings] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    supabase.from('rides')
      .select('*')
      .eq('rider_id', profile.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setEarnings(data);
        setLoading(false);
      });
  }, [profile, supabase]);

  const totalEarnings = earnings.reduce((sum, r) => sum + (r.actual_fare || 0), 0);
  const todayEarnings = earnings
    .filter(r => new Date(r.created_at).toDateString() === new Date().toDateString())
    .reduce((sum, r) => sum + (r.actual_fare || 0), 0);

  if (loading) {
    return <div className="flex justify-center p-8"><div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <Link href="/rider" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>
      
      <div className="flex items-center justify-between">
        <h1 className="font-display font-black text-3xl">My Earnings</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-6 bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-muted-foreground font-medium">Total Earnings</p>
          </div>
          <p className="text-4xl font-display font-black text-green-400">{formatCurrency(totalEarnings)}</p>
        </div>

        <div className="glass-card p-6 bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-400" />
            </div>
            <p className="text-muted-foreground font-medium">Today's Earnings</p>
          </div>
          <p className="text-4xl font-display font-black text-purple-400">{formatCurrency(todayEarnings)}</p>
        </div>

        <div className="glass-card p-6 bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-muted-foreground font-medium">Total Trips</p>
          </div>
          <p className="text-4xl font-display font-black text-blue-400">{earnings.length}</p>
        </div>
      </div>

      <div className="glass-card p-6">
        <h2 className="font-display font-bold text-xl mb-4">Earnings History</h2>
        {earnings.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No completed rides yet.</p>
        ) : (
          <div className="space-y-3">
            {earnings.map((ride) => (
              <div key={ride.id} className="flex items-center justify-between p-4 glass border border-white/5 rounded-2xl hover:border-white/10 transition-colors">
                <div>
                  <p className="font-medium text-sm">{ride.pickup_address} → {ride.destination_address}</p>
                  <p className="text-xs text-muted-foreground mt-1">{new Date(ride.created_at).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-400">{formatCurrency(ride.actual_fare || 0)}</p>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Completed</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
