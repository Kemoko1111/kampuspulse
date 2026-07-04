import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/errors/app-error";
import { requireProfile } from "@/lib/middleware/auth";
import { validateCsrf } from "@/lib/middleware/csrf";
import { validatePromotionSchema } from "@/lib/validators/promotion";
import { createAdminClient } from "@/lib/supabase/admin";

interface PromotionRow {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_order_amount: number;
  max_uses: number | null;
  current_uses: number;
  expires_at: string | null;
  status: string;
}

export async function POST(request: NextRequest) {
  try {
    await validateCsrf(request);
    await requireProfile();
    const body = validatePromotionSchema.parse(await request.json());

    // The public RLS policy on `promotions` only exposes active/unexpired
    // rows, which would make it impossible to tell "not found" apart from
    // "expired"/"disabled" here. Use the admin client (auth already enforced
    // above via requireProfile) so we can look up the real row and explain
    // exactly why a code doesn't apply.
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("promotions")
      .select("*")
      .eq("code", body.code.toUpperCase())
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const promo = data as PromotionRow | null;

    if (!promo) {
      return NextResponse.json({ valid: false, error: "Promo code not found" }, { status: 404 });
    }

    if (promo.status !== "active") {
      return NextResponse.json(
        { valid: false, error: `This promo code is ${promo.status}` },
        { status: 400 }
      );
    }

    if (promo.expires_at && new Date(promo.expires_at) <= new Date()) {
      return NextResponse.json(
        { valid: false, error: "This promo code has expired" },
        { status: 400 }
      );
    }

    if (promo.max_uses !== null && promo.current_uses >= promo.max_uses) {
      return NextResponse.json(
        { valid: false, error: "This promo code has reached its usage limit" },
        { status: 400 }
      );
    }

    if (body.orderAmount < promo.min_order_amount) {
      return NextResponse.json(
        { valid: false, error: `This code requires a minimum order of GHS ${promo.min_order_amount}` },
        { status: 400 }
      );
    }

    // NOTE: this only validates the code — current_uses is not incremented
    // here. That needs to happen at order-creation time (checkout), which
    // isn't wired up yet; a code can currently be validated as many times
    // as it's checked without counting against max_uses until that's done.
    return NextResponse.json({
      valid: true,
      data: {
        code: promo.code,
        discount_type: promo.discount_type,
        discount_value: promo.discount_value,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
