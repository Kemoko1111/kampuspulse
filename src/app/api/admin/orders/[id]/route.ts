import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/errors/app-error";
import { requireRole } from "@/lib/middleware/auth";
import { AppError } from "@/lib/errors/app-error";

/* ─── GET /api/admin/orders/[id] — Fetch single order with full details ─── */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase } = await requireRole(["admin"]);
    const { id } = await params;

    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        id,
        buyer_id,
        seller_id,
        total_amount,
        delivery_fee,
        status,
        payment_method,
        payment_status,
        payment_reference,
        delivery_address,
        notes,
        created_at,
        deleted_at,
        buyer:profiles!orders_buyer_id_fkey (
          id,
          user_id,
          full_name,
          phone,
          avatar_url,
          hall_of_residence,
          role,
          status
        ),
        seller:profiles!orders_seller_id_fkey (
          id,
          user_id,
          full_name,
          phone,
          avatar_url
        ),
        order_items (
          id,
          product_id,
          quantity,
          unit_price,
          total_price,
          product:products (
            id,
            title
          )
        )
      `
      )
      .eq("id", id)
      .single();

    if (error || !data) {
      throw new AppError("Order not found", 404, "NOT_FOUND");
    }

    // Orders don't store a transaction id directly — the payment record they're
    // linked to lives in `transactions`, keyed by the shared `reference` string.
    // Look it up so the admin UI can offer a refund action against the right
    // transaction without a second round trip.
    let transaction: { id: string; amount: number; status: string } | null = null;
    const paymentReference = (data as { payment_reference?: string | null }).payment_reference;
    if (paymentReference) {
      const { data: txn } = await supabase
        .from("transactions")
        .select("id, amount, status")
        .eq("reference", paymentReference)
        .maybeSingle();
      transaction = txn as { id: string; amount: number; status: string } | null;
    }

    return NextResponse.json({ order: { ...(data as object), transaction } });
  } catch (error) {
    return handleApiError(error);
  }
}

/* ─── PATCH /api/admin/orders/[id] — Update order (status, assign rider, etc.) ─── */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, profile } = await requireRole(["admin"]);
    const { id } = await params;

    const body = await request.json();
    const { action, status, notes } = body as {
      action: "accept" | "reject" | "update_status" | "assign_rider";
      status?: string;
      notes?: string;
    };

    if (!action) {
      throw new AppError("Action is required", 400, "MISSING_ACTION");
    }

    // Build the update payload
    const updatePayload: Record<string, unknown> = {};

    switch (action) {
      case "accept":
        updatePayload.status = "confirmed";
        break;

      case "reject":
        updatePayload.status = "cancelled";
        if (notes) updatePayload.notes = notes;
        break;

      case "update_status":
        if (!status) {
          throw new AppError(
            "Status is required for update_status action",
            400,
            "MISSING_STATUS"
          );
        }
        // Must match the orders.status DB CHECK exactly — preparing/ready/
        // picked_up/in_transit are NOT valid and caused a 500 on every use.
        const validStatuses = [
          "pending",
          "confirmed",
          "processing",
          "shipped",
          "delivered",
          "cancelled",
          "refunded",
        ];
        if (!validStatuses.includes(status)) {
          throw new AppError(
            `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
            400,
            "INVALID_STATUS"
          );
        }
        updatePayload.status = status;
        if (notes) updatePayload.notes = notes;
        break;

      case "assign_rider":
        // orders has no rider_id column (rider assignment lives on the linked
        // delivery, dispatched automatically when the order is paid). Manually
        // marking an order out-for-delivery just advances it to "shipped".
        updatePayload.status = "shipped";
        break;

      default:
        throw new AppError("Invalid action", 400, "INVALID_ACTION");
    }

    // Update the order
    const { data: updatedOrder, error: updateError } = await supabase
      .from("orders")
      .update(updatePayload as never)
      .eq("id", id)
      .select(
        `
        id,
        total_amount,
        delivery_fee,
        status,
        payment_method,
        payment_status,
        delivery_address,
        notes,
        created_at,
        buyer:profiles!orders_buyer_id_fkey (
          id,
          full_name,
          phone,
          avatar_url
        ),
        seller:profiles!orders_seller_id_fkey (
          id,
          full_name
        )
      `
      )
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    // Log admin action
    await supabase.from("admin_logs").insert({
      admin_id: profile.id,
      action: action,
      resource_type: "order",
      resource_id: id,
      new_data: updatePayload,
    } as never);

    return NextResponse.json({ order: updatedOrder });
  } catch (error) {
    return handleApiError(error);
  }
}
