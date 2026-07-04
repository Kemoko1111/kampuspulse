-- The ride-matching query (RideRepository.findAvailableRiders) only returns
-- riders with is_verified = true, but NOTHING in the app ever set that flag:
-- rider_profiles rows are created by ensureRiderProfile with just
-- {user_id, vehicle_type}, is_verified defaults to false, and the admin
-- riders route had no way to toggle it. Result: zero riders were ever
-- matchable, every ride stayed stuck on "searching" with no rider_id, and
-- the rider dashboard's realtime subscription (filtered on rider_id = me)
-- never fired — i.e. drivers could never receive any request.
--
-- This app has no rider document-verification pipeline, so gating on an
-- unsettable flag is pure breakage. Default new riders to verified (trusted)
-- and let admins REVOKE via the admin panel instead (see the is_verified
-- handling added to /api/admin/riders/[id]). Backfill the existing riders so
-- matching works immediately.

ALTER TABLE public.rider_profiles ALTER COLUMN is_verified SET DEFAULT true;

UPDATE public.rider_profiles SET is_verified = true WHERE is_verified IS DISTINCT FROM true;
