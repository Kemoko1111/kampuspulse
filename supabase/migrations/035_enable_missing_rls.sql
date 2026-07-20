-- CRITICAL: 6 tables were CREATEd without ever calling `ALTER TABLE ...
-- ENABLE ROW LEVEL SECURITY` in any migration — `categories` is the 7th and
-- is intentionally left alone (public reference data by design). Any
-- policies that already existed for these tables (admin_logs_admin_all,
-- refunds_admin_all, platform_settings_*) were completely inert the entire
-- time; RLS enforcement itself was never switched on, so those policies
-- never actually restricted anything. Confirmed empirically against a local
-- Supabase instance: migration 017's own comment claims "platform_settings
-- has RLS enabled with zero policies" — that premise was false from the
-- start (migration 001, which creates the table, never enables RLS on it).
--
-- Practical impact of the two most severe: `audit_logs` (old/new data dumps
-- of every sensitive row change across the whole app, plus actor_id and
-- ip_address) and `admin_logs` (the admin action audit trail) were both
-- fully readable AND writable/forgeable by any authenticated (or anon,
-- depending on table grants) request directly against Supabase's REST API,
-- bypassing the app UI/API entirely — a serious information-disclosure and
-- audit-integrity gap. `refunds` (financial records) and `platform_settings`
-- (maintenance mode, auto-assign-riders, etc.) had the same exposure.
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- audit_logs never had a policy defined at all (on top of RLS never being
-- enabled) — the audit_log_trigger() function that writes to it is
-- SECURITY DEFINER, so it's unaffected by RLS; only reads need a policy.
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_logs_admin_select" ON public.audit_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin')
);

-- Lower severity (presence/typing booleans, not damaging if briefly
-- over-exposed) but fixed for completeness while already here. Presence and
-- typing status are meant to be visible broadly (any authenticated user can
-- see who's online / typing in a shared room), just not writable on
-- someone else's behalf.
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_presence_select" ON public.user_presence FOR SELECT TO authenticated USING (true);
CREATE POLICY "user_presence_own_write" ON public.user_presence FOR ALL
  USING (get_profile_id() = profile_id) WITH CHECK (get_profile_id() = profile_id);

ALTER TABLE public.typing_indicators ENABLE ROW LEVEL SECURITY;
CREATE POLICY "typing_indicators_select" ON public.typing_indicators FOR SELECT TO authenticated USING (true);
CREATE POLICY "typing_indicators_own_write" ON public.typing_indicators FOR ALL
  USING (get_profile_id() = profile_id) WITH CHECK (get_profile_id() = profile_id);
