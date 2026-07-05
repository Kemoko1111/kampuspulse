-- The delivery flow (DeliveryService, mirroring rides) moves a delivery
-- through 'en_route', but the deliveries.status CHECK didn't allow it — so
-- claiming/accepting a delivery hit a check-constraint violation and returned
-- 500. Widen the constraint to include en_route (and arrived, for symmetry
-- with rides) alongside the existing values.
DO $$
DECLARE cname text;
BEGIN
  SELECT conname INTO cname
  FROM pg_constraint
  WHERE conrelid = 'public.deliveries'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%status%searching%';
  IF cname IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.deliveries DROP CONSTRAINT ' || quote_ident(cname);
  END IF;
END $$;

ALTER TABLE public.deliveries
  ADD CONSTRAINT deliveries_status_check
  CHECK (status = ANY (ARRAY['searching','accepted','en_route','arrived','picked_up','in_transit','delivered','cancelled']));
