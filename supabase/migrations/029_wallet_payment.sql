-- Spend wallet balance at checkout. Atomic decrement that fails (returns
-- false) on insufficient funds instead of going negative — same pattern as
-- decrement_product_stock. p_user_id is the PROFILE id (wallets.user_id).
CREATE OR REPLACE FUNCTION public.decrement_wallet_balance(p_user_id uuid, p_amount numeric)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_balance numeric;
BEGIN
  SELECT balance INTO current_balance
  FROM public.wallets WHERE user_id = p_user_id FOR UPDATE;

  IF current_balance IS NULL OR current_balance < p_amount THEN
    RETURN FALSE;
  END IF;

  UPDATE public.wallets
  SET balance = balance - p_amount, updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN TRUE;
END;
$$;
