import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/errors/app-error";
import { requireRole } from "@/lib/middleware/auth";
import { validateCsrf } from "@/lib/middleware/csrf";
import { refundSchema } from "@/lib/validators/payment";
import { PaymentService } from "@/lib/services/payment.service";

// Refunds are an admin-only action: initiateRefund() looks up the transaction
// by id with no ownership check, so any authenticated caller could otherwise
// refund an arbitrary user's transaction (IDOR). Gate to admin, matching the
// sibling /api/admin/payments route.
export async function POST(request: NextRequest) {
  try {
    await validateCsrf(request);
    const { supabase } = await requireRole(["admin"]);
    const body = refundSchema.parse(await request.json());

    const service = new PaymentService(supabase);
    const data = await service.initiateRefund(body.transactionId, body.amount, body.reason);
    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}
