-- admin_logs has RLS enabled with zero policies, so every admin_logs insert
-- across the admin panel (products, users, riders, orders, reviews routes —
-- all fire-and-forget, error not checked) has been silently rejected by RLS
-- this whole time. Also blocks the new DELETE /api/admin/logs ("Clear All
-- Logs") from working. Admin-only table, so one full-access policy covers it.
CREATE POLICY "admin_logs_admin_all"
  ON public.admin_logs FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin')
  );
