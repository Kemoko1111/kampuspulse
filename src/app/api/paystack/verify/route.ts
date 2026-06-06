import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/errors/app-error";
import { requireProfile } from "@/lib/middleware/auth";
import { verifyPaymentSchema } from "@/lib/validators/payment";
import { PaymentService } from "@/lib/services/payment.service";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { supabase } = await requireProfile();
    const body = verifyPaymentSchema.parse(await request.json());

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
