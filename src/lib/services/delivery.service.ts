import type { TypedSupabaseClient } from "@/lib/supabase/types";
import { AppError } from "@/lib/errors/app-error";
import { RideRepository } from "@/lib/repositories/ride.repository";
import { NotificationService } from "@/lib/services/notification.service";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculateFare, type FareSettings } from "@/lib/services/fare.service";

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
  order_id: string | null;
}

// Everything at UCC is within a small radius, so approximate campus-center
// coords are good enough for rider matching (findNearestRider) and the map;
// the rider navigates by the human-readable pickup/drop-off addresses.
const CAMPUS_CENTER = { lat: 5.1053, lng: -1.2825 };

export class DeliveryService {
  private rideRepo: RideRepository;
  // Admin-backed: notifies the OTHER party (sender↔rider), which the
  // notifications RLS blocks under a user client, and sends device push. See
  // the same note in RideService.
  private notifService: NotificationService;

  constructor(private supabase: TypedSupabaseClient) {
    this.rideRepo = new RideRepository(supabase);
    this.notifService = new NotificationService(createAdminClient());
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

    // Broadcast model (same as rides): leave the delivery 'searching' with no
    // rider_id so any online rider can claim it; ping available riders.
    await this.notifyAvailableRiders((delivery as { id: string }).id);
    return { delivery, matchedRider: null };
  }

  private async notifyAvailableRiders(deliveryId: string) {
    const { data: riders } = await this.rideRepo.findAvailableRiders();
    const list = (riders || []) as { user_id: string }[];
    await Promise.all(
      list.map((r) =>
        this.notifService.notify({
          userId: r.user_id,
          type: "delivery_request",
          title: "New Delivery Request",
          body: "A new delivery request is available. Open the driver app to accept.",
          data: { delivery_id: deliveryId },
        }).catch((e) => console.error("Rider ping failed:", e))
      )
    );
  }

  // Atomic first-come claim (see RideService.claimRide).
  async claimDelivery(adminClient: TypedSupabaseClient, deliveryId: string, riderProfileId: string) {
    const { data, error } = await adminClient
      .from("deliveries")
      .update({ rider_id: riderProfileId, status: "en_route" } as never)
      .eq("id", deliveryId)
      .eq("status", "searching")
      .is("rider_id", null)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new AppError("This delivery was already taken by another rider", 409, "ALREADY_CLAIMED");

    const delivery = data as { id: string; sender_id: string; order_id: string | null };
    if (delivery.sender_id) {
      await this.notifService.notify({
        userId: delivery.sender_id,
        type: "delivery_update",
        title: "Rider on the way!",
        body: "A rider accepted your delivery and is heading to pickup.",
        data: { delivery_id: deliveryId, status: "en_route" },
      });
    }
    // Keep the linked order's status in sync (accepted → processing).
    if (delivery.order_id) {
      await adminClient.from("orders").update({ status: "processing" } as never).eq("id", delivery.order_id);
    }
    return delivery;
  }

  // Bridge from EDWOM: when an order is paid, create a delivery (seller ->
  // buyer) and dispatch the nearest rider. Idempotent — a repeated call (e.g.
  // the Paystack webhook firing twice) won't create a second delivery for the
  // same order.
  async dispatchForOrder(orderId: string): Promise<void> {
    const { data: existing } = await this.supabase
      .from("deliveries")
      .select("id")
      .eq("order_id", orderId)
      .maybeSingle();
    if (existing) return;

    const { data: orderRow } = await this.supabase
      .from("orders")
      .select("id, buyer_id, seller_id, delivery_address, delivery_fee")
      .eq("id", orderId)
      .single();
    const order = orderRow as {
      id: string; buyer_id: string; seller_id: string;
      delivery_address: string | null; delivery_fee: number | null;
    } | null;
    if (!order) return;

    // Best-effort human-readable pickup address from the seller's profile.
    const { data: sellerRow } = await this.supabase
      .from("profiles")
      .select("full_name, hall_of_residence")
      .eq("id", order.seller_id)
      .single();
    const seller = sellerRow as { full_name: string | null; hall_of_residence: string | null } | null;
    const pickupAddress = seller?.hall_of_residence
      ? `${seller.full_name || "Seller"} — ${seller.hall_of_residence}`
      : `${seller?.full_name || "Seller"} (pickup)`;

    // sender_id = buyer so the buyer can track it (deliveries_select RLS is
    // sender or rider) and the order-tracking page can read it.
    const { data: delivery, error } = await this.rideRepo.createDelivery({
      order_id: order.id,
      sender_id: order.buyer_id,
      delivery_type: "marketplace",
      pickup_address: pickupAddress,
      pickup_lat: CAMPUS_CENTER.lat,
      pickup_lng: CAMPUS_CENTER.lng,
      delivery_address: order.delivery_address || "Buyer address",
      delivery_lat: CAMPUS_CENTER.lat,
      delivery_lng: CAMPUS_CENTER.lng,
      distance_km: 2,
      estimated_fee: order.delivery_fee ?? 5,
      status: "searching",
    });
    if (error || !delivery) return;

    // Broadcast to all online riders (first to accept claims it).
    await this.notifyAvailableRiders((delivery as { id: string }).id);
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

    // If this delivery is fulfilling an EDWOM order, mirror the rider's
    // progress onto the order so the buyer's order-tracking timeline stays in
    // sync. Only uses order statuses allowed by the DB CHECK constraint
    // (…, processing, shipped, delivered, …).
    if (delivery.order_id) {
      const orderStatus =
        status === "en_route" ? "processing" :
        status === "picked_up" ? "shipped" :
        status === "delivered" ? "delivered" : null;
      if (orderStatus) {
        await this.supabase
          .from("orders")
          .update({ status: orderStatus } as never)
          .eq("id", delivery.order_id);
      }
    }

    const notifyId = isSender ? delivery.rider_id : delivery.sender_id;
    if (notifyId) {
      await this.notifService.notify({
        userId: notifyId,
        type: "delivery_update",
        title: "Delivery Update",
        body: `Your delivery status is now: ${status.replace("_", " ")}`,
        data: { delivery_id: deliveryId, status },
      });
    }

    return data;
  }
}
