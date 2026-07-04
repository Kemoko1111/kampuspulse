import { NextRequest, NextResponse } from "next/server";
import { handleApiError, AppError } from "@/lib/errors/app-error";
import { requireProfile } from "@/lib/middleware/auth";
import { validateCsrf } from "@/lib/middleware/csrf";
import { RideRepository } from "@/lib/repositories/ride.repository";
import { DeliveryService } from "@/lib/services/delivery.service";
import { z } from "zod";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { supabase } = await requireProfile();
    const repo = new RideRepository(supabase);
    const { data, error } = await repo.findDeliveryById(id);
    // RLS (deliveries_select: sender or rider) already scopes visibility —
    // someone who isn't a party to the delivery gets no row back.
    if (error || !data) throw new AppError("Delivery not found", 404);
    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}

const updateSchema = z.object({
  status: z.enum(["searching", "accepted", "en_route", "picked_up", "delivered", "cancelled"]),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await validateCsrf(request);
    const { id } = await params;
    const { supabase, profile } = await requireProfile();
    const body = updateSchema.parse(await request.json());

    const service = new DeliveryService(supabase);
    const data = await service.updateDeliveryStatus(id, profile.id, body.status);
    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}
