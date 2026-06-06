-- Fix product listing RLS (run in Supabase SQL Editor)
-- Problem: seller_id references profiles.id, NOT auth.users.id.
-- Legacy policies using auth.uid() = seller_id always fail.

-- Remove legacy/wrong policies if present
DROP POLICY IF EXISTS "Sellers can manage their products" ON public.products;
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;

-- Harden helper used by other table policies
CREATE OR REPLACE FUNCTION public.get_profile_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id
  FROM public.profiles
  WHERE user_id = auth.uid()
    AND deleted_at IS NULL
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_profile_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_profile_id() TO anon;
GRANT EXECUTE ON FUNCTION public.get_profile_id() TO service_role;

-- SELECT: public active listings + sellers can see their own (incl. pending)
DROP POLICY IF EXISTS "products_select" ON public.products;
CREATE POLICY "products_select" ON public.products
  FOR SELECT
  USING (
    (status = 'active' AND deleted_at IS NULL)
    OR (
      auth.uid() IS NOT NULL
      AND seller_id IN (
        SELECT id FROM public.profiles
        WHERE user_id = auth.uid() AND deleted_at IS NULL
      )
    )
  );

-- INSERT: seller must own the profile row
DROP POLICY IF EXISTS "products_insert" ON public.products;
CREATE POLICY "products_insert" ON public.products
  FOR INSERT
  TO authenticated
  WITH CHECK (
    seller_id IN (
      SELECT id FROM public.profiles
      WHERE user_id = auth.uid() AND deleted_at IS NULL
    )
  );

-- UPDATE / DELETE: seller owns the listing
DROP POLICY IF EXISTS "products_update" ON public.products;
CREATE POLICY "products_update" ON public.products
  FOR UPDATE
  TO authenticated
  USING (
    seller_id IN (
      SELECT id FROM public.profiles
      WHERE user_id = auth.uid() AND deleted_at IS NULL
    )
  )
  WITH CHECK (
    seller_id IN (
      SELECT id FROM public.profiles
      WHERE user_id = auth.uid() AND deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "products_delete" ON public.products;
CREATE POLICY "products_delete" ON public.products
  FOR DELETE
  TO authenticated
  USING (
    seller_id IN (
      SELECT id FROM public.profiles
      WHERE user_id = auth.uid() AND deleted_at IS NULL
    )
  );
