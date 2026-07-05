import type { TypedSupabaseClient } from "@/lib/supabase/types";
import { AppError } from "@/lib/errors/app-error";
import { isDevPaymentReference, isPaystackConfigured } from "@/lib/payments/config";

const PAYSTACK_BASE = "https://api.paystack.co";

interface InitializePaymentParams {
  amount: number;
  email: string;
  profileId: string;
  orderId?: string;
  // A single cart can produce multiple orders (one per seller). All are
  // settled together by one payment; orderId (if set) is treated as one of them.
  orderIds?: string[];
  taskId?: string;
  rideId?: string;
  paymentMethod?: string;
  phone?: string;
}

export class PaymentService {
  constructor(private supabase: TypedSupabaseClient) {}

  // Mark one order paid, then decrement stock/clear cart and dispatch a rider.
  // Shared by the dev-payment path here and (mirrored) by the Paystack webhook.
  private async settleOrder(orderId: string, reference: string) {
    await this.supabase
      .from("orders")
      .update({ payment_status: "paid", status: "confirmed", payment_reference: reference } as never)
      .eq("id", orderId);

    const { fulfillPaidOrder } = await import("@/lib/services/order-fulfillment");
    await fulfillPaidOrder(this.supabase, orderId);

    try {
      const { DeliveryService } = await import("@/lib/services/delivery.service");
      await new DeliveryService(this.supabase).dispatchForOrder(orderId);
    } catch (e) {
      console.error("Order delivery dispatch failed:", e);
    }
  }

  private ensurePaystackConfigured() {
    if (!isPaystackConfigured()) {
      throw new AppError(
        "Paystack is not configured. Add your test keys from dashboard.paystack.com to .env.local",
        503,
        "PAYSTACK_NOT_CONFIGURED"
      );
    }
  }

  // Applies all the side effects of a confirmed payment (record the
  // transaction, settle orders, escrow a task, mark a ride paid, or credit a
  // top-up). Shared by the dev-payment and wallet-payment paths; the real
  // Paystack flow does the equivalent in its webhook. `label` distinguishes
  // dev/wallet in descriptions; `topUp` credits rather than treating as spend.
  private async settleConfirmedPayment(params: InitializePaymentParams, reference: string, label: string) {
    const isTopUp = !params.orderId && !params.orderIds?.length && !params.taskId && !params.rideId;

    await this.supabase.from("transactions").insert({
      user_id: params.profileId,
      type: isTopUp ? "top_up" : params.taskId ? "escrow" : "payment",
      amount: params.amount,
      payment_method: params.paymentMethod || "mtn_momo",
      reference,
      status: "success",
      description: params.orderId || params.orderIds?.length
        ? `Order payment (${label})`
        : params.taskId
        ? `Task escrow ${params.taskId} (${label})`
        : params.rideId
        ? `Ride payment ${params.rideId} (${label})`
        : `Wallet top-up (${label})`,
      metadata: { order_id: params.orderId, order_ids: params.orderIds, task_id: params.taskId, ride_id: params.rideId },
    } as never);

    const orderIds = params.orderIds ?? (params.orderId ? [params.orderId] : []);
    for (const orderId of orderIds) {
      await this.settleOrder(orderId, reference);
    }

    if (params.taskId) {
      await this.supabase
        .from("tasks")
        .update({ payment_status: "escrowed", payment_reference: reference } as never)
        .eq("id", params.taskId);
    }

    if (params.rideId) {
      await this.supabase
        .from("rides")
        .update({ payment_status: "paid", payment_reference: reference } as never)
        .eq("id", params.rideId);
    }

    if (isTopUp) {
      await this.supabase.rpc("increment_wallet_balance", {
        p_user_id: params.profileId,
        p_amount: params.amount,
      } as never);
    }
  }

  private redirectFor(params: InitializePaymentParams) {
    return params.orderId || params.orderIds?.length
      ? "/edwom/orders"
      : params.taskId
      ? `/y3adwuma/task/${params.taskId}`
      : params.rideId
      ? `/ezzyride/track/${params.rideId}`
      : "/profile";
  }

