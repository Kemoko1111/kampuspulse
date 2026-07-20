import { NextRequest, NextResponse } from "next/server";
import { AppError, handleApiError } from "@/lib/errors/app-error";
import { requireProfile } from "@/lib/middleware/auth";
import { rateLimit } from "@/lib/middleware/rate-limit";
import { verifyPaymentSchema } from "@/lib/validators/payment";
import { PaymentService } from "@/lib/services/payment.service";

export async function POST(request: NextRequest) {
  try {
    const { supabase, profile } = await requireProfile();
    await rateLimit(profile.id, "payment");
    const body = verifyPaymentSchema.parse(await request.json());

    // Without this, any authenticated user could pass an arbitrary/guessed
    // reference: verifyPayment() would happily return another user's
    // Paystack payload (amount, email, channel — real PII), and the
    // update below would flip an unrelated transaction to "success" with
    // no ownership check at all.
    const { data: owned } = await supabase
      .from("transactions")
      .select("id")
      .eq("reference", body.reference)
      .eq("user_id", profile.id)
      .maybeSingle();

    if (!owned) {
      throw new AppError("Transaction not found", 404, "NOT_FOUND");
    }

    const service = new PaymentService(supabase);
    const data = await service.verifyPayment(body.reference);

    if (data.status === "success") {
      await supabase
        .from("transactions")
        .update({ status: "success" } as never)
        .eq("reference", body.reference);
    }

    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}
