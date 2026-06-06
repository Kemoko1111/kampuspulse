import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/errors/app-error";
import { requireProfile } from "@/lib/middleware/auth";
import { validateCsrf } from "@/lib/middleware/csrf";
import { initializePaymentSchema } from "@/lib/validators/payment";
import { PaymentService } from "@/lib/services/payment.service";

export async function POST(request: NextRequest) {
  try {
    await validateCsrf(request);
    const { supabase, profile } = await requireProfile();
    const body = initializePaymentSchema.parse(await request.json());

    const service = new PaymentService(supabase);
    const data = await service.initializePayment({
      amount: body.amount,
      email: body.email,
      profileId: profile.id,
      orderId: body.orderId,
      taskId: body.taskId,
      rideId: body.rideId,
      paymentMethod: body.paymentMethod,
      phone: body.phone,
    });

    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}
