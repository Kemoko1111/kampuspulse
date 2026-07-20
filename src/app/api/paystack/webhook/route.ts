import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { NotificationService } from "@/lib/services/notification.service";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  const hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_WEBHOOK_SECRET!)
    .update(body)
    .digest("hex");

  // Plain !== leaks timing information proportional to how many leading
  // characters match, in principle usable to guess the correct signature
  // byte-by-byte. timingSafeEqual takes the same time regardless of where
  // (or whether) the buffers differ.
  const hashBuffer = Buffer.from(hash, "hex");
  const signatureBuffer = Buffer.from(signature ?? "", "hex");
  const signatureValid =
    hashBuffer.length === signatureBuffer.length &&
    crypto.timingSafeEqual(hashBuffer, signatureBuffer);

  if (!signatureValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(body);
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const notifService = new NotificationService(supabase as never);

  if (event.event === "charge.success") {
    const { reference, metadata, amount } = event.data;
    const orderId = metadata?.order_id;
    // A single checkout can settle multiple orders (one per seller).
    const orderIds: string[] = metadata?.order_ids?.length
      ? metadata.order_ids
      : orderId
      ? [orderId]
      : [];
    const taskId = metadata?.task_id;
    const rideId = metadata?.ride_id;
    const userId = metadata?.user_id;

    // Paystack retries webhooks on timeout/non-2xx, so this event may arrive more than
    // once. Only the first delivery flips a transaction from pending to success; retries
    // find zero matching rows and skip the side effects below (wallet credit, order/task/
    // ride confirmation, notifications) so they can't be double-applied.
    const { data: updatedTransactions } = await supabase
      .from("transactions")
      .update({ status: "success" })
      .eq("reference", reference)
      .neq("status", "success")
      .select("id");

    if (!updatedTransactions || updatedTransactions.length === 0) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    for (const oid of orderIds) {
      await supabase
        .from("orders")
        .update({ payment_status: "paid", status: "confirmed", payment_reference: reference })
        .eq("id", oid);

      // Payment confirmed → decrement stock + clear cart (runs once, inside
      // the transaction-guard block above, so a repeated webhook won't
      // double-decrement).
      const { fulfillPaidOrder } = await import("@/lib/services/order-fulfillment");
      await fulfillPaidOrder(supabase as never, oid);

      // Order paid → dispatch a rider to deliver it (idempotent, so a repeated
      // webhook won't create a second delivery). Best-effort.
      try {
        const { DeliveryService } = await import("@/lib/services/delivery.service");
        await new DeliveryService(supabase as never).dispatchForOrder(oid);
      } catch (e) {
        logger.error("Order delivery dispatch failed", e, { orderId: oid });
      }

      const { data: order } = await supabase
        .from("orders")
        .select("buyer_id, seller_id, total_amount")
        .eq("id", oid)
        .single();

      if (order) {
        await notifService.notify({
          userId: order.buyer_id,
          type: "payment_success",
          title: "Payment Confirmed!",
          body: `Your payment of GHS ${order.total_amount} was successful.`,
          data: { order_id: oid, reference },
        });
        await notifService.notify({
          userId: order.seller_id,
          type: "new_order",
          title: "New Order Paid!",
          body: `Order worth GHS ${order.total_amount} has been paid.`,
          data: { order_id: oid },
        });
      }
    }

    if (taskId) {
      await supabase
        .from("tasks")
        .update({ payment_status: "escrowed", payment_reference: reference })
        .eq("id", taskId);
    }

    if (rideId) {
      await supabase
        .from("rides")
        .update({ payment_status: "paid", payment_reference: reference })
        .eq("id", rideId);
    }

    if (!orderId && !taskId && !rideId && userId) {
      await supabase.rpc("increment_wallet_balance", {
        p_user_id: userId,
        p_amount: amount / 100,
      });
    }
  }

  if (event.event === "charge.failed") {
    const { reference, metadata } = event.data;
    await supabase.from("transactions").update({ status: "failed" }).eq("reference", reference);
    // Cancel the pending order so it isn't a ghost. No stock to restore —
    // stock is only decremented on payment success (see fulfillPaidOrder).
    const failedOrderId = metadata?.order_id;
    if (failedOrderId) {
      await supabase
        .from("orders")
        .update({ status: "cancelled", payment_status: "failed" })
        .eq("id", failedOrderId)
        .eq("payment_status", "pending");
    }
  }

  if (event.event === "refund.processed") {
    const { transaction_reference } = event.data;
    await supabase.from("transactions").update({ status: "reversed" }).eq("reference", transaction_reference);
    await supabase.from("refunds").update({ status: "processed" }).eq("paystack_reference", transaction_reference);
  }

  // Finalizes a withdrawal that PaymentService.initiateWithdrawal() left as
  // "pending" (some Paystack account configs require OTP/manual approval
  // before a transfer actually completes, so the synchronous API response
  // alone isn't final).
  if (event.event === "transfer.success") {
    const { reference } = event.data;
    await supabase.from("transactions").update({ status: "success" }).eq("reference", reference).neq("status", "success");
  }

  // A transfer that fails or gets reversed after being marked "pending" means
  // the money never actually left — the wallet was already debited when the
  // withdrawal was initiated, so it must be credited back here. Guarded by
  // `.neq("status", "failed")` so a retried webhook delivery can't credit
  // the wallet twice for the same failed transfer.
  if (event.event === "transfer.failed" || event.event === "transfer.reversed") {
    const { reference } = event.data;
    const { data: updated } = await supabase
      .from("transactions")
      .update({ status: "failed" })
      .eq("reference", reference)
      .neq("status", "failed")
      .select("user_id, amount");

    for (const txn of (updated ?? []) as { user_id: string; amount: number }[]) {
      await supabase.rpc("increment_wallet_balance", { p_user_id: txn.user_id, p_amount: txn.amount });
    }
  }

  return NextResponse.json({ received: true });
}
