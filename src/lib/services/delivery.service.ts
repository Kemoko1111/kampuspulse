import type { TypedSupabaseClient } from "@/lib/supabase/types";
import { AppError } from "@/lib/errors/app-error";
import { RideRepository } from "@/lib/repositories/ride.repository";
import { NotificationRepository } from "@/lib/repositories/notification.repository";
import { calculateFare, findNearestRider, type FareSettings } from "@/lib/services/fare.service";

const DEFAULT_DELIVERY_FARE: FareSettings = { base_fare: 8, per_km_rate: 3, per_min_rate: 0.75 };

// Delivery lifecycle, mirroring the ride state machine but with a
// package-appropriate middle: the rider heads to pickup (en_route), collects
// the item (picked_up), then drops it off (delivered). "cancelled" is the one
// transition either party can make before delivery.
const RIDER_ONLY_TRANSITIONS: Record<string, string[]> = {
  accepted: ["en_route"],
  en_route: ["picked_up"],
  picked_up: ["delivered"],
};
const CANCELLABLE_FROM = ["searching", "accepted", "en_route", "picked_up"];

interface DeliveryRow {
  id: string;
  sender_id: string;
  rider_id: string | null;
  status: string;
  estimated_fee: number | null;
  pickup_lat: number | null;
  pickup_lng: number | null;
}

export class DeliveryService {
  private rideRepo: RideRepository;
  private notifRepo: NotificationRepository;

  constructor(private supabase: TypedSupabaseClient) {
    this.rideRepo = new RideRepository(supabase);
    this.notifRepo = new NotificationRepository(supabase);
  }

  private async getFareSettings(): Promise<FareSettings> {
    const { data } = await this.supabase
      .from("platform_settings")
      .select("value")
      .eq("key", "delivery_fare")
      .single();
    return (data as { value: FareSettings } | null)?.value || DEFAULT_DELIVERY_FARE;
  }

  async createDelivery(senderId: string, params: {
    pickupAddress: string;
    pickupLat: number;
    pickupLng: number;
    destinationAddress: string;
    destinationLat: number;
    destinationLng: number;
    distanceKm: number;
    durationMinutes: number;
    deliveryType: string;
    packageDescription?: string;
  }) {
    const settings = await this.getFareSettings();
    const estimatedFee = calculateFare(params.distanceKm, params.durationMinutes, settings);

    const { data: delivery, error } = await this.rideRepo.createDelivery({
      sender_id: senderId,
      pickup_address: params.pickupAddress,
      pickup_lat: params.pickupLat,
      pickup_lng: params.pickupLng,
      delivery_address: params.destinationAddress,
      delivery_lat: params.destinationLat,
      delivery_lng: params.destinationLng,
      distance_km: params.distanceKm,
      delivery_type: params.deliveryType,
      package_description: params.packageDescription,
      estimated_fee: estimatedFee,
      status: "searching",
    });

    if (error) throw error;

    const matchedRider = await this.matchRider(
      (delivery as { id: string }).id,
      params.pickupLat,
      params.pickupLng
    );
    return { delivery, matchedRider };
  }

  // Same matching as rides — reuse findAvailableRiders (rider_profiles based,
  // delivery-agnostic) and the nearest-rider helper.
  async matchRider(deliveryId: string, pickupLat: number, pickupLng: number) {
    const { data: riders, error } = await this.rideRepo.findAvailableRiders();
    if (error) throw error;

    type RiderWithLocation = { current_lat: number | null; current_lng: number | null; user_id: string };
    const nearest = findNearestRider((riders || []) as RiderWithLocation[], pickupLat, pickupLng);
    if (!nearest) return null;

    const { error: updateError } = await this.rideRepo.updateDelivery(deliveryId, {
      rider_id: nearest.user_id,
      status: "accepted",
    });
    if (updateError) throw updateError;

    await this.notifRepo.create({
      user_id: nearest.user_id,
      type: "delivery_request",
      title: "New Delivery Request",
      body: "You have a new delivery request nearby.",
      data: { delivery_id: deliveryId },
    });

    return nearest;
  }

  async updateDeliveryStatus(deliveryId: string, profileId: string, status: string) {
    const { data: raw, error } = await this.rideRepo.findDeliveryById(deliveryId);
    const delivery = raw as DeliveryRow | null;
    if (error || !delivery) throw new AppError("Delivery not found", 404);

    const isSender = delivery.sender_id === profileId;
    const isRider = delivery.rider_id === profileId;
    if (!isSender && !isRider) throw new AppError("Forbidden", 403);

    if (status === "cancelled") {
      if (!CANCELLABLE_FROM.includes(delivery.status)) {
        throw new AppError(`Cannot cancel a delivery that is already ${delivery.status}`, 400);
      }
    } else {
      // Every non-cancel transition is rider-driven and must follow the
      // sequence — a sender's only action is cancelling. No client-settable
      // rider_id here (assignment only happens internally in matchRider), so a
      // delivery can't be hijacked onto another rider through this endpoint.
      if (!isRider) throw new AppError("Forbidden", 403);
      const allowedNext = RIDER_ONLY_TRANSITIONS[delivery.status] || [];
      if (!allowedNext.includes(status)) {
        throw new AppError(`Cannot move a delivery from ${delivery.status} to ${status}`, 400);
      }
    }

    const updates: Record<string, unknown> = { status };
    if (status === "delivered") updates.actual_fee = delivery.estimated_fee;

    const { data, error: updateError } = await this.rideRepo.updateDelivery(deliveryId, updates);
    if (updateError) throw updateError;

    const notifyId = isSender ? delivery.rider_id : delivery.sender_id;
    if (notifyId) {
      await this.notifRepo.create({
        user_id: notifyId,
        type: "delivery_update",
        title: "Delivery Update",
        body: `Your delivery status is now: ${status.replace("_", " ")}`,
        data: { delivery_id: deliveryId, status },
      });
    }

    return data;
  }
}
