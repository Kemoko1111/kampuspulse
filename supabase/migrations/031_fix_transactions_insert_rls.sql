-- CRITICAL: `transactions` has had RLS enabled (migration 009) with only a
-- SELECT policy since the table was created — no INSERT policy has ever
-- existed. Every payment path (PaymentService.initializePayment,
-- settleConfirmedPayment used by dev-mode and wallet payments) inserts into
-- `transactions` using the RLS-bound anon-key client, and that insert has
-- been silently rejected by Postgres RLS the entire time (the app code never
-- checks the insert's error). For real Paystack payments specifically, this
-- is catastrophic: no pending transaction row ever gets created, so the
-- webhook's idempotency guard (`UPDATE transactions ... WHERE reference = X
-- AND status != 'success'`) finds zero matching rows, treats every genuine
-- first-time delivery as a duplicate, and skips ALL fulfillment — order
-- confirmation, stock decrement, delivery dispatch, notifications, task
-- escrow, ride payment marking, and wallet top-up credit. A user could pay
-- real money via Paystack and their order/task/ride would never be marked
-- paid. Confirmed empirically against a local Supabase instance: an
-- authenticated user's insert attempt returned "new row violates row-level
-- security policy for table transactions" before this migration.
CREATE POLICY "transactions_insert" ON public.transactions
  FOR INSERT WITH CHECK (get_profile_id() = user_id);
