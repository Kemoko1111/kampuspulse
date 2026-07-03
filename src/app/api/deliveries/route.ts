import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/errors/app-error";
import { requireProfile } from "@/lib/middleware/auth";
import { validateCsrf } from "@/lib/middleware/csrf";
import { createDeliverySchema } from "@/lib/validators/delivery";
import { calculateFare, type FareSettings } from "@/lib/services/fare.service";

const DEFAULT_DELIVERY_FARE: FareSettings = { base_fare: 8, per_km_rate: 3, per_min_rate: 0.75 };

export async function POST(req: NextRequest) {
  try {
    await validateCsrf(req);
    const { supabase, profile } = await requireProfile();

    const body = createDeliverySchema.parse(await req.json());

    const { data: settingsRow } = await supabase
      .from("platform_settings")
      .select("value")
      .eq("key", "delivery_fare")
      .single();
    const settings = (settingsRow as { value: FareSettings } | null)?.value || DEFAULT_DELIVERY_FARE;
    const estimatedFee = calculateFare(body.distanceKm, body.durationMinutes, settings);

    const { data: delivery, error } = await supabase
      .from("deliveries")
      .insert({
        sender_id: profile.id,
        pickup_address: body.pickupAddress,
        pickup_lat: body.pickupLat,
        pickup_lng: body.pickupLng,
        delivery_address: body.destinationAddress,
        delivery_lat: body.destinationLat,
        delivery_lng: body.destinationLng,
        distance_km: body.distanceKm,
        delivery_type: body.deliveryType,
        package_description: body.packageDescription,
        estimated_fee: estimatedFee,
        status: "searching",
      } as never)
      .select()
      .single();

    if (error) {
      console.error("Delivery insert error:", error);
      throw new Error("Failed to create delivery request");
    }

    return NextResponse.json({
      success: true,
      data: {
        delivery,
        message: "Delivery request created. Waiting for a rider."
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}
