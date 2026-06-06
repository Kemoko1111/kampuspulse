"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import {
  Bike, Navigation, Clock,
  Power,
  X, Phone, MessageSquare,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { apiFetch } from "@/lib/api-client";
import { createClient } from "@/lib/supabase/client";
import type { Ride } from "@/types";

const GoogleMap = dynamic(
  () => import("@/components/maps/GoogleMap"),
  { ssr: false, loading: () => <div className="w-full h-full bg-[#0f172a] animate-pulse flex items-center justify-center text-white/50">Loading Map Engine...</div> }
);

const UCC_CENTER: [number, number] = [5.1053, -1.2825];

export default function RiderDashboard() {
  const { profile } = useAuth();
  const [isOnline, setIsOnline] = useState(false);
  const [riderLocation, setRiderLocation] = useState<[number, number]>(UCC_CENTER);
  const [incomingRide, setIncomingRide] = useState<Ride | null>(null);
  const [activeRide, setActiveRide] = useState<Ride | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const locationWatchRef = useRef<number | null>(null);
  const supabase = createClient();

  const updateLocation = useCallback(async (lat: number, lng: number) => {
    setRiderLocation([lat, lng]);
    await apiFetch("/api/rider/location", {
      method: "PATCH",
      body: JSON.stringify({ lat, lng }),
    });
  }, []);

  const setAvailability = useCallback(async (available: boolean) => {
    const res = await apiFetch("/api/rider/availability", {
      method: "PATCH",
      body: JSON.stringify({ isAvailable: available }),
    });
    if (res.ok) setIsOnline(available);
  }, []);

  useEffect(() => {
    setAvailability(true);

    if ("geolocation" in navigator) {
      locationWatchRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          updateLocation(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          updateLocation(UCC_CENTER[0], UCC_CENTER[1]);
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
      );
    }

    return () => {
      setAvailability(false);
      if (locationWatchRef.current != null) {
        navigator.geolocation.clearWatch(locationWatchRef.current);
      }
    };
  }, [setAvailability, updateLocation]);

  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel(`rider-rides:${profile.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "rides",
          filter: `rider_id=eq.${profile.id}`,
        },
        (payload) => {
          const ride = payload.new as Ride;
          if (ride.status === "accepted" || ride.status === "searching") {
            setIncomingRide(ride);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "rides",
          filter: `rider_id=eq.${profile.id}`,
        },
        (payload) => {
          const ride = payload.new as Ride;
          if (ride.status === "accepted" && !activeRide) {
            setIncomingRide(ride);
          } else if (["en_route", "arrived", "in_progress"].includes(ride.status)) {
            setActiveRide(ride);
            setIncomingRide(null);
          } else if (ride.status === "completed" || ride.status === "cancelled") {
            setActiveRide(null);
            setIncomingRide(null);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile?.id, supabase]);

  const handleAccept = async () => {
    if (!incomingRide) return;
    setActionLoading(true);
    try {
      const res = await apiFetch(`/api/rides/${incomingRide.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "en_route" }),
      });
      if (res.ok) {
        const { data } = await res.json();
        setActiveRide(data);
        setIncomingRide(null);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!incomingRide) return;
    setActionLoading(true);
    try {
      await apiFetch(`/api/rides/${incomingRide.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "cancelled" }),
      });
      setIncomingRide(null);
    } finally {
      setActionLoading(false);
    }
  };

  const handleArrived = async () => {
    if (!activeRide) return;
    setActionLoading(true);
    try {
      const nextStatus = activeRide.status === "en_route" ? "arrived"
        : activeRide.status === "arrived" ? "in_progress"
        : "completed";

      const res = await apiFetch(`/api/rides/${activeRide.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        const { data } = await res.json();
        if (nextStatus === "completed") {
          setActiveRide(null);
        } else {
          setActiveRide(data);
        }
      }
    } finally {
      setActionLoading(false);
    }
  };

  const pickupCoords: [number, number] | null = (incomingRide || activeRide)?.pickup_lat && (incomingRide || activeRide)?.pickup_lng
    ? [(incomingRide || activeRide)!.pickup_lat!, (incomingRide || activeRide)!.pickup_lng!]
    : null;

  const dropoffCoords: [number, number] | null = (incomingRide || activeRide)?.destination_lat && (incomingRide || activeRide)?.destination_lng
    ? [(incomingRide || activeRide)!.destination_lat!, (incomingRide || activeRide)!.destination_lng!]
    : null;

  return (
    <div className="p-4 lg:p-8 flex flex-col h-[calc(100vh-60px)] lg:h-[calc(100vh-0px)]">

      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Driver App</h1>
          <p className="text-sm text-muted-foreground">
            {isOnline ? "Online — listening for requests" : "Going offline..."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAvailability(!isOnline)}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-medium transition-all
              ${isOnline ? "bg-green-500/10 border border-green-500/20 text-green-400" : "glass border border-white/10 text-muted-foreground"}`}
          >
            <Power className="w-4 h-4" />
            {isOnline ? "Online" : "Offline"}
          </button>
          <div className="glass-card px-4 py-2 rounded-2xl flex flex-col items-end">
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Today&apos;s Earnings</span>
            <span className="font-bold text-green-400">GHS 0.00</span>
          </div>
        </div>
      </div>

      <main className="flex-1 relative w-full rounded-3xl overflow-hidden glass border border-white/5 shadow-2xl">

        {/* The Advanced Map */}
        <div className="absolute inset-0 z-0">
          <GoogleMap
            height="100%"
            interactive={false}
            riderLocation={{ lat: riderLocation[0], lng: riderLocation[1] }}
            pickup={pickupCoords ? { lat: pickupCoords[0], lng: pickupCoords[1] } : undefined}
            destination={dropoffCoords ? { lat: dropoffCoords[0], lng: dropoffCoords[1] } : undefined}
          />
        </div>

        {/* Bottom Sheet UI (Bolt-style) */}
        <div className="absolute bottom-4 left-4 right-4 z-20 pointer-events-none flex flex-col justify-end">
          <AnimatePresence>
            {/* Searching Radar State */}
            {!incomingRide && !activeRide && (
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="glass-card p-4 mx-auto w-full max-w-md pointer-events-auto shadow-[0_-10px_40px_rgba(0,0,0,0.3)]"
              >
                <div className="flex items-center justify-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-blue-500 animate-ping" />
                  <span className="font-medium text-blue-400">
                    {isOnline ? "Finding requests..." : "Go online to receive rides"}
                  </span>
                </div>
              </motion.div>
            )}

            {/* Incoming Request Bottom Sheet */}
            {incomingRide && !activeRide && (
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="glass-card w-full max-w-md mx-auto pointer-events-auto border-t-4 border-t-blue-500 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
              >
                <div className="absolute inset-0 bg-blue-500/5 animate-pulse pointer-events-none" />

                <div className="p-5 relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-wider mb-2 border border-blue-500/20">
                        <Bike className="w-3 h-3" />
                        Ride Request
                      </span>
                      <h3 className="font-black text-3xl tracking-tight">
                        GHS {(incomingRide.estimated_fare ?? 0).toFixed(2)}
                      </h3>
                    </div>
                    <div className="text-right">
                      {incomingRide.duration_minutes != null && (
                        <div className="text-sm font-bold text-foreground flex items-center gap-1.5 justify-end">
                          <Clock className="w-4 h-4 text-blue-400" />
                          {incomingRide.duration_minutes} min
                        </div>
                      )}
                      {incomingRide.distance_km != null && (
                        <div className="text-xs text-muted-foreground mt-1 font-medium">{incomingRide.distance_km.toFixed(1)} km</div>
                      )}
                    </div>
                  </div>

                  <div className="bg-black/20 rounded-2xl p-4 mb-5 border border-white/5 relative">
                    <div className="absolute left-[27px] top-8 bottom-8 w-0.5 bg-white/10" />

                    <div className="relative z-10 flex gap-4 items-center mb-4">
                      <div className="w-4 h-4 rounded-full bg-orange-500 ring-4 ring-orange-500/20 flex-shrink-0" />
                      <div>
                        <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Pickup</div>
                        <div className="font-semibold text-sm">{incomingRide.pickup_address}</div>
                      </div>
                    </div>
                    <div className="relative z-10 flex gap-4 items-center">
                      <div className="w-4 h-4 rounded-none bg-green-500 ring-4 ring-green-500/20 flex-shrink-0" />
                      <div>
                        <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Drop-off</div>
                        <div className="font-semibold text-sm">{incomingRide.destination_address}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleDecline}
                      disabled={actionLoading}
                      className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 text-white flex items-center justify-center hover:bg-white/10 transition-colors disabled:opacity-50"
                    >
                      <X className="w-6 h-6" />
                    </button>
                    <button
                      onClick={handleAccept}
                      disabled={actionLoading}
                      className="flex-1 h-14 rounded-2xl bg-blue-600 text-white font-bold text-lg hover:bg-blue-500 transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] active:scale-[0.98] disabled:opacity-50"
                    >
                      {actionLoading ? "..." : "Accept"}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Active Order Navigation State */}
            {activeRide && (
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                className="glass-card w-full max-w-md mx-auto pointer-events-auto border-t-4 border-t-green-500 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]"
              >
                <div className="p-4 border-b border-white/5 flex items-center justify-between bg-green-500/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                      <Navigation className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold capitalize">{activeRide.status.replace("_", " ")}</div>
                      <div className="text-xs text-muted-foreground">{activeRide.pickup_address}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    {activeRide.duration_minutes != null && (
                      <>
                        <div className="font-bold text-xl">{activeRide.duration_minutes} min</div>
                        <div className="text-xs text-muted-foreground">ETA</div>
                      </>
                    )}
                  </div>
                </div>

                <div className="p-4 flex gap-3">
                  <button className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center gap-2 font-medium hover:bg-white/10">
                    <Phone className="w-4 h-4" /> Call
                  </button>
                  <button className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center gap-2 font-medium hover:bg-white/10">
                    <MessageSquare className="w-4 h-4" /> Chat
                  </button>
                  <button
                    onClick={handleArrived}
                    disabled={actionLoading}
                    className="flex-[2] py-3 rounded-xl bg-green-600 text-white font-bold hover:bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)] disabled:opacity-50"
                  >
                    {actionLoading ? "..." :
                      activeRide.status === "en_route" ? "Arrived at Pickup" :
                      activeRide.status === "arrived" ? "Start Trip" :
                      activeRide.status === "in_progress" ? "Complete" : "Update"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
