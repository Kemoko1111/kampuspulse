import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/errors/app-error";
import { requireRole } from "@/lib/middleware/auth";
import { validateCsrf } from "@/lib/middleware/csrf";
import { riderLocationSchema } from "@/lib/validators/ride";
import { RideRepository } from "@/lib/repositories/ride.repository";

export async function PATCH(request: NextRequest) {
  try {
    await validateCsrf(request);
    const { supabase, profile } = await requireRole(["rider"]);
    const body = riderLocationSchema.parse(await request.json());

    const repo = new RideRepository(supabase);
    const { data, error } = await repo.updateRiderLocation(profile.id, body.lat, body.lng);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}
