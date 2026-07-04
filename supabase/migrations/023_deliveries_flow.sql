-- The deliveries flow was inert: POST /api/deliveries created a row at
-- status 'searching' but never matched a rider, deliveries had no UPDATE RLS
-- policy (so a rider couldn't progress one), and the table wasn't in the
-- realtime publication (so neither the driver nor the sender could get live
-- updates). This adds the two DB-level pieces; matching + status transitions
-- + notifications are added in application code (DeliveryService).

-- Let the sender or the assigned rider update the delivery (status changes).
CREATE POLICY "deliveries_update"
  ON public.deliveries FOR UPDATE
  USING (
    get_profile_id() = sender_id OR get_profile_id() = rider_id
  );

-- Live updates for the driver dashboard (new assignment) and the sender's
-- tracking view (status + rider location changes).
ALTER PUBLICATION supabase_realtime ADD TABLE public.deliveries;
