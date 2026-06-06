import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { handleApiError } from "@/lib/errors/app-error";
import { requireProfile } from "@/lib/middleware/auth";
import { validateCsrf } from "@/lib/middleware/csrf";
import { createRideSchema } from "@/lib/validators/ride";
import { RideService } from "@/lib/services/ride.service";

export async function POST(request: NextRequest) {
  try {
    await validateCsrf(request);
    const { profile } = await requireProfile();
    const body = createRideSchema.parse(await request.json());

    const service = new RideService(createAdminClient());
    const result = await service.createRide(profile.id, body);
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
