import type { TypedSupabaseClient } from "@/lib/supabase/types";
import { AppError } from "@/lib/errors/app-error";
import { isDevPaymentReference, isPaystackConfigured } from "@/lib/payments/config";

const PAYSTACK_BASE = "https://api.paystack.co";

interface InitializePaymentParams {
  amount: number;
  email: string;
  profileId: string;
  orderId?: string;
  taskId?: string;
  rideId?: string;
  paymentMethod?: string;
  phone?: string;
}

export class PaymentService {
  constructor(private supabase: TypedSupabaseClient) {}

  private ensurePaystackConfigured() {
    if (!isPaystackConfigured()) {
      throw new AppError(
        "Paystack is not configured. Add your test keys from dashboard.paystack.com to .env.local",
        503,
        "PAYSTACK_NOT_CONFIGURED"
      );
    }
  }

  private async completeDevPayment(params: InitializePaymentParams) {
    const reference = `CP_DEV_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    await this.supabase.from("transactions").insert({
      user_id: params.profileId,
      type: params.taskId ? "escrow" : "payment",
      amount: params.amount,
      payment_method: params.paymentMethod || "mtn_momo",
      reference,
      status: "success",
      description: params.orderId
        ? `Order payment ${params.orderId} (dev)`
        : params.taskId
        ? `Task escrow ${params.taskId} (dev)`
        : `Ride payment ${params.rideId} (dev)`,
      metadata: { order_id: params.orderId, task_id: params.taskId, ride_id: params.rideId, dev_mode: true },
    } as never);

    if (params.orderId) {
      await this.supabase
        .from("orders")
        .update({
          payment_status: "paid",
          status: "confirmed",
          payment_reference: reference,
        } as never)
        .eq("id", params.orderId);
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

    return {
      reference,
      dev_mode: true,
      redirect_url: params.orderId
        ? "/edwom/orders"
        : params.taskId
        ? `/y3adwuma/task/${params.taskId}`
        : params.rideId
        ? `/ezzyride/track/${params.rideId}`
        : "/home",
    };
  }

  async initializePayment(params: InitializePaymentParams) {
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
      metadata: { order_id: params.orderId, task_id: params.taskId, ride_id: params.rideId },
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

    await this.supabase.from("refunds").insert({
      transaction_id: transactionId,
      amount,
      reason,
      status: "pending",
      paystack_reference: result.data?.transaction?.reference,
    } as never);

    return result.data;
  }
}
