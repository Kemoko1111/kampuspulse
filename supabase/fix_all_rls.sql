-- Run once in Supabase SQL Editor (all RLS fixes combined)

-- Public read for categories/stores
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "categories_public_read" ON public.categories;
DROP POLICY IF EXISTS "stores_public_read" ON public.stores;
CREATE POLICY "categories_public_read" ON public.categories FOR SELECT USING (true);
CREATE POLICY "stores_public_read" ON public.stores FOR SELECT USING (is_active = true);

-- Products
DROP POLICY IF EXISTS "Sellers can manage their products" ON public.products;
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;

CREATE OR REPLACE FUNCTION public.get_profile_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid() AND deleted_at IS NULL LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_profile_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_profile_id() TO anon;
GRANT EXECUTE ON FUNCTION public.get_profile_id() TO service_role;

DROP POLICY IF EXISTS "products_select" ON public.products;
CREATE POLICY "products_select" ON public.products FOR SELECT USING (
  (status = 'active' AND deleted_at IS NULL)
  OR (auth.uid() IS NOT NULL AND seller_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid() AND deleted_at IS NULL
  ))
);

DROP POLICY IF EXISTS "products_insert" ON public.products;
CREATE POLICY "products_insert" ON public.products FOR INSERT TO authenticated WITH CHECK (
  seller_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid() AND deleted_at IS NULL)
);

DROP POLICY IF EXISTS "products_update" ON public.products;
CREATE POLICY "products_update" ON public.products FOR UPDATE TO authenticated
  USING (seller_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid() AND deleted_at IS NULL))
  WITH CHECK (seller_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid() AND deleted_at IS NULL));

DROP POLICY IF EXISTS "products_delete" ON public.products;
CREATE POLICY "products_delete" ON public.products FOR DELETE TO authenticated USING (
  seller_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid() AND deleted_at IS NULL)
);

-- Tasks
DROP POLICY IF EXISTS "tasks_insert" ON public.tasks;
CREATE POLICY "tasks_insert" ON public.tasks FOR INSERT TO authenticated WITH CHECK (
  poster_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid() AND deleted_at IS NULL)
);

DROP POLICY IF EXISTS "tasks_update" ON public.tasks;
CREATE POLICY "tasks_update" ON public.tasks FOR UPDATE TO authenticated
  USING (
    poster_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid() AND deleted_at IS NULL)
    OR assignee_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid() AND deleted_at IS NULL)
  )
  WITH CHECK (
    poster_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid() AND deleted_at IS NULL)
    OR assignee_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid() AND deleted_at IS NULL)
  );

DROP POLICY IF EXISTS "task_apps_insert" ON public.task_applications;
CREATE POLICY "task_apps_insert" ON public.task_applications FOR INSERT TO authenticated WITH CHECK (
  applicant_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid() AND deleted_at IS NULL)
);

-- Orders & rides insert
DROP POLICY IF EXISTS "orders_insert" ON public.orders;
CREATE POLICY "orders_insert" ON public.orders FOR INSERT TO authenticated WITH CHECK (
  buyer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid() AND deleted_at IS NULL)
);

DROP POLICY IF EXISTS "rides_insert" ON public.rides;
CREATE POLICY "rides_insert" ON public.rides FOR INSERT TO authenticated WITH CHECK (
  passenger_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid() AND deleted_at IS NULL)
);
