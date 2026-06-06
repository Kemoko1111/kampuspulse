import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { handleApiError, AppError } from "@/lib/errors/app-error";
import { requireProfile } from "@/lib/middleware/auth";
import { validateCsrf } from "@/lib/middleware/csrf";
import { updateRideSchema } from "@/lib/validators/ride";
import { RideRepository } from "@/lib/repositories/ride.repository";
import { RideService } from "@/lib/services/ride.service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const repo = new RideRepository(supabase);
    const { data, error } = await repo.findById(id);
    if (error || !data) throw new AppError("Ride not found", 404);
    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await validateCsrf(request);
    const { id } = await params;
    const { supabase, profile } = await requireProfile();
    const body = updateRideSchema.parse(await request.json());

    const service = new RideService(supabase);
    const data = await service.updateRideStatus(id, profile.id, body.status!, body.riderId);
    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}
