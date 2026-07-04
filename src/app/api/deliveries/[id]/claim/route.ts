import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { handleApiError } from "@/lib/errors/app-error";
import { requireProfile } from "@/lib/middleware/auth";
import { validateCsrf } from "@/lib/middleware/csrf";
import { DeliveryService } from "@/lib/services/delivery.service";

// First-come claim of a broadcast delivery request (see the rides claim route).
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await validateCsrf(request);
    const { id } = await params;
    const { supabase, profile } = await requireProfile();

    if (profile.role !== "rider" && profile.role !== "admin") {
      return NextResponse.json({ error: "Only riders can accept requests" }, { status: 403 });
    }

    const service = new DeliveryService(supabase);
    const data = await service.claimDelivery(createAdminClient(), id, profile.id);
    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}
