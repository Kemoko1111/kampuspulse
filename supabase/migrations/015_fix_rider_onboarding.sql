-- Neither the new-user signup trigger nor the admin "promote to rider" path
-- ever creates a rider_profiles row (both only touch profiles.role), and
-- there was no INSERT policy on rider_profiles at all, so a rider's first
-- "go online" or location update always failed. The application-code fix
-- (RideRepository.ensureRiderProfile) needs this policy to actually work.
CREATE POLICY "rider_profiles_insert"
  ON public.rider_profiles FOR INSERT
  WITH CHECK (get_profile_id() = user_id);

-- Backfill the riders already stuck without a row.
INSERT INTO public.rider_profiles (user_id, vehicle_type)
SELECT p.id, 'motorbike'
FROM public.profiles p
WHERE p.role = 'rider'
  AND NOT EXISTS (SELECT 1 FROM public.rider_profiles rp WHERE rp.user_id = p.id);
