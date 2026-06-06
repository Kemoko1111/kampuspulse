"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import {
  MapPin, Navigation, Clock,
  Bike, Package, Star, ArrowRight, Zap,
  Shield, Phone, History,
  FileText, Coffee,
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { CAMPUS_LOCATIONS, estimateCampusTrip } from "@/lib/campus-locations";
import { calculateFare } from "@/lib/services/fare.service";

const GoogleMap = dynamic(
  () => import("@/components/maps/GoogleMap"),
  { ssr: false, loading: () => <div className="w-full h-full bg-[#0f172a] animate-pulse flex items-center justify-center text-white/50">Loading Map...</div> }
);

const DEFAULT_FARE = { base_fare: 5, per_km_rate: 2.5, per_min_rate: 0.5 };

const rideTypes = [
  { id: "ride", icon: Bike, label: "Ride", desc: "Get a campus ride", price: "GHS 5+", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
  { id: "delivery", icon: Package, label: "Delivery", desc: "Send a package", price: "GHS 8+", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  { id: "food", icon: Coffee, label: "Food Pickup", desc: "Food from market", price: "GHS 10+", color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" },
  { id: "document", icon: FileText, label: "Documents", desc: "Urgent doc delivery", price: "GHS 6+", color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20" },
];

const savedLocations = CAMPUS_LOCATIONS.slice(0, 3).map((loc, i) => ({
  name: i === 0 ? "My Hall" : loc.name,
  address: loc.address,
  lat: loc.lat,
  lng: loc.lng,
  icon: i === 0 ? "🏠" : i === 1 ? "📚" : "🛒",
}));

const onlineRiders = [
  { name: "Kofi A.", avatar: "KA", rating: 4.9, trips: 234, vehicle: "Motorbike", eta: "2 min", location: "Near Library" },
  { name: "Yaw B.", avatar: "YB", rating: 4.8, trips: 187, vehicle: "Bicycle", eta: "5 min", location: "Near Science Block" },
  { name: "Ama K.", avatar: "AK", rating: 4.7, trips: 142, vehicle: "Motorbike", eta: "8 min", location: "Near Casely Hayford" },
];

const recentRides = [
  { from: "Atlantic Hall", to: "Main Library", time: "2h ago", fare: 8, status: "completed", rider: "Kofi A." },
  { from: "Science Market", to: "Valco Hall", time: "Yesterday", fare: 15, status: "completed", rider: "Yaw B." },
  { from: "Main Campus", to: "Abura Market", time: "2d ago", fare: 22, status: "completed", rider: "Ama K." },
];

const PAYMENT_MAP: Record<string, string> = {
  mtn: "mtn_momo",
  telecel: "telecel",
  airteltigo: "airteltigo",
};

export default function EzzyRidePage() {
  const [activeType, setActiveType] = useState("ride");
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [durationMinutes, setDurationMinutes] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("mtn");
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(false);
  const [bookedRideId, setBookedRideId] = useState<string | null>(null);
  const [matchedRiderName, setMatchedRiderName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const tripEstimate =
    pickup.trim() && destination.trim()
      ? estimateCampusTrip(pickup, destination, pickupCoords, destinationCoords, distanceKm, durationMinutes)
      : null;

  const estimatedFare = tripEstimate
    ? calculateFare(tripEstimate.km, tripEstimate.mins, DEFAULT_FARE)
    : null;

  const handlePickupSelect = useCallback((_lat: number, _lng: number, address: string) => {
    setPickup(address);
    setPickupCoords({ lat: _lat, lng: _lng });
  }, []);

  const handleDestinationSelect = useCallback((_lat: number, _lng: number, address: string) => {
    setDestination(address);
    setDestinationCoords({ lat: _lat, lng: _lng });
  }, []);

  const handleRouteCalculated = useCallback((km: number, mins: number) => {
    setDistanceKm(km);
    setDurationMinutes(mins);
  }, []);

  const applyLocation = (address: string, lat: number, lng: number, field: "pickup" | "destination") => {
    if (field === "pickup") {
      setPickup(address);
      setPickupCoords({ lat, lng });
    } else {
      setDestination(address);
      setDestinationCoords({ lat, lng });
    }
  };

  const handleBook = async () => {
    if (!pickup.trim() || !destination.trim()) {
      setError("Enter pickup and destination (map optional — use presets or type hall names)");
      return;
    }

    const trip = estimateCampusTrip(pickup, destination, pickupCoords, destinationCoords, distanceKm, durationMinutes);

    setBooking(true);
    setError(null);

    try {
      const res = await apiFetch("/api/rides", {
        method: "POST",
        body: JSON.stringify({
          pickupAddress: pickup,
          pickupLat: trip.pickupResolved.lat,
          pickupLng: trip.pickupResolved.lng,
          destinationAddress: destination,
          destinationLat: trip.destResolved.lat,
          destinationLng: trip.destResolved.lng,
          distanceKm: trip.km,
          durationMinutes: trip.mins,
          paymentMethod: PAYMENT_MAP[paymentMethod] || "mtn_momo",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to book ride");
      }

      const { data } = await res.json();
      setBookedRideId(data.ride.id);
      setMatchedRiderName(data.matchedRider?.profile?.full_name || null);
      setBooked(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to book ride");
    } finally {
      setBooking(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h1 className="font-display font-black text-3xl md:text-4xl">
              <span className="text-purple-400">EZZYRIDE</span>
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">Campus Delivery & Ride Service</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 glass border border-green-500/20 rounded-full px-3 py-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-medium text-green-400">120 Riders Online</span>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* ── LEFT: Booking Panel ── */}
          <div className="lg:col-span-3 space-y-5">

            {/* Service type */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <h2 className="font-display font-bold text-base mb-3">What do you need?</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {rideTypes.map(({ id, icon: Icon, label, desc, price, color, bg, border }) => (
                  <button key={id} id={`ride-type-${id}`} onClick={() => setActiveType(id)}
                    className={`p-3 rounded-2xl border text-left transition-all ${activeType === id ? `${bg} ${border}` : "glass border-white/10 hover:border-white/20"}`}>
                    <Icon className={`w-5 h-5 ${color} mb-2`} />
                    <div className="font-semibold text-xs text-foreground">{label}</div>
                    <div className="text-[10px] text-muted-foreground">{desc}</div>
                    <div className={`text-xs font-bold ${color} mt-1`}>{price}</div>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Map */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div className="relative rounded-2xl overflow-hidden h-64 glass border border-white/10">
                <GoogleMap
                  height="256px"
                  pickup={pickupCoords ? { ...pickupCoords, address: pickup } : undefined}
                  destination={destinationCoords ? { ...destinationCoords, address: destination } : undefined}
                  onPickupSelect={handlePickupSelect}
                  onDestinationSelect={handleDestinationSelect}
                  onRouteCalculated={handleRouteCalculated}
                />
              </div>
            </motion.div>

            {/* Location inputs */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-5 space-y-3">
              <h2 className="font-display font-bold text-base">Set Your Route</h2>

              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
              )}

              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-green-400 z-10" />
                <input id="pickup-input" type="text" value={pickup} onChange={e => setPickup(e.target.value)}
                  placeholder="Pickup location (e.g. Atlantic Hall)" className="input-premium pl-10" />
              </div>
              {/* Route line */}
              <div className="flex items-center gap-3 px-4">
                <div className="w-px h-8 bg-white/20 ml-0.5" />
                <span className="text-xs text-muted-foreground">Route</span>
              </div>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-red-400" />
                <input id="destination-input" type="text" value={destination} onChange={e => setDestination(e.target.value)}
                  placeholder="Destination (e.g. Library, Abura Market)" className="input-premium pl-10" />
              </div>

              {/* Saved locations */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {savedLocations.map(({ name, address, lat, lng, icon }) => (
                  <button key={name} type="button" onClick={() => applyLocation(address, lat, lng, "pickup")}
                    className="flex-none flex items-center gap-2 glass border border-white/10 rounded-xl px-3 py-2 text-xs hover:border-white/20 transition-all">
                    <span>{icon}</span> {name}
                  </button>
                ))}
              </div>

              {/* Fare estimate */}
              {estimatedFare != null && (
                <div className="glass border border-purple-500/20 bg-purple-500/5 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Estimated Fare</span>
                    <span className="font-display font-black text-xl text-purple-400">GHS {estimatedFare.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {tripEstimate && (
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> ~{tripEstimate.mins} mins</span>
                    )}
                    {tripEstimate && (
                      <span className="flex items-center gap-1"><Navigation className="w-3 h-3" /> ~{tripEstimate.km.toFixed(1)} km</span>
                    )}
                  </div>
                </div>
              )}

              {/* Payment method */}
              <div>
                <label className="text-sm font-medium block mb-2">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "mtn", label: "MTN MoMo", emoji: "📱" },
                    { id: "telecel", label: "Telecel", emoji: "💳" },
                    { id: "airteltigo", label: "AirtelTigo", emoji: "💰" },
                  ].map(({ id, label, emoji }) => (
                    <button key={id} type="button" onClick={() => setPaymentMethod(id)}
                      className={`glass border rounded-xl p-2.5 text-center text-xs font-medium transition-all hover:bg-purple-500/5
                        ${paymentMethod === id ? "border-purple-500/40 bg-purple-500/5" : "border-white/10 hover:border-purple-500/40"}`}>
                      <div className="text-lg mb-0.5">{emoji}</div>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Book button */}
              {booked ? (
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
                  <div className="text-2xl mb-1">🎉</div>
                  <p className="font-bold text-green-400 text-sm">
                    {matchedRiderName ? `Rider Found! ${matchedRiderName} is on the way` : "Ride booked! Finding rider..."}
                  </p>
                  {estimatedFare != null && durationMinutes != null && (
                    <p className="text-xs text-muted-foreground mt-1">ETA: ~{durationMinutes} minutes · GHS {estimatedFare.toFixed(2)}</p>
                  )}
                  {bookedRideId && (
                    <Link href={`/ezzyride/track/${bookedRideId}`} className="inline-flex items-center gap-1.5 text-xs text-purple-400 mt-2 font-medium">
                      Track Live <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              ) : (
                <button id="book-ride-btn" onClick={handleBook}
                  disabled={booking || !pickupCoords || !destinationCoords || !distanceKm}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white font-semibold py-3.5 rounded-xl hover:shadow-glow transition-all disabled:opacity-50">
                  {booking ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Finding Rider...</>
                  ) : (
                    <><Zap className="w-4 h-4" /> Book {rideTypes.find(r => r.id === activeType)?.label} Now</>
                  )}
                </button>
              )}
            </motion.div>
          </div>

          {/* ── RIGHT: Riders & History ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Online Riders */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-bold text-base">Nearby Riders</h3>
                <span className="text-xs text-green-400 font-medium">● 120 online</span>
              </div>
              <div className="space-y-3">
                {onlineRiders.map(({ name, avatar, rating, trips, vehicle, eta, location }) => (
                  <div key={name} className="flex items-center gap-3 p-3 glass border border-white/10 rounded-xl hover:border-purple-500/20 transition-all">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-purple-400 flex items-center justify-center text-white text-xs font-bold">{avatar}</div>
                      <div className="absolute -bottom-0.5 -right-0.5 status-dot-online border border-background" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm flex items-center gap-1.5">
                        {name}
                        <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full px-1.5 py-0.5">{vehicle}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        {rating} · {trips} trips · {location}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-purple-400 font-bold text-sm">{eta}</div>
                      <div className="text-[10px] text-muted-foreground">away</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Safety features */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="glass-card p-5">
              <h3 className="font-display font-bold text-base mb-3">Safety Features</h3>
              <div className="space-y-2">
                {[
                  { icon: Shield, label: "Verified Riders", desc: "All riders ID-verified by admin" },
                  { icon: Phone, label: "Emergency Contact", desc: "One-tap SOS during ride" },
                  { icon: Navigation, label: "Live Tracking", desc: "Share trip with friends" },
                ].map(({ icon: Icon, label, desc }) => (
                  <div key={label} className="flex items-center gap-3 p-2.5">
                    <div className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-green-400" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">{label}</div>
                      <div className="text-xs text-muted-foreground">{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Recent rides */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display font-bold text-base">Recent Rides</h3>
                <button className="text-xs text-purple-400 flex items-center gap-1">
                  <History className="w-3.5 h-3.5" /> History
                </button>
              </div>
              <div className="space-y-2">
                {recentRides.map(({ from, to, time, fare, rider }, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 glass border border-white/10 rounded-xl">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                      <Bike className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-foreground truncate">{from} → {to}</div>
                      <div className="text-[10px] text-muted-foreground">{rider} · {time}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-foreground">GHS {fare}</div>
                      <div className="text-[10px] text-green-400">✓ Done</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
