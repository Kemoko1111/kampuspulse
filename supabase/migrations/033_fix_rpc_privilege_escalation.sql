-- CRITICAL: increment_wallet_balance / decrement_wallet_balance are
-- SECURITY DEFINER functions with NO caller-identity check inside their
-- body, and PostgreSQL grants EXECUTE on newly created functions to PUBLIC
-- by default — nothing in migrations 001-032 ever revoked that. Confirmed
-- empirically against a local Supabase instance: a completely
-- unauthenticated request (no login, just the app's own public anon API
-- key, which every Next.js app ships client-side in
-- NEXT_PUBLIC_SUPABASE_ANON_KEY) could call
-- POST /rest/v1/rpc/increment_wallet_balance with an arbitrary p_user_id and
-- p_amount and mint unlimited money into any wallet. This may be the most
-- severe finding of the entire audit.
--
-- The legitimate callers of these two functions span both the service-role
-- client (webhook credits, rider earnings, refunds — admin/system context,
-- no end-user session) AND the anon-key client acting on the CALLER'S OWN
-- wallet (wallet-balance checkout, wallet withdrawal's compensating
-- credit-back) — so EXECUTE can't just be revoked from `authenticated`
-- wholesale without breaking real flows. Instead, enforce ownership inside
-- the function itself: the service role bypasses (auth.role() =
-- 'service_role', no end-user session to check), everyone else may only
-- target their own wallet (p_user_id = get_profile_id()). An anonymous
-- (unauthenticated) caller has no profile at all, so get_profile_id() is
-- NULL and the check fails for any real p_user_id — closing the hole this
-- migration exists for.
CREATE OR REPLACE FUNCTION public.increment_wallet_balance(p_user_id UUID, p_amount NUMERIC)
RETURNS VOID AS $$
BEGIN
  IF auth.role() <> 'service_role' AND p_user_id IS DISTINCT FROM public.get_profile_id() THEN
    RAISE EXCEPTION 'Not authorized to modify this wallet';
  END IF;

  UPDATE public.wallets
  SET balance = balance + p_amount, updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.decrement_wallet_balance(p_user_id uuid, p_amount numeric)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_balance numeric;
BEGIN
  IF auth.role() <> 'service_role' AND p_user_id IS DISTINCT FROM public.get_profile_id() THEN
    RAISE EXCEPTION 'Not authorized to modify this wallet';
  END IF;

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

-- Defense in depth: also tighten the GRANTs themselves, not just the
-- in-function check — belt and suspenders. IMPORTANT: PostgreSQL's default
-- EXECUTE grant on a newly created function is to the PUBLIC pseudo-role,
-- which every role (anon/authenticated/service_role) implicitly rides on
-- regardless of any role-specific grant. `REVOKE ... FROM anon` alone does
-- NOT remove that — it has to be revoked FROM PUBLIC explicitly, confirmed
-- empirically (an initial version of this migration that only revoked from
-- `anon` left the function fully callable by anon anyway, via PUBLIC).
REVOKE EXECUTE ON FUNCTION public.increment_wallet_balance(uuid, numeric) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.decrement_wallet_balance(uuid, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_wallet_balance(uuid, numeric) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.decrement_wallet_balance(uuid, numeric) TO authenticated, service_role;

-- decrement_product_stock has the same missing-REVOKE issue, but no clean
-- per-call ownership check exists (the caller is the BUYER, not the
-- product's owner, so "caller = product owner" isn't the right rule either).
-- Partial mitigation: at minimum, block fully unauthenticated (anon) calls —
-- the highest-severity, zero-cost abuse case — while leaving it callable by
-- authenticated users, matching current real usage (dev-mode/wallet
-- checkout call this via the anon-key client). A complete fix would require
-- passing and validating an order context; tracked as a follow-up, not done
-- here.
REVOKE EXECUTE ON FUNCTION public.decrement_product_stock(uuid, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.decrement_product_stock(uuid, int) TO authenticated, service_role;
