"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import {
  ArrowLeft, Phone, MessageSquare, MapPin,
  Star, Shield, CheckCircle,
  Clock, Bike,
} from "lucide-react";
import { Sidebar, MobileNav, TopBar } from "@/components/layout/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Ride, Profile } from "@/types";

const GoogleMap = dynamic(
  () => import("@/components/maps/GoogleMap"),
  { ssr: false, loading: () => <div className="w-full h-full bg-[#0f172a] animate-pulse flex items-center justify-center text-white/50">Loading Map...</div> }
);

type RideWithRelations = Ride & {
  passenger?: Profile;
  rider?: Profile;
};

const STATUS_STEPS = [
  { key: "searching", label: "Order Confirmed" },
  { key: "accepted", label: "Rider Assigned" },
  { key: "en_route", label: "Rider En Route" },
  { key: "arrived", label: "Rider Arrived" },
  { key: "in_progress", label: "On the Way" },
  { key: "completed", label: "Delivered" },
];

function getInitials(name?: string | null) {
  if (!name) return "?";
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

function statusIndex(status: string) {
  const idx = STATUS_STEPS.findIndex(s => s.key === status);
  return idx >= 0 ? idx : 0;
}

export default function TrackPage() {
  const { id } = useParams<{ id: string }>();
  const [ride, setRide] = useState<RideWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchRide = useCallback(async () => {
    if (!id) return;
    const res = await fetch(`/api/rides/${id}`);
    if (res.ok) {
      const { data } = await res.json();
      setRide(data);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchRide();
  }, [fetchRide]);

  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`ride:${id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "rides",
          filter: `id=eq.${id}`,
        },
        (payload) => {
          setRide(prev => prev ? { ...prev, ...(payload.new as RideWithRelations) } : prev);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id, supabase]);

  const currentStep = ride ? statusIndex(ride.status) : 0;
  const trackingSteps = useMemo(() => {
    return STATUS_STEPS.map((step, i) => ({
      id: i + 1,
      label: step.label,
      done: i <= currentStep && ride?.status !== "cancelled",
      time: i === currentStep ? "Now" : i < currentStep ? "Done" : "Pending",
    }));
  }, [currentStep, ride?.status]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Ride not found</p>
          <Link href="/ezzyride" className="text-purple-400 text-sm">Back to EzzyRide</Link>
        </div>
      </div>
    );
  }

  const rider = ride.rider;
  const eta = ride.duration_minutes ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <TopBar title="Live Tracking" />
      <main className="lg:pl-64 pb-20 lg:pb-0 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <Link href="/ezzyride" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to EzzyRide
          </Link>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* ── LEFT: Map + ETA ── */}
            <div className="space-y-4">
              {/* ETA Banner */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="glass-card p-5 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-blue-600/10" />
                <div className="relative flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Estimated Arrival</p>
                    <div className="font-display font-black text-5xl text-purple-400">
                      {eta}<span className="text-2xl text-muted-foreground"> min</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 capitalize">
                      Status: {ride.status.replace("_", " ")} {rider ? "🏍️" : "..."}
                    </p>
                  </div>
                  <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                    <Bike className="w-8 h-8 text-purple-400 animate-bounce" />
                  </div>
                </div>
              </motion.div>

              {/* Live Map */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <div className="relative rounded-2xl overflow-hidden h-64 glass border border-white/10">
                  <GoogleMap
                    height="256px"
                    interactive={false}
                    pickup={ride.pickup_lat && ride.pickup_lng ? { lat: ride.pickup_lat, lng: ride.pickup_lng, address: ride.pickup_address } : undefined}
                    destination={ride.destination_lat && ride.destination_lng ? { lat: ride.destination_lat, lng: ride.destination_lng, address: ride.destination_address } : undefined}
                  />
                  <div className="absolute top-3 left-3 glass border border-green-500/20 rounded-xl px-3 py-1.5 text-xs font-medium text-green-400 pointer-events-none">
                    ● Live
                  </div>
                </div>
              </motion.div>

              {/* Delivery addresses */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center gap-1 pt-1 flex-shrink-0">
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                    <div className="w-px h-8 bg-white/20" />
                    <MapPin className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="space-y-3 flex-1">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Pickup</p>
                      <p className="text-sm font-medium">{ride.pickup_address}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Delivery</p>
                      <p className="text-sm font-medium">{ride.destination_address}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* ── RIGHT: Rider + Tracking ── */}
            <div className="space-y-4">
              {/* Rider card */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5">
                <h2 className="font-display font-bold text-base mb-4">Your Rider</h2>
                {rider ? (
                  <>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="relative">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-400 flex items-center justify-center text-white font-black text-xl">
                          {getInitials(rider.full_name)}
                        </div>
                        <div className="absolute -bottom-1 -right-1 status-dot-online border-2 border-background" />
                      </div>
                      <div className="flex-1">
                        <div className="font-display font-bold text-lg">{rider.full_name}</div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                          {rider.rating ?? 0}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {rider.phone && (
                        <a href={`tel:${rider.phone}`}
                          className="flex items-center justify-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl py-2.5 text-sm font-medium hover:bg-green-500/20 transition-all">
                          <Phone className="w-4 h-4" /> Call Rider
                        </a>
                      )}
                      <Link href="/messages"
                        className="flex items-center justify-center gap-2 glass border border-white/10 rounded-xl py-2.5 text-sm font-medium hover:bg-white/10 transition-all">
                        <MessageSquare className="w-4 h-4" /> Message
                      </Link>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">Searching for a rider...</p>
                )}
              </motion.div>

              {/* Tracking timeline */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="glass-card p-5">
                <h2 className="font-display font-bold text-base mb-4">Order Status</h2>
                <div className="space-y-0">
                  {trackingSteps.map((step, i) => (
                    <div key={step.id} className="flex items-start gap-3">
                      {/* Timeline dot */}
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all
                          ${step.done
                            ? "bg-green-500 border-green-500 text-white"
                            : i === trackingSteps.findIndex(s => !s.done)
                              ? "border-purple-500 bg-purple-500/10 text-purple-400 animate-pulse"
                              : "border-white/20 text-muted-foreground"}`}>
                          {step.done ? <CheckCircle className="w-4 h-4" /> :
                            i === trackingSteps.findIndex(s => !s.done) ?
                              <Clock className="w-4 h-4" /> :
                              <div className="w-2 h-2 rounded-full bg-current" />}
                        </div>
                        {i < trackingSteps.length - 1 && (
                          <div className={`w-0.5 h-8 transition-all ${step.done ? "bg-green-500" : "bg-white/10"}`} />
                        )}
                      </div>
                      {/* Info */}
                      <div className="pb-4 flex-1 min-w-0">
                        <div className={`font-medium text-sm ${step.done ? "text-foreground" : "text-muted-foreground"}`}>
                          {step.label}
                        </div>
                        <div className="text-xs text-muted-foreground">{step.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Fare */}
              {ride.estimated_fare != null && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.18 }}
                  className="glass-card p-4 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Estimated Fare</span>
                  <span className="font-display font-black text-xl text-purple-400">GHS {ride.estimated_fare.toFixed(2)}</span>
                </motion.div>
              )}

              {/* Safety */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                className="glass border border-green-500/10 rounded-2xl p-4 flex items-center gap-3">
                <Shield className="w-5 h-5 text-green-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Rider is verified by CampusPulse</p>
                  <p className="text-xs text-muted-foreground">All riders pass ID & background verification</p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
