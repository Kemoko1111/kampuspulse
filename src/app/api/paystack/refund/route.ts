import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/errors/app-error";
import { requireProfile } from "@/lib/middleware/auth";
import { validateCsrf } from "@/lib/middleware/csrf";
import { refundSchema } from "@/lib/validators/payment";
import { PaymentService } from "@/lib/services/payment.service";

export async function POST(request: NextRequest) {
  try {
    await validateCsrf(request);
    const { supabase } = await requireProfile();
    const body = refundSchema.parse(await request.json());

    const service = new PaymentService(supabase);
    const data = await service.initiateRefund(body.transactionId, body.amount, body.reason);
    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}
