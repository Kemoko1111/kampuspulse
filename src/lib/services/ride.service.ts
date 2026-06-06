import type { TypedSupabaseClient } from "@/lib/supabase/types";
import type { Ride } from "@/types";
import { AppError } from "@/lib/errors/app-error";
import { RideRepository } from "@/lib/repositories/ride.repository";
import { NotificationRepository } from "@/lib/repositories/notification.repository";
import { calculateFare, findNearestRider, type FareSettings } from "@/lib/services/fare.service";
import { PaymentService } from "@/lib/services/payment.service";

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

    const matchedRider = await this.matchRider((ride as { id: string }).id, params.pickupLat, params.pickupLng);
    return { ride, matchedRider };
  }

  async matchRider(rideId: string, pickupLat: number, pickupLng: number) {
    const { data: riders, error } = await this.rideRepo.findAvailableRiders(pickupLat, pickupLng);
    if (error) throw error;

    type RiderWithLocation = { current_lat: number | null; current_lng: number | null; user_id: string };
    const nearest = findNearestRider((riders || []) as RiderWithLocation[], pickupLat, pickupLng);
    if (!nearest) return null;

    const { data: ride, error: updateError } = await this.rideRepo.update(rideId, {
      rider_id: nearest.user_id,
      status: "accepted",
    });

    if (updateError) throw updateError;

    await this.notifRepo.create({
      user_id: nearest.user_id,
      type: "ride_accepted",
      title: "New Ride Request",
      body: "You have a new ride request nearby.",
      data: { ride_id: rideId },
    });

    return nearest;
  }

  async updateRideStatus(rideId: string, profileId: string, status: string, riderId?: string) {
    const { data: rawRide, error } = await this.rideRepo.findById(rideId);
    const ride = rawRide as Ride | null;
    if (error || !ride) throw new AppError("Ride not found", 404);

    const isPassenger = ride.passenger_id === profileId;
    const isRider = ride.rider_id === profileId;
    if (!isPassenger && !isRider) throw new AppError("Forbidden", 403);

    const updates: Record<string, unknown> = { status };
    if (riderId) updates.rider_id = riderId;
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
