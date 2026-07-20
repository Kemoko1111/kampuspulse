import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/errors/app-error";
import { requireProfile } from "@/lib/middleware/auth";
import { validateCsrf } from "@/lib/middleware/csrf";
import { rateLimit } from "@/lib/middleware/rate-limit";
import { withdrawSchema } from "@/lib/validators/payment";
import { PaymentService } from "@/lib/services/payment.service";

export async function POST(request: NextRequest) {
  try {
    await validateCsrf(request);
    const { supabase, profile } = await requireProfile();
    await rateLimit(profile.id, "payment");
    const { amount, phone, provider } = withdrawSchema.parse(await request.json());

    const service = new PaymentService(supabase);
    const result = await service.initiateWithdrawal(profile.id, amount, phone, provider);

    return NextResponse.json({ data: result });
  } catch (error) {
    return handleApiError(error);
  }
}
