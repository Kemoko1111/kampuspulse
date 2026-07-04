-- platform_settings has RLS enabled with zero policies, which silently
-- blocks every read via the regular (non-service-role) client. The existing
-- delivery-fare lookup in api/deliveries/route.ts already reads this table
-- via the regular client and falls back to a hardcoded default on failure —
-- the fallback happens to match the configured value exactly, which is what
-- hid this: the admin's configured fare has never actually been read from
-- the DB by that code path. Adding real policies fixes that silently, and
-- is also required for the new admin settings page (reads/writes an
-- "app_settings" key) to work at all.
CREATE POLICY "platform_settings_select"
  ON public.platform_settings FOR SELECT
  USING (true);

CREATE POLICY "platform_settings_admin_write"
  ON public.platform_settings FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin')
  );
