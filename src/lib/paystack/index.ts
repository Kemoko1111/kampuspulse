/**
 * KampusPulse – Paystack Ghana Integration
 * Supports: MTN Mobile Money, Telecel Cash, AirtelTigo Money
 */

export type PaystackCurrency = "GHS";

export type MobileMoneyProvider = "mtn" | "vod" | "tgo"; // MTN, Telecel, AirtelTigo

export interface PaystackInitParams {
  email: string;
  amount: number; // in pesewas (GHS * 100)
  currency: PaystackCurrency;
  reference: string;
  callback_url?: string;
  metadata?: Record<string, unknown>;
  channels?: string[];
  mobile_money?: {
    phone: string;
    provider: MobileMoneyProvider;
  };
}

export interface PaystackResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url?: string;
    access_code?: string;
    reference: string;
  };
}

export interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    status: "success" | "failed" | "abandoned";
    reference: string;
    amount: number;
    currency: string;
    paid_at: string;
    channel: string;
    customer: { email: string };
  };
}

/**
 * Generate a unique payment reference
 */
export function generatePaymentReference(prefix = "CP"): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Convert GHS to pesewas (Paystack uses smallest currency unit)
 */
export function ghsToPesewas(ghs: number): number {
  return Math.round(ghs * 100);
}

/**
 * Initialize a Paystack transaction via API
 * Call this from a Server Action or API Route
 */
export async function initializePaystackTransaction(
  params: PaystackInitParams
): Promise<PaystackResponse> {
  const response = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...params,
      amount: ghsToPesewas(params.amount),
    }),
  });

  if (!response.ok) {
    throw new Error(`Paystack API error: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Verify a Paystack transaction
 * Always verify server-side before fulfilling orders
 */
export async function verifyPaystackTransaction(
  reference: string
): Promise<PaystackVerifyResponse> {
  const response = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Paystack verify error: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Mobile Money payment helper
 * Maps UI provider names to Paystack provider codes
 */
export const momoProviderMap: Record<string, MobileMoneyProvider> = {
  mtn: "mtn",
  telecel: "vod",
  airteltigo: "tgo",
};

/**
 * Format a phone number for Paystack (strip spaces, ensure country code)
 */
export function formatGhanaPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) return "233" + digits.slice(1);
  if (digits.startsWith("233")) return digits;
  return "233" + digits;
}

/**
 * Client-side Paystack inline payment
 * Usage: import this in a client component
 */
export function openPaystackInline({
  email,
  amount,
  reference,
  onSuccess,
  onClose,
}: {
  email: string;
  amount: number;
  reference: string;
  onSuccess: (reference: string) => void;
  onClose: () => void;
}) {
  if (typeof window === "undefined") return;

  const handler = (window as any).PaystackPop?.setup({
    key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
    email,
    amount: ghsToPesewas(amount),
    currency: "GHS",
    ref: reference,
    channels: ["mobile_money"],
    callback: (response: { reference: string }) => {
      onSuccess(response.reference);
    },
    onClose,
  });

  handler?.openIframe();
}
