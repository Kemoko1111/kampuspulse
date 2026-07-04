-- The transactions.type CHECK allowed only payment/refund/escrow/withdrawal/
-- top_up. Task escrow RELEASE credits the worker's wallet, which is a distinct
-- concept from a self-initiated top_up — add a 'payout' type so worker/rider
-- earnings are recorded and filterable correctly.
DO $$
DECLARE cname text;
BEGIN
  SELECT conname INTO cname
  FROM pg_constraint
  WHERE conrelid = 'public.transactions'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%type%payment%escrow%';
  IF cname IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.transactions DROP CONSTRAINT ' || quote_ident(cname);
  END IF;
END $$;

ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_type_check
  CHECK (type = ANY (ARRAY['payment','refund','escrow','withdrawal','top_up','payout']));
