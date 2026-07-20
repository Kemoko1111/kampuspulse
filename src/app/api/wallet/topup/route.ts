import { NextRequest, NextResponse } from "next/server";
import { handleApiError, AppError } from "@/lib/errors/app-error";
import { requireProfile } from "@/lib/middleware/auth";
import { validateCsrf } from "@/lib/middleware/csrf";
import { rateLimit } from "@/lib/middleware/rate-limit";
import { PaymentService } from "@/lib/services/payment.service";
import { z } from "zod";

const schema = z.object({
  amount: z.number().positive().max(10000),
});

// Wallet top-up. A payment with only user_id in its metadata (no order/task/
// ride) credits the wallet on success — the Paystack webhook already handles
// that branch, and completeDevPayment credits it directly in dev mode.
export async function POST(request: NextRequest) {
  try {
    await validateCsrf(request);
    const { supabase, profile, user } = await requireProfile();
    await rateLimit(profile.id, "payment");
    const { amount } = schema.parse(await request.json());
    if (amount <= 0) throw new AppError("Amount must be positive", 400);

    const service = new PaymentService(supabase);
    const payment = await service.initializePayment({
      amount,
      email: user.email!,
      profileId: profile.id,
      paymentMethod: "mtn_momo",
    });

    return NextResponse.json({ data: payment });
  } catch (error) {
    return handleApiError(error);
  }
}
