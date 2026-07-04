import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { NotificationService } from "@/lib/services/notification.service";

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

    if (orderId) {
      await supabase
        .from("orders")
        .update({ payment_status: "paid", status: "confirmed", payment_reference: reference })
        .eq("id", orderId);

      const { data: order } = await supabase
        .from("orders")
        .select("buyer_id, seller_id, total_amount")
        .eq("id", orderId)
        .single();

      if (order) {
        await notifService.notify({
          userId: order.buyer_id,
          type: "payment_success",
          title: "Payment Confirmed!",
          body: `Your payment of GHS ${(amount / 100).toFixed(2)} was successful.`,
          data: { order_id: orderId, reference },
        });
        await notifService.notify({
          userId: order.seller_id,
          type: "new_order",
          title: "New Order Paid!",
          body: `Order worth GHS ${order.total_amount} has been paid.`,
          data: { order_id: orderId },
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
    const { reference } = event.data;
    await supabase.from("transactions").update({ status: "failed" }).eq("reference", reference);
  }

  if (event.event === "refund.processed") {
    const { transaction_reference } = event.data;
    await supabase.from("transactions").update({ status: "reversed" }).eq("reference", transaction_reference);
    await supabase.from("refunds").update({ status: "processed" }).eq("paystack_reference", transaction_reference);
  }

  return NextResponse.json({ received: true });
}