  // Pay from wallet balance — atomic debit, then settle. A top-up can't be
  // "paid" from the wallet, so this is always a spend.
  private async completeWalletPayment(params: InitializePaymentParams) {
    const { data: ok } = await this.supabase.rpc("decrement_wallet_balance", {
      p_user_id: params.profileId,
      p_amount: params.amount,
    } as never);
    if (!ok) throw new AppError("Insufficient wallet balance", 400, "INSUFFICIENT_FUNDS");

    const reference = `CP_WALLET_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await this.settleConfirmedPayment(params, reference, "wallet");

    return { reference, dev_mode: true, redirect_url: this.redirectFor(params) };
  }

  private async completeDevPayment(params: InitializePaymentParams) {
    const reference = `CP_DEV_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await this.settleConfirmedPayment(params, reference, "dev");
    return { reference, dev_mode: true, redirect_url: this.redirectFor(params) };
  }

  async initializePayment(params: InitializePaymentParams) {
    // Paying from wallet balance settles instantly server-side — no Paystack
    // round-trip. Throws on insufficient funds (atomic RPC, can't go negative).
    if (params.paymentMethod === "wallet") {
      return this.completeWalletPayment(params);
    }

    if (!isPaystackConfigured()) {
      return this.completeDevPayment(params);
    }

    const reference = `CP_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const amountInPesewas = Math.round(params.amount * 100);

    const channels =
      params.paymentMethod === "mtn_momo"
        ? ["mobile_money"]
        : params.paymentMethod === "telecel"
        ? ["mobile_money"]
        : params.paymentMethod === "airteltigo"
        ? ["mobile_money"]
        : ["card", "mobile_money"];

    const response = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: params.email,
        amount: amountInPesewas,
        reference,
        currency: "GHS",
        channels,
        metadata: {
          user_id: params.profileId,
          order_id: params.orderId,
          order_ids: params.orderIds,
          task_id: params.taskId,
          ride_id: params.rideId,
          custom_fields: [
            { display_name: "Payment Method", variable_name: "payment_method", value: params.paymentMethod },
          ],
        },
        ...(params.phone && params.paymentMethod !== "card"
          ? { mobile_money: { phone: params.phone, provider: params.paymentMethod } }
          : {}),
      }),
    });

    const result = await response.json();
    if (!result.status) {
      throw new AppError(result.message || "Payment initialization failed", 400);
    }

    await this.supabase.from("transactions").insert({
      user_id: params.profileId,
      type: params.taskId ? "escrow" : "payment",
      amount: params.amount,
      payment_method: params.paymentMethod || "mtn_momo",
      reference,
      status: "pending",
      description: params.orderId
        ? `Order payment ${params.orderId}`
        : params.taskId
        ? `Task escrow ${params.taskId}`
        : `Ride payment ${params.rideId}`,
      metadata: { order_id: params.orderId, order_ids: params.orderIds, task_id: params.taskId, ride_id: params.rideId },
    } as never);

    return { ...result.data, reference };
  }

  async verifyPayment(reference: string) {
    if (isDevPaymentReference(reference)) {
      return { status: "success", reference, dev_mode: true };
    }

    this.ensurePaystackConfigured();

    const response = await fetch(`${PAYSTACK_BASE}/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    });
    const result = await response.json();
    if (!result.status) throw new AppError("Verification failed", 400);
    return result.data;
  }

  async initiateRefund(transactionId: string, amount: number, reason?: string) {
    this.ensurePaystackConfigured();

    const { data: rawTransaction, error } = await this.supabase
      .from("transactions")
      .select("*")
      .eq("id", transactionId)
      .single();

    const transaction = rawTransaction as { reference: string } | null;
    if (error || !transaction) throw new AppError("Transaction not found", 404);

    if (isDevPaymentReference(transaction.reference)) {
      throw new AppError("Refunds require Paystack to be configured", 503, "PAYSTACK_NOT_CONFIGURED");
    }

    const response = await fetch(`${PAYSTACK_BASE}/refund`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transaction: transaction.reference,
        amount: Math.round(amount * 100),
        merchant_note: reason,
      }),
    });

    const result = await response.json();
    if (!result.status) throw new AppError(result.message || "Refund failed", 400);

    const { error: refundError } = await this.supabase.from("refunds").insert({
      transaction_id: transactionId,
      amount,
      reason,
      status: "pending",
      paystack_reference: result.data?.transaction?.reference,
    } as never);
    if (refundError) {
      throw new AppError(
        `Paystack refund succeeded but the local refund record failed to save: ${refundError.message}`,
        500,
      );
    }

    return result.data;
  }
}
