-- 009: Row Level Security policies
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

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rider_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fcm_tokens ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Products
CREATE POLICY "products_select" ON public.products FOR SELECT USING (
  (status = 'active' AND deleted_at IS NULL)
  OR (
    auth.uid() IS NOT NULL
    AND seller_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid() AND deleted_at IS NULL
    )
  )
);
CREATE POLICY "products_insert" ON public.products FOR INSERT TO authenticated WITH CHECK (
  seller_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid() AND deleted_at IS NULL
  )
);
CREATE POLICY "products_update" ON public.products FOR UPDATE TO authenticated
  USING (
    seller_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid() AND deleted_at IS NULL
    )
  )
  WITH CHECK (
    seller_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid() AND deleted_at IS NULL
    )
  );
CREATE POLICY "products_delete" ON public.products FOR DELETE TO authenticated USING (
  seller_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid() AND deleted_at IS NULL
  )
);

-- Orders
CREATE POLICY "orders_select" ON public.orders FOR SELECT
  USING (get_profile_id() = buyer_id OR get_profile_id() = seller_id);
CREATE POLICY "orders_insert" ON public.orders FOR INSERT WITH CHECK (get_profile_id() = buyer_id);

-- Cart
CREATE POLICY "cart_select" ON public.cart_items FOR SELECT USING (get_profile_id() = user_id);
CREATE POLICY "cart_insert" ON public.cart_items FOR INSERT WITH CHECK (get_profile_id() = user_id);
CREATE POLICY "cart_update" ON public.cart_items FOR UPDATE USING (get_profile_id() = user_id);
CREATE POLICY "cart_delete" ON public.cart_items FOR DELETE USING (get_profile_id() = user_id);

-- Tasks
CREATE POLICY "tasks_select" ON public.tasks FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY "tasks_insert" ON public.tasks FOR INSERT WITH CHECK (get_profile_id() = poster_id);
CREATE POLICY "tasks_update" ON public.tasks FOR UPDATE USING (get_profile_id() = poster_id OR get_profile_id() = assignee_id);

-- Task applications
CREATE POLICY "task_apps_select" ON public.task_applications FOR SELECT USING (true);
CREATE POLICY "task_apps_insert" ON public.task_applications FOR INSERT WITH CHECK (get_profile_id() = applicant_id);

-- Rides
CREATE POLICY "rides_select" ON public.rides FOR SELECT
  USING (get_profile_id() = passenger_id OR get_profile_id() = rider_id);
CREATE POLICY "rides_insert" ON public.rides FOR INSERT WITH CHECK (get_profile_id() = passenger_id);
CREATE POLICY "rides_update" ON public.rides FOR UPDATE
  USING (get_profile_id() = passenger_id OR get_profile_id() = rider_id);

-- Deliveries
CREATE POLICY "deliveries_select" ON public.deliveries FOR SELECT
  USING (get_profile_id() = sender_id OR get_profile_id() = rider_id);
CREATE POLICY "deliveries_insert" ON public.deliveries FOR INSERT WITH CHECK (get_profile_id() = sender_id);

-- Messages
CREATE POLICY "messages_select" ON public.messages FOR SELECT
  USING (get_profile_id() = ANY(
    SELECT unnest(participants) FROM public.chat_rooms WHERE id = room_id
  ));
CREATE POLICY "messages_insert" ON public.messages FOR INSERT WITH CHECK (get_profile_id() = sender_id);

-- Notifications
CREATE POLICY "notifications_all" ON public.notifications FOR ALL USING (get_profile_id() = user_id);

-- Wallets
CREATE POLICY "wallets_select" ON public.wallets FOR SELECT USING (get_profile_id() = user_id);

-- Transactions
CREATE POLICY "transactions_select" ON public.transactions FOR SELECT USING (get_profile_id() = user_id);

-- FCM tokens
CREATE POLICY "fcm_tokens_all" ON public.fcm_tokens FOR ALL USING (get_profile_id() = profile_id);

-- Rider profiles
CREATE POLICY "rider_profiles_select" ON public.rider_profiles FOR SELECT USING (true);
CREATE POLICY "rider_profiles_update" ON public.rider_profiles FOR UPDATE USING (get_profile_id() = user_id);
