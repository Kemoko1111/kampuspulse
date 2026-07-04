-- Broadcast matching: instead of auto-assigning a ride/delivery to the single
-- nearest rider (so only they saw it), a request stays 'searching' with
-- rider_id NULL and EVERY online rider can see and claim it (first tap wins).
-- Realtime respects RLS, so verified riders need SELECT visibility of
-- unassigned searching requests to receive the broadcast. The atomic claim
-- itself is done server-side with the service-role client (WHERE rider_id IS
-- NULL AND status='searching'), so no extra UPDATE policy is required here.

CREATE POLICY "rides_select_searching_for_riders"
  ON public.rides FOR SELECT
  USING (
    status = 'searching' AND rider_id IS NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid() AND profiles.role IN ('rider', 'admin')
    )
  );

CREATE POLICY "deliveries_select_searching_for_riders"
  ON public.deliveries FOR SELECT
  USING (
    status = 'searching' AND rider_id IS NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid() AND profiles.role IN ('rider', 'admin')
    )
  );
