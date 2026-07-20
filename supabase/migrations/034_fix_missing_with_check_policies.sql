-- CRITICAL: 8 of the 9 `FOR ALL` RLS policies in this schema were written
-- with only a USING clause and no explicit WITH CHECK. Contrary to what
-- migration comments elsewhere in this codebase assumed ("USING serves as
-- WITH CHECK too when omitted"), that assumption does not hold in practice
-- for these policies — confirmed empirically against a local Supabase
-- instance: platform_settings_admin_write (USING-only, admin-gated) let a
-- plain `student`-role authenticated user overwrite platform_settings
-- (maintenance mode, auto-assign-riders, etc.) via a direct REST call,
-- completely bypassing the admin-only app UI/API. wishlists_own is the one
-- policy in the schema that already had an explicit WITH CHECK matching its
-- USING clause, and behaves correctly — that's the reference pattern this
-- migration applies to the other 8.
--
-- Affected: admin_logs, fcm_tokens, notification_broadcasts, notifications,
-- platform_settings, products ("Admins can manage products"), promotions,
-- refunds. Each WITH CHECK below is copied verbatim from that policy's own
-- existing USING clause — same authorization rule, just actually enforced
-- on writes now, not only on read/target-row visibility.
ALTER POLICY "admin_logs_admin_all" ON public.admin_logs
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin')
  );

ALTER POLICY "fcm_tokens_all" ON public.fcm_tokens
  WITH CHECK (get_profile_id() = profile_id);

ALTER POLICY "notification_broadcasts_admin_all" ON public.notification_broadcasts
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin')
  );

ALTER POLICY "notifications_all" ON public.notifications
  WITH CHECK (get_profile_id() = user_id);

ALTER POLICY "platform_settings_admin_write" ON public.platform_settings
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin')
  );

ALTER POLICY "Admins can manage products" ON public.products
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin')
  );

ALTER POLICY "promotions_admin_all" ON public.promotions
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin')
  );

ALTER POLICY "refunds_admin_all" ON public.refunds
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin')
  );
