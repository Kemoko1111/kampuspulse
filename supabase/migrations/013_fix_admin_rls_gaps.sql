-- Fix "Admins can manage products" using profiles.id = auth.uid() (wrong: profiles.id
-- is its own generated UUID, not the auth user id — the FK to auth.users is profiles.user_id).
-- This made admin product moderation silently match zero rows for any product the admin
-- didn't personally own.
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;

CREATE POLICY "Admins can manage products"
  ON public.products FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- refunds has RLS enabled (set ad-hoc outside tracked migrations) but zero policies,
-- so the admin-only insert in PaymentService.initiateRefund() was being blocked while
-- the real Paystack refund still went through. Admins need full access; the paystack
-- webhook writes via the service-role client, which bypasses RLS entirely.
CREATE POLICY "refunds_admin_all"
  ON public.refunds FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
    )
  );
