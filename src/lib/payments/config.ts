export function isPaystackConfigured(): boolean {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  return Boolean(
    secret &&
    !secret.includes("placeholder") &&
    !secret.startsWith("sk_test_your")
  );
}

export function isDevPaymentReference(reference: string): boolean {
  return reference.startsWith("CP_DEV_");
}
