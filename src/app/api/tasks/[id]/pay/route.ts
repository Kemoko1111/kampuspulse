import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/errors/app-error";
import { requireProfile } from "@/lib/middleware/auth";
import { validateCsrf } from "@/lib/middleware/csrf";
import { rateLimit } from "@/lib/middleware/rate-limit";
import { TaskService } from "@/lib/services/task.service";

// Fund a task's escrow — charges the poster the full reward. On payment
// success (dev path or Paystack webhook) tasks.payment_status becomes
// 'escrowed', which unlocks accepting a worker. This route previously had no
// caller at all, so escrow could never be funded.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await validateCsrf(request);
    const { id } = await params;
    const { supabase, profile, user } = await requireProfile();
    await rateLimit(profile.id, "payment");

    const service = new TaskService(supabase);
    const payment = await service.initiateEscrowPayment(id, profile.id, user.email!);
    return NextResponse.json({ data: payment });
  } catch (error) {
    return handleApiError(error);
  }
}
