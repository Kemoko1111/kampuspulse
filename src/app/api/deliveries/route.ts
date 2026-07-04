import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/errors/app-error";
import { requireProfile } from "@/lib/middleware/auth";
import { validateCsrf } from "@/lib/middleware/csrf";
import { createDeliverySchema } from "@/lib/validators/delivery";
import { DeliveryService } from "@/lib/services/delivery.service";

export async function POST(req: NextRequest) {
  try {
    await validateCsrf(req);
    const { supabase, profile } = await requireProfile();
    const body = createDeliverySchema.parse(await req.json());

    // Previously this route created the delivery row but never matched a
    // rider, so it sat at 'searching' forever. DeliveryService now matches
    // the nearest available rider (same logic as rides) and notifies them.
    const service = new DeliveryService(supabase);
    const { delivery, matchedRider } = await service.createDelivery(profile.id, {
      pickupAddress: body.pickupAddress,
      pickupLat: body.pickupLat,
      pickupLng: body.pickupLng,
      destinationAddress: body.destinationAddress,
      destinationLat: body.destinationLat,
      destinationLng: body.destinationLng,
      distanceKm: body.distanceKm,
      durationMinutes: body.durationMinutes,
      deliveryType: body.deliveryType,
      packageDescription: body.packageDescription,
    });

    return NextResponse.json({
      success: true,
      data: {
        delivery,
        matchedRider,
        message: matchedRider
          ? "Delivery request created. A rider is on the way."
          : "Delivery request created. Searching for a rider…",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
