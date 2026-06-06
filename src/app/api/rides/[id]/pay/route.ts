import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/errors/app-error";
import { requireProfile } from "@/lib/middleware/auth";
import { validateCsrf } from "@/lib/middleware/csrf";
import { RideService } from "@/lib/services/ride.service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await validateCsrf(request);
    const { id } = await params;
    const { supabase, profile, user } = await requireProfile();

    const service = new RideService(supabase);
    const payment = await service.initiateRidePayment(id, profile.id, user.email!);
    return NextResponse.json({ data: payment });
  } catch (error) {
    return handleApiError(error);
  }
}
