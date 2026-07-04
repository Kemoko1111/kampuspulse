import type { TypedSupabaseClient } from "@/lib/supabase/types";
import type { Ride } from "@/types";
import { AppError } from "@/lib/errors/app-error";
import { RideRepository } from "@/lib/repositories/ride.repository";
import { NotificationRepository } from "@/lib/repositories/notification.repository";
import { calculateFare, type FareSettings } from "@/lib/services/fare.service";
import { PaymentService } from "@/lib/services/payment.service";

// Rider-driven steps (only the assigned rider taps through these, matching
// the actual UI flow in rider/page.tsx's handleArrived); "cancelled" is the
// one transition either side can make, at any point before completion.
const RIDER_ONLY_TRANSITIONS: Record<string, string[]> = {
  accepted: ["en_route"],
  en_route: ["arrived"],
  arrived: ["in_progress"],
  in_progress: ["completed"],
};
const CANCELLABLE_FROM = ["searching", "accepted", "en_route", "arrived", "in_progress"];

export class RideService {
  private rideRepo: RideRepository;
  private notifRepo: NotificationRepository;
  private paymentService: PaymentService;

  constructor(private supabase: TypedSupabaseClient) {
    this.rideRepo = new RideRepository(supabase);
    this.notifRepo = new NotificationRepository(supabase);
    this.paymentService = new PaymentService(supabase);
  }

  async getFareSettings(): Promise<FareSettings> {
    const { data } = await this.supabase
      .from("platform_settings")
      .select("value")
      .eq("key", "ride_fare")
      .single();

    const settings = data as { value: FareSettings } | null;
    return settings?.value || { base_fare: 5, per_km_rate: 2.5, per_min_rate: 0.5 };
  }

  async createRide(profileId: string, params: {
    pickupAddress: string;
    pickupLat: number;
    pickupLng: number;
    destinationAddress: string;
    destinationLat: number;
    destinationLng: number;
    distanceKm: number;
    durationMinutes: number;
    paymentMethod?: string;
    notes?: string;
  }) {
    const settings = await this.getFareSettings();
    const estimatedFare = calculateFare(params.distanceKm, params.durationMinutes, settings);

    const { data: ride, error } = await this.rideRepo.create({
      passenger_id: profileId,
      pickup_address: params.pickupAddress,
      pickup_lat: params.pickupLat,
      pickup_lng: params.pickupLng,
      destination_address: params.destinationAddress,
      destination_lat: params.destinationLat,
      destination_lng: params.destinationLng,
      distance_km: params.distanceKm,
      duration_minutes: params.durationMinutes,
      estimated_fare: estimatedFare,
      payment_method: params.paymentMethod || "mtn_momo",
      notes: params.notes,
      status: "searching",
    });

    if (error) throw error;

    // Broadcast model: the ride stays 'searching' with no rider_id. Every
    // online rider sees it (RLS: rides_select_searching_for_riders) and can
    // claim it first-come. We just ping available riders so they look.
    await this.notifyAvailableRiders((ride as { id: string }).id);
    return { ride, matchedRider: null };
  }

  private async notifyAvailableRiders(rideId: string) {
    const { data: riders } = await this.rideRepo.findAvailableRiders();
    const list = (riders || []) as { user_id: string }[];
    await Promise.all(
      list.map((r) =>
        this.notifRepo.create({
          user_id: r.user_id,
          type: "ride_request",
          title: "New Ride Request",
          body: "A new ride request is available. Open the driver app to accept.",
          data: { ride_id: rideId },
        })
      )
    );
  }

  // Atomic first-come claim: only succeeds if the ride is still unassigned and
  // searching, so two riders tapping Accept at once can't both get it. Runs on
  // the service-role client passed in by the route (RLS would otherwise block a
  // rider from updating a ride that isn't yet theirs).
  async claimRide(adminClient: TypedSupabaseClient, rideId: string, riderProfileId: string) {
    const { data, error } = await adminClient
      .from("rides")
      .update({ rider_id: riderProfileId, status: "en_route" } as never)
      .eq("id", rideId)
      .eq("status", "searching")
      .is("rider_id", null)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new AppError("This ride was already taken by another rider", 409, "ALREADY_CLAIMED");

    const ride = data as Ride;
    if (ride.passenger_id) {
      await this.notifRepo.create({
        user_id: ride.passenger_id,
        type: "ride_update",
        title: "Rider on the way!",
        body: "A rider accepted your request and is heading to your pickup.",
        data: { ride_id: rideId, status: "en_route" },
      });
    }
    return ride;
  }

  async updateRideStatus(rideId: string, profileId: string, status: string) {
    const { data: rawRide, error } = await this.rideRepo.findById(rideId);
    const ride = rawRide as Ride | null;
    if (error || !ride) throw new AppError("Ride not found", 404);

    const isPassenger = ride.passenger_id === profileId;
    const isRider = ride.rider_id === profileId;
    if (!isPassenger && !isRider) throw new AppError("Forbidden", 403);

    if (status === "cancelled") {
      if (!CANCELLABLE_FROM.includes(ride.status)) {
        throw new AppError(`Cannot cancel a ride that is already ${ride.status}`, 400);
      }
    } else {
      // Every other transition is rider-driven and must follow the sequence
      // — a passenger has no legitimate transition besides "cancelled", and
      // there's no client-settable rider_id here (that's only ever assigned
      // internally by matchRider()) so a ride can't be hijacked onto a
      // different rider's account through this endpoint.
      if (!isRider) throw new AppError("Forbidden", 403);
      const allowedNext = RIDER_ONLY_TRANSITIONS[ride.status] || [];
      if (!allowedNext.includes(status)) {
        throw new AppError(`Cannot move a ride from ${ride.status} to ${status}`, 400);
      }
    }

    const updates: Record<string, unknown> = { status };
    if (status === "completed") updates.actual_fare = ride.estimated_fare;

    const { data, error: updateError } = await this.rideRepo.update(rideId, updates);
    if (updateError) throw updateError;

    const notifyId = isPassenger ? ride.rider_id : ride.passenger_id;
    if (notifyId) {
      await this.notifRepo.create({
        user_id: notifyId,
        type: "ride_update",
        title: "Ride Update",
        body: `Your ride status is now: ${status.replace("_", " ")}`,
        data: { ride_id: rideId, status },
      });
    }

    return data;
  }

  async initiateRidePayment(rideId: string, profileId: string, email: string) {
    const { data: rawRide, error } = await this.rideRepo.findById(rideId);
    const ride = rawRide as Ride | null;
    if (error || !ride) throw new AppError("Ride not found", 404);
    if (ride.passenger_id !== profileId) throw new AppError("Forbidden", 403);

    const payment = await this.paymentService.initializePayment({
      amount: ride.estimated_fare || 0,
      email,
      profileId,
      rideId,
    });

    await this.rideRepo.update(rideId, { payment_reference: payment.reference });
    return payment;
  }
}
