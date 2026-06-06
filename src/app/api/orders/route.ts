import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { handleApiError } from "@/lib/errors/app-error";
import { requireProfile } from "@/lib/middleware/auth";
import { validateCsrf } from "@/lib/middleware/csrf";
import { createOrderSchema, orderQuerySchema } from "@/lib/validators/order";
import { OrderRepository } from "@/lib/repositories/order.repository";
import { CheckoutService } from "@/lib/services/checkout.service";
import { NotificationService } from "@/lib/services/notification.service";

export async function GET(request: NextRequest) {
  try {
    const { supabase, profile } = await requireProfile();
    const { searchParams } = new URL(request.url);
    const { status } = orderQuerySchema.parse(Object.fromEntries(searchParams));

    const repo = new OrderRepository(supabase);
    let query = repo.findByProfile(profile.id, status === "all" ? undefined : status);
    const { data, error } = await query;

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await validateCsrf(request);
    const { profile, user } = await requireProfile();
    const body = createOrderSchema.parse(await request.json());

    const admin = createAdminClient();
    const checkout = new CheckoutService(admin);
    const result = await checkout.createOrderFromCart(
      profile.id,
      user.email!,
      body.deliveryAddress,
      body.notes,
      body.paymentMethod
    );

    const notif = new NotificationService(admin);
    await notif.notify({
      userId: result.order.seller_id,
      type: "new_order",
      title: "New Order Received!",
      body: `You have a new order worth GHS ${result.order.total_amount}`,
      data: { order_id: result.order.id },
    });

    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
