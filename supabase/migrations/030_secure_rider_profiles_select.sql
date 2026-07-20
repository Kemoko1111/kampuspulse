-- rider_profiles_select was `USING (true)`, so any request using the anon-key
-- client (any logged-in user, or an unauthenticated route that forgot to gate
-- itself — see /api/rides/online-count) could read every rider's live GPS
-- coordinates, verification status, and vehicle info. Restrict reads to:
-- the rider's own row, a passenger/sender with an active ride or delivery
-- assigned to that rider, and admins. Aggregate views (e.g. "N riders
-- online") must go through createAdminClient(), which bypasses RLS by design.
DROP POLICY IF EXISTS "rider_profiles_select" ON public.rider_profiles;

CREATE POLICY "rider_profiles_select" ON public.rider_profiles FOR SELECT USING (
  get_profile_id() = user_id
  OR EXISTS (
    SELECT 1 FROM public.rides
    WHERE rides.rider_id = rider_profiles.user_id
      AND rides.passenger_id = get_profile_id()
      AND rides.status NOT IN ('completed', 'cancelled')
  )
  OR EXISTS (
    SELECT 1 FROM public.deliveries
    WHERE deliveries.rider_id = rider_profiles.user_id
      AND deliveries.sender_id = get_profile_id()
      AND deliveries.status NOT IN ('completed', 'cancelled')
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
  )
);
