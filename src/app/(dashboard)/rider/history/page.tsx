"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { createClient } from "@/lib/supabase/client";
import { History, ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

export default function RiderHistoryPage() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [rides, setRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    supabase.from('rides')
      .select('*, passenger:profiles!rides_passenger_id_fkey(full_name)')
      .eq('rider_id', profile.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setRides(data);
        setLoading(false);
      });
  }, [profile, supabase]);

  if (loading) {
    return <div className="flex justify-center p-8"><div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <Link href="/rider" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>
      
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center">
          <History className="w-6 h-6 text-purple-400" />
        </div>
        <div>
          <h1 className="font-display font-black text-3xl">Ride History</h1>
          <p className="text-muted-foreground text-sm">All your past rides</p>
        </div>
      </div>

      <div className="glass-card p-6">
        {rides.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No rides yet.</p>
        ) : (
          <div className="space-y-3">
            {rides.map((ride) => (
              <div key={ride.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 glass border border-white/5 rounded-2xl hover:border-white/10 transition-colors gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                      ride.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                      ride.status === 'cancelled' ? 'bg-red-500/10 text-red-400' :
                      'bg-purple-500/10 text-purple-400'
                    }`}>
                      {ride.status}
                    </span>
                    <span className="text-xs text-muted-foreground">{new Date(ride.created_at).toLocaleString()}</span>
                  </div>
                  <p className="font-medium text-sm">{ride.pickup_address} → {ride.destination_address}</p>
                  <p className="text-xs text-muted-foreground mt-1">Passenger: {ride.passenger?.full_name || 'Unknown'}</p>
                </div>
                <div className="text-right flex items-center gap-4 sm:block">
                  <p className="font-bold text-foreground">{formatCurrency(ride.actual_fare || ride.estimated_fare || 0)}</p>
                  {ride.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-400 sm:ml-auto mt-1" />}
                  {ride.status === 'cancelled' && <XCircle className="w-4 h-4 text-red-400 sm:ml-auto mt-1" />}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
