-- GENERATED FILE — do not hand-edit.
-- Produced by scripts/build-full-setup.sh, which concatenates
-- supabase/migrations/*.sql in order. Run this in the Supabase SQL
-- editor for a brand-new project. To update it after adding a new
-- migration, re-run: ./scripts/build-full-setup.sh

-- ===== 001_extensions_and_profiles.sql =====
-- 001: Extensions and profiles
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

CREATE TABLE public.profiles (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name         TEXT,
  avatar_url        TEXT,
  bio               TEXT,
  phone             TEXT,
  location          TEXT,
  hall_of_residence TEXT,
  department        TEXT,
  year_of_study     INT CHECK (year_of_study BETWEEN 1 AND 6),
  student_id        TEXT,
  role              TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student','vendor','rider','admin')),
  status            TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','pending','banned')),
  is_verified       BOOLEAN DEFAULT FALSE,
  rating            NUMERIC(3,2) DEFAULT 0.0,
  total_reviews     INT DEFAULT 0,
  deleted_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX profiles_user_id_idx ON public.profiles(user_id);
CREATE INDEX profiles_role_idx ON public.profiles(role);
CREATE INDEX profiles_deleted_at_idx ON public.profiles(deleted_at) WHERE deleted_at IS NULL;

CREATE TABLE public.platform_settings (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.platform_settings (key, value) VALUES
  ('ride_fare', '{"base_fare": 5, "per_km_rate": 2.5, "per_min_rate": 0.5}'),
  ('delivery_fare', '{"base_fare": 8, "per_km_rate": 3, "per_min_rate": 0.75}');

-- ===== 002_stores_categories_products.sql =====
-- 002: Stores, categories, products
CREATE TABLE public.stores (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id      UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  description   TEXT,
  logo_url      TEXT,
  banner_url    TEXT,
  location      TEXT,
  phone         TEXT,
  email         TEXT,
  is_verified   BOOLEAN DEFAULT FALSE,
  is_active     BOOLEAN DEFAULT TRUE,
  rating        NUMERIC(3,2) DEFAULT 0.0,
  total_sales   INT DEFAULT 0,
  deleted_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.categories (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  description   TEXT,
  image_url     TEXT,
  parent_id     UUID REFERENCES public.categories(id),
  sort_order    INT DEFAULT 0,
  is_active     BOOLEAN DEFAULT TRUE
);

INSERT INTO public.categories (name, slug, sort_order) VALUES
  ('Electronics', 'electronics', 1),
  ('Fashion', 'fashion', 2),
  ('Books & Stationery', 'books', 3),
  ('Food & Groceries', 'food', 4),
  ('Health & Beauty', 'beauty', 5),
  ('Hostel Essentials', 'hostel', 6),
  ('Furniture', 'furniture', 7),
  ('Tech Accessories', 'tech-accessories', 8),
  ('Kotokuraba Market', 'kotokuraba', 9),
  ('Abura Market', 'abura', 10),
  ('Science Market', 'science-market', 11);

CREATE TABLE public.products (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id       UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  store_id        UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  category_id     UUID REFERENCES public.categories(id),
  title           TEXT NOT NULL,
  description     TEXT,
  price           NUMERIC(10,2) NOT NULL CHECK (price > 0),
  original_price  NUMERIC(10,2),
  condition       TEXT NOT NULL DEFAULT 'new' CHECK (condition IN ('new','like_new','good','fair','poor')),
  images          TEXT[] DEFAULT '{}',
  tags            TEXT[] DEFAULT '{}',
  location        TEXT,
  stock_quantity  INT NOT NULL DEFAULT 1,
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','sold','pending','rejected')),
  views           INT DEFAULT 0,
  rating          NUMERIC(3,2) DEFAULT 0.0,
  total_reviews   INT DEFAULT 0,
  is_featured     BOOLEAN DEFAULT FALSE,
  deleted_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX products_seller_idx ON public.products(seller_id);
CREATE INDEX products_category_idx ON public.products(category_id);
CREATE INDEX products_status_idx ON public.products(status);
CREATE INDEX products_deleted_at_idx ON public.products(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX products_search_idx ON public.products USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- ===== 003_orders_cart.sql =====
-- 003: Orders and cart
CREATE TABLE public.orders (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id          UUID REFERENCES public.profiles(id) NOT NULL,
  seller_id         UUID REFERENCES public.profiles(id) NOT NULL,
  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','confirmed','processing','shipped','delivered','cancelled','refunded')),
  total_amount      NUMERIC(10,2) NOT NULL,
  delivery_fee      NUMERIC(10,2) DEFAULT 0,
  payment_method    TEXT,
  payment_status    TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','failed','refunded')),
  payment_reference TEXT,
  delivery_address  TEXT,
  notes             TEXT,
  deleted_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.order_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id    UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id  UUID REFERENCES public.products(id) NOT NULL,
  quantity    INT NOT NULL DEFAULT 1,
  unit_price  NUMERIC(10,2) NOT NULL,
  total_price NUMERIC(10,2) NOT NULL
);

CREATE TABLE public.cart_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  product_id  UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  quantity    INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX orders_buyer_idx ON public.orders(buyer_id);
CREATE INDEX orders_seller_idx ON public.orders(seller_id);
CREATE INDEX cart_items_user_idx ON public.cart_items(user_id);

-- ===== 004_tasks.sql =====
-- 004: Tasks (Y3 Adwuma)
CREATE TABLE public.tasks (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poster_id        UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  assignee_id      UUID REFERENCES public.profiles(id),
  title            TEXT NOT NULL,
  description      TEXT NOT NULL,
  category         TEXT NOT NULL CHECK (category IN ('academic','delivery','printing','food','laundry','tech','design','event','other')),
  reward           NUMERIC(10,2) NOT NULL CHECK (reward >= 5),
  deadline         TIMESTAMPTZ NOT NULL,
  location         TEXT,
  status           TEXT NOT NULL DEFAULT 'open'
                   CHECK (status IN ('open','assigned','in_progress','completed','cancelled','disputed')),
  images           TEXT[] DEFAULT '{}',
  is_urgent        BOOLEAN DEFAULT FALSE,
  total_applicants INT DEFAULT 0,
  payment_reference TEXT,
  payment_status   TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','failed','refunded','escrowed')),
  deleted_at       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.task_applications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id         UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  applicant_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  cover_message   TEXT,
  proposed_price  NUMERIC(10,2),
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','withdrawn')),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(task_id, applicant_id)
);

CREATE INDEX tasks_poster_idx ON public.tasks(poster_id);
CREATE INDEX tasks_status_idx ON public.tasks(status);
CREATE INDEX task_applications_task_idx ON public.task_applications(task_id);

-- ===== 005_rides_deliveries.sql =====
-- 005: Rides and deliveries (EzzyRide)
CREATE TABLE public.rides (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  passenger_id          UUID REFERENCES public.profiles(id) NOT NULL,
  rider_id              UUID REFERENCES public.profiles(id),
  pickup_address        TEXT NOT NULL,
  pickup_lat            NUMERIC(10,6),
  pickup_lng            NUMERIC(10,6),
  destination_address   TEXT NOT NULL,
  destination_lat       NUMERIC(10,6),
  destination_lng       NUMERIC(10,6),
  estimated_fare        NUMERIC(10,2),
  actual_fare           NUMERIC(10,2),
  distance_km           NUMERIC(6,2),
  duration_minutes      INT,
  status                TEXT NOT NULL DEFAULT 'searching'
                        CHECK (status IN ('searching','accepted','en_route','arrived','in_progress','completed','cancelled')),
  payment_method        TEXT,
  payment_status        TEXT DEFAULT 'pending',
  payment_reference     TEXT,
  rating                NUMERIC(3,2),
  notes                 TEXT,
  deleted_at            TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.deliveries (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id             UUID REFERENCES public.profiles(id) NOT NULL,
  rider_id              UUID REFERENCES public.profiles(id),
  delivery_type         TEXT NOT NULL CHECK (delivery_type IN ('food','package','marketplace','document','student_to_student')),
  pickup_address        TEXT NOT NULL,
  pickup_lat            NUMERIC(10,6),
  pickup_lng              NUMERIC(10,6),
  delivery_address      TEXT NOT NULL,
  delivery_lat          NUMERIC(10,6),
  delivery_lng          NUMERIC(10,6),
  package_description   TEXT,
  package_size          TEXT DEFAULT 'small' CHECK (package_size IN ('small','medium','large')),
  estimated_fee         NUMERIC(10,2),
  actual_fee            NUMERIC(10,2),
  distance_km           NUMERIC(6,2),
  status                TEXT NOT NULL DEFAULT 'searching'
                        CHECK (status IN ('searching','accepted','picked_up','in_transit','delivered','cancelled')),
  tracking_code         TEXT UNIQUE,
  payment_method        TEXT,
  payment_status        TEXT DEFAULT 'pending',
  payment_reference     TEXT,
  special_instructions  TEXT,
  deleted_at            TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.rider_profiles (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  vehicle_type     TEXT NOT NULL CHECK (vehicle_type IN ('bicycle','motorbike','car')),
  vehicle_number   TEXT,
  license_number   TEXT,
  document_urls    TEXT[] DEFAULT '{}',
  is_verified      BOOLEAN DEFAULT FALSE,
  is_available     BOOLEAN DEFAULT FALSE,
  current_lat      NUMERIC(10,6),
  current_lng      NUMERIC(10,6),
  rating           NUMERIC(3,2) DEFAULT 0.0,
  total_trips      INT DEFAULT 0,
  total_deliveries INT DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX rides_passenger_idx ON public.rides(passenger_id);
CREATE INDEX rides_rider_idx ON public.rides(rider_id);
CREATE INDEX rides_status_idx ON public.rides(status);
CREATE INDEX deliveries_sender_idx ON public.deliveries(sender_id);
CREATE INDEX rider_profiles_available_idx ON public.rider_profiles(is_available) WHERE is_available = true;

-- ===== 006_chat_messages.sql =====
-- 006: Chat and messages
CREATE TABLE public.chat_rooms (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participants    UUID[] NOT NULL,
  last_message_at TIMESTAMPTZ,
  is_group        BOOLEAN DEFAULT FALSE,
  group_name      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.messages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id     UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE NOT NULL,
  sender_id   UUID REFERENCES public.profiles(id) NOT NULL,
  content     TEXT NOT NULL,
  type        TEXT DEFAULT 'text' CHECK (type IN ('text','image','file','system')),
  file_url    TEXT,
  is_read     BOOLEAN DEFAULT FALSE,
  deleted_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.typing_indicators (
  room_id     UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE NOT NULL,
  profile_id  UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  is_typing   BOOLEAN DEFAULT FALSE,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (room_id, profile_id)
);

CREATE TABLE public.user_presence (
  profile_id  UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_online   BOOLEAN DEFAULT FALSE,
  last_seen   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX messages_room_idx ON public.messages(room_id, created_at DESC);

-- ===== 007_payments_wallets.sql =====
-- 007: Payments and wallets
CREATE TABLE public.wallets (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  balance     NUMERIC(12,2) DEFAULT 0.00,
  currency    TEXT DEFAULT 'GHS',
  is_locked   BOOLEAN DEFAULT FALSE,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.transactions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES public.profiles(id) NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('payment','refund','escrow','withdrawal','top_up')),
  amount          NUMERIC(10,2) NOT NULL,
  currency        TEXT DEFAULT 'GHS',
  payment_method  TEXT CHECK (payment_method IN ('mtn_momo','telecel','airteltigo','card','wallet')),
  reference       TEXT UNIQUE NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','success','failed','reversed')),
  description     TEXT,
  metadata        JSONB,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.refunds (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id        UUID REFERENCES public.transactions(id) NOT NULL,
  amount                NUMERIC(10,2) NOT NULL,
  reason                TEXT,
  status                TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processed','failed')),
  paystack_reference    TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.reviews (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reviewer_id           UUID REFERENCES public.profiles(id) NOT NULL,
  reviewed_id           UUID REFERENCES public.profiles(id) NOT NULL,
  type                  TEXT NOT NULL CHECK (type IN ('product','vendor','task_worker','rider','delivery')),
  reference_id          UUID NOT NULL,
  rating                INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment               TEXT,
  is_verified_purchase  BOOLEAN DEFAULT FALSE,
  is_hidden             BOOLEAN DEFAULT FALSE,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX transactions_user_idx ON public.transactions(user_id);
CREATE INDEX transactions_reference_idx ON public.transactions(reference);

-- ===== 008_notifications_audit.sql =====
-- 008: Notifications, audit logs, FCM tokens
CREATE TABLE public.notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type        TEXT NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  data        JSONB,
  is_read     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX notifications_user_idx ON public.notifications(user_id, is_read, created_at DESC);

CREATE TABLE public.fcm_tokens (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id  UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  token       TEXT NOT NULL,
  device_info TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, token)
);

CREATE TABLE public.admin_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id        UUID REFERENCES public.profiles(id) NOT NULL,
  action          TEXT NOT NULL,
  resource_type   TEXT NOT NULL,
  resource_id     UUID,
  old_data        JSONB,
  new_data        JSONB,
  ip_address      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name  TEXT NOT NULL,
  record_id   UUID NOT NULL,
  action      TEXT NOT NULL CHECK (action IN ('INSERT','UPDATE','DELETE')),
  old_data    JSONB,
  new_data    JSONB,
  actor_id    UUID REFERENCES public.profiles(id),
  ip_address  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX audit_logs_table_idx ON public.audit_logs(table_name, record_id);
CREATE INDEX audit_logs_actor_idx ON public.audit_logs(actor_id);

-- ===== 009_rls_policies.sql =====
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

-- ===== 010_functions_triggers.sql =====
-- 010: Functions and triggers
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_profile_id UUID;
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name')
  RETURNING id INTO new_profile_id;

  INSERT INTO public.wallets (user_id) VALUES (new_profile_id);
  INSERT INTO public.user_presence (profile_id) VALUES (new_profile_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.update_task_applicant_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.tasks
  SET total_applicants = (
    SELECT COUNT(*) FROM public.task_applications
    WHERE task_id = COALESCE(NEW.task_id, OLD.task_id) AND status = 'pending'
  )
  WHERE id = COALESCE(NEW.task_id, OLD.task_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.increment_wallet_balance(p_user_id UUID, p_amount NUMERIC)
RETURNS VOID AS $$
BEGIN
  UPDATE public.wallets
  SET balance = balance + p_amount, updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.decrement_product_stock(p_product_id UUID, p_quantity INT)
RETURNS BOOLEAN AS $$
DECLARE
  current_stock INT;
BEGIN
  SELECT stock_quantity INTO current_stock
  FROM public.products WHERE id = p_product_id FOR UPDATE;

  IF current_stock < p_quantity THEN
    RETURN FALSE;
  END IF;

  UPDATE public.products
  SET stock_quantity = stock_quantity - p_quantity,
      status = CASE WHEN stock_quantity - p_quantity <= 0 THEN 'sold' ELSE status END
  WHERE id = p_product_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.audit_log_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (table_name, record_id, action, new_data, actor_id)
    VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', to_jsonb(NEW), public.get_profile_id());
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (table_name, record_id, action, old_data, new_data, actor_id)
    VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), public.get_profile_id());
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (table_name, record_id, action, old_data, actor_id)
    VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', to_jsonb(OLD), public.get_profile_id());
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

CREATE TRIGGER on_task_application
  AFTER INSERT OR DELETE ON public.task_applications
  FOR EACH ROW EXECUTE PROCEDURE public.update_task_applicant_count();

CREATE TRIGGER set_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
CREATE TRIGGER set_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
CREATE TRIGGER set_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
CREATE TRIGGER set_rides_updated_at BEFORE UPDATE ON public.rides FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
CREATE TRIGGER set_cart_updated_at BEFORE UPDATE ON public.cart_items FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE TRIGGER audit_orders AFTER INSERT OR UPDATE OR DELETE ON public.orders FOR EACH ROW EXECUTE PROCEDURE public.audit_log_trigger();
CREATE TRIGGER audit_tasks AFTER INSERT OR UPDATE OR DELETE ON public.tasks FOR EACH ROW EXECUTE PROCEDURE public.audit_log_trigger();
CREATE TRIGGER audit_rides AFTER INSERT OR UPDATE OR DELETE ON public.rides FOR EACH ROW EXECUTE PROCEDURE public.audit_log_trigger();

-- ===== 011_storage_buckets.sql =====
-- 011: Storage buckets and policies
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg','image/png','image/webp']),
  ('product-images', 'product-images', true, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('store-banners', 'store-banners', true, 5242880, ARRAY['image/jpeg','image/png','image/webp']),
  ('rider-documents', 'rider-documents', false, 10485760, ARRAY['image/jpeg','image/png','image/webp','application/pdf']),
  ('task-attachments', 'task-attachments', false, 10485760, ARRAY['image/jpeg','image/png','image/webp','application/pdf'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "avatars_upload" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "avatars_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "product_images_upload" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "product_images_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "store_banners_upload" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'store-banners' AND auth.uid() IS NOT NULL);

CREATE POLICY "store_banners_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'store-banners');

CREATE POLICY "rider_docs_upload" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'rider-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "rider_docs_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'rider-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "task_attachments_upload" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'task-attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "task_attachments_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'task-attachments' AND auth.uid() IS NOT NULL);

-- ===== 012_kampuspulse_refactor.sql =====
-- Reassign existing vendors to student role
UPDATE public.profiles SET role = 'student' WHERE role = 'vendor';

-- Update profiles role constraint to remove 'vendor'
ALTER TABLE public.profiles DROP CONSTRAINT profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('student','rider','admin'));

-- Delete vendor reviews
DELETE FROM public.reviews WHERE type = 'vendor';

-- Update reviews type constraint to remove 'vendor'
ALTER TABLE public.reviews DROP CONSTRAINT reviews_type_check;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_type_check CHECK (type IN ('product','task_worker','rider','delivery'));

-- Drop existing product policies
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;
DROP POLICY IF EXISTS "Sellers can manage their products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;

-- Create new product policies
CREATE POLICY "Products are viewable by everyone"
  ON public.products FOR SELECT USING (status = 'active');

CREATE POLICY "Admins can manage products"
  ON public.products FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Alter products to drop store_id
ALTER TABLE public.products DROP COLUMN IF EXISTS store_id CASCADE;

-- Drop stores table completely
DROP TABLE IF EXISTS public.stores CASCADE;

-- ===== 013_fix_admin_rls_gaps.sql =====
-- Fix "Admins can manage products" using profiles.id = auth.uid() (wrong: profiles.id
-- is its own generated UUID, not the auth user id — the FK to auth.users is profiles.user_id).
-- This made admin product moderation silently match zero rows for any product the admin
-- didn't personally own.
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;

CREATE POLICY "Admins can manage products"
  ON public.products FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- refunds has RLS enabled (set ad-hoc outside tracked migrations) but zero policies,
-- so the admin-only insert in PaymentService.initiateRefund() was being blocked while
-- the real Paystack refund still went through. Admins need full access; the paystack
-- webhook writes via the service-role client, which bypasses RLS entirely.
CREATE POLICY "refunds_admin_all"
  ON public.refunds FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- ===== 014_fix_admin_self_demotion.sql =====
-- prevent_profile_privilege_escalation previously let an admin change ANY
-- field on their own profile row unconditionally (the `is_admin` check didn't
-- distinguish self-updates from an admin managing someone else's account).
-- Combined with auth-context.tsx's metadata-role sync (which re-applies the
-- role picked at original signup on every login), this silently demoted the
-- one admin account back to "student" on login, since the trigger's own
-- permissive self-service rule let the change through. Fixed in the app code
-- (auth-context.tsx now skips the sync entirely for admins) and here, as a
-- second layer: self-updates are now restricted to the original one-time
-- onboarding transition regardless of admin status; only admins acting on
-- SOMEONE ELSE's row (the real admin-panel user-management feature) keep the
-- unrestricted bypass.
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  is_admin boolean;
  is_self boolean;
begin
  if new.role is not distinct from old.role and new.status is not distinct from old.status then
    return new;
  end if;

  if auth.uid() is null then
    return new;
  end if;

  is_self := (old.user_id = auth.uid());

  select exists (
    select 1 from public.profiles p where p.user_id = auth.uid() and p.role = 'admin'
  ) into is_admin;

  if is_admin and not is_self then
    return new;
  end if;

  if old.role = 'student' and old.status = 'active'
     and new.role in ('student', 'rider')
     and new.status in ('active', 'pending') then
    return new;
  end if;

  raise exception 'Only an admin can change role or status after initial signup';
end;
$function$

-- ===== 015_fix_rider_onboarding.sql =====
-- Neither the new-user signup trigger nor the admin "promote to rider" path
-- ever creates a rider_profiles row (both only touch profiles.role), and
-- there was no INSERT policy on rider_profiles at all, so a rider's first
-- "go online" or location update always failed. The application-code fix
-- (RideRepository.ensureRiderProfile) needs this policy to actually work.
CREATE POLICY "rider_profiles_insert"
  ON public.rider_profiles FOR INSERT
  WITH CHECK (get_profile_id() = user_id);

-- Backfill the riders already stuck without a row.
INSERT INTO public.rider_profiles (user_id, vehicle_type)
SELECT p.id, 'motorbike'
FROM public.profiles p
WHERE p.role = 'rider'
  AND NOT EXISTS (SELECT 1 FROM public.rider_profiles rp WHERE rp.user_id = p.id);

-- ===== 016_promotions_table.sql =====
-- The admin promotions UI/API (src/app/admin/promotions/page.tsx,
-- src/app/api/admin/promotions/route.ts) is fully built against a
-- `promotions` table that was never actually created — the route
-- explicitly special-cases Postgres error 42P01 ("relation does not
-- exist") because of it. Creating it now with the exact columns the
-- existing code already reads/writes.
CREATE TABLE public.promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC NOT NULL CHECK (discount_value > 0),
  min_order_amount NUMERIC NOT NULL DEFAULT 0,
  max_uses INTEGER,
  current_uses INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "promotions_admin_all"
  ON public.promotions FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin')
  );

-- Public read access to currently-valid promos, needed for cart/checkout
-- code validation (a real /api/promotions/validate endpoint, not yet built,
-- will rely on this instead of the current hardcoded "CAMPUS10" check).
CREATE POLICY "promotions_select_active"
  ON public.promotions FOR SELECT USING (
    status = 'active' AND (expires_at IS NULL OR expires_at > NOW())
  );

-- ===== 017_platform_settings_rls.sql =====
-- platform_settings has RLS enabled with zero policies, which silently
-- blocks every read via the regular (non-service-role) client. The existing
-- delivery-fare lookup in api/deliveries/route.ts already reads this table
-- via the regular client and falls back to a hardcoded default on failure —
-- the fallback happens to match the configured value exactly, which is what
-- hid this: the admin's configured fare has never actually been read from
-- the DB by that code path. Adding real policies fixes that silently, and
-- is also required for the new admin settings page (reads/writes an
-- "app_settings" key) to work at all.
CREATE POLICY "platform_settings_select"
  ON public.platform_settings FOR SELECT
  USING (true);

CREATE POLICY "platform_settings_admin_write"
  ON public.platform_settings FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin')
  );

-- ===== 018_admin_logs_rls.sql =====
-- admin_logs has RLS enabled with zero policies, so every admin_logs insert
-- across the admin panel (products, users, riders, orders, reviews routes —
-- all fire-and-forget, error not checked) has been silently rejected by RLS
-- this whole time. Also blocks the new DELETE /api/admin/logs ("Clear All
-- Logs") from working. Admin-only table, so one full-access policy covers it.
CREATE POLICY "admin_logs_admin_all"
  ON public.admin_logs FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin')
  );

-- ===== 019_wishlist_and_broadcasts.sql =====
-- Wishlist "heart" toggle in EDWOM (src/app/edwom/page.tsx,
-- src/app/edwom/product/[id]/page.tsx) only flips local component state —
-- nothing persists it. Adding real storage.
CREATE TABLE public.wishlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, product_id)
);

ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wishlists_own"
  ON public.wishlists FOR ALL
  USING (get_profile_id() = user_id)
  WITH CHECK (get_profile_id() = user_id);

-- Admin notification broadcasts (src/app/admin/notifications/page.tsx) has a
-- fully-built compose form and "Recent Broadcasts" list, but the list is a
-- hardcoded 3-entry array and the submit handler just alert()s
-- "coming soon" — nothing is ever actually sent or logged. This table records
-- what was sent; NotificationService.notify() (single-recipient) gets fanned
-- out to the target audience by the API route, one row per broadcast here.
CREATE TABLE public.notification_broadcasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  audience TEXT NOT NULL CHECK (audience IN ('all', 'students', 'riders')),
  recipient_count INTEGER NOT NULL DEFAULT 0,
  sent_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.notification_broadcasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notification_broadcasts_admin_all"
  ON public.notification_broadcasts FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin')
  );

-- ===== 020_notification_preferences.sql =====
-- settings/page.tsx's Push/Email/SMS notification toggles only flip local
-- component state — nothing is persisted, so preferences silently reset on
-- every reload and never actually gate anything. Storing them directly on
-- profiles rather than a separate table since it's a single small JSON blob
-- per user with no independent lifecycle.
ALTER TABLE public.profiles
  ADD COLUMN notification_preferences JSONB NOT NULL DEFAULT '{"push": true, "email": true, "sms": false}';

-- ===== 021_reviews_admin_policies.sql =====
-- reviews_select only ever allowed is_hidden = false, and there was no
-- UPDATE policy on reviews at all. Combined with the admin reviews route's
-- other bugs (nonexistent "status" column/FK names, fixed in application
-- code separately), this meant an admin could never even see hidden
-- reviews to moderate them, let alone toggle is_hidden — the whole
-- moderation feature was inert at the RLS layer regardless of the app code.
CREATE POLICY "reviews_select_admin_all"
  ON public.reviews FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "reviews_update_admin"
  ON public.reviews FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin')
  );

-- ===== 022_rider_verification_default.sql =====
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

-- ===== 023_deliveries_flow.sql =====
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

-- ===== 024_order_delivery_link.sql =====
-- Connect EDWOM orders to the rider delivery system. When an order is paid,
-- a delivery is created (seller -> buyer) and a rider is dispatched; this
-- column links that delivery back to its order so the order-tracking page can
-- show the assigned rider and so the delivery's progress can be mirrored onto
-- the order's status. Nullable: standalone "send a package" deliveries have no
-- order.
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS order_id uuid REFERENCES public.orders(id);
CREATE INDEX IF NOT EXISTS deliveries_order_id_idx ON public.deliveries(order_id);

-- ===== 025_transactions_payout_type.sql =====
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

-- ===== 026_broadcast_ride_requests.sql =====
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

-- ===== 027_review_aggregation.sql =====
-- Reviews could be created (from the orders page) but nothing aggregated them,
-- so products.rating / products.total_reviews / profiles.rating stayed 0
-- forever. This trigger recomputes those whenever a review changes.

CREATE OR REPLACE FUNCTION public.recompute_review_aggregates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_product uuid := COALESCE(NEW.reference_id, OLD.reference_id);
  target_profile uuid := COALESCE(NEW.reviewed_id, OLD.reviewed_id);
  target_type text := COALESCE(NEW.type, OLD.type);
BEGIN
  -- Product star rating + count (product-type, non-hidden reviews only).
  IF target_type = 'product' AND target_product IS NOT NULL THEN
    UPDATE public.products p SET
      rating = COALESCE((
        SELECT ROUND(AVG(r.rating)::numeric, 2) FROM public.reviews r
        WHERE r.type = 'product' AND r.reference_id = target_product AND r.is_hidden = false
      ), 0),
      total_reviews = (
        SELECT COUNT(*) FROM public.reviews r
        WHERE r.type = 'product' AND r.reference_id = target_product AND r.is_hidden = false
      )
    WHERE p.id = target_product;
  END IF;

  -- The reviewed person's overall rating (sellers, riders, task workers).
  IF target_profile IS NOT NULL THEN
    UPDATE public.profiles pr SET
      rating = COALESCE((
        SELECT ROUND(AVG(r.rating)::numeric, 2) FROM public.reviews r
        WHERE r.reviewed_id = target_profile AND r.is_hidden = false
      ), 0)
    WHERE pr.id = target_profile;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS reviews_aggregate_trigger ON public.reviews;
CREATE TRIGGER reviews_aggregate_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.recompute_review_aggregates();

-- Backfill existing data.
UPDATE public.products p SET
  rating = COALESCE((SELECT ROUND(AVG(r.rating)::numeric, 2) FROM public.reviews r WHERE r.type='product' AND r.reference_id = p.id AND r.is_hidden = false), 0),
  total_reviews = (SELECT COUNT(*) FROM public.reviews r WHERE r.type='product' AND r.reference_id = p.id AND r.is_hidden = false);

UPDATE public.profiles pr SET
  rating = COALESCE((SELECT ROUND(AVG(r.rating)::numeric, 2) FROM public.reviews r WHERE r.reviewed_id = pr.id AND r.is_hidden = false), 0)
WHERE EXISTS (SELECT 1 FROM public.reviews r WHERE r.reviewed_id = pr.id);

-- ===== 028_deliveries_status_en_route.sql =====
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

-- ===== 029_wallet_payment.sql =====
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

-- ===== 030_secure_rider_profiles_select.sql =====
-- rider_profiles_select was `USING (true)`, so any request using the anon-key
-- client (any logged-in user, or an unauthenticated route that forgot to gate
-- itself — see /api/rides/online-count) could read every rider's live GPS
-- coordinates, verification status, and vehicle info. Restrict reads to:
-- the rider's own row, a passenger/sender with an active ride or delivery
-- assigned to that rider, and admins. Aggregate views (e.g. "N riders
-- online") must go through createAdminClient(), which bypasses RLS by design.
DROP POLICY IF EXISTS "rider_profiles_select" ON public.rider_profiles;

CREATE POLICY "rider_profiles_select" ON public.rider_profiles FOR SELECT USING (
  get_profile_id() = user_id
  OR EXISTS (
    SELECT 1 FROM public.rides
    WHERE rides.rider_id = rider_profiles.user_id
      AND rides.passenger_id = get_profile_id()
      AND rides.status NOT IN ('completed', 'cancelled')
  )
  OR EXISTS (
    SELECT 1 FROM public.deliveries
    WHERE deliveries.rider_id = rider_profiles.user_id
      AND deliveries.sender_id = get_profile_id()
      AND deliveries.status NOT IN ('completed', 'cancelled')
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
  )
);

-- ===== 031_fix_transactions_insert_rls.sql =====
-- CRITICAL: `transactions` has had RLS enabled (migration 009) with only a
-- SELECT policy since the table was created — no INSERT policy has ever
-- existed. Every payment path (PaymentService.initializePayment,
-- settleConfirmedPayment used by dev-mode and wallet payments) inserts into
-- `transactions` using the RLS-bound anon-key client, and that insert has
-- been silently rejected by Postgres RLS the entire time (the app code never
-- checks the insert's error). For real Paystack payments specifically, this
-- is catastrophic: no pending transaction row ever gets created, so the
-- webhook's idempotency guard (`UPDATE transactions ... WHERE reference = X
-- AND status != 'success'`) finds zero matching rows, treats every genuine
-- first-time delivery as a duplicate, and skips ALL fulfillment — order
-- confirmation, stock decrement, delivery dispatch, notifications, task
-- escrow, ride payment marking, and wallet top-up credit. A user could pay
-- real money via Paystack and their order/task/ride would never be marked
-- paid. Confirmed empirically against a local Supabase instance: an
-- authenticated user's insert attempt returned "new row violates row-level
-- security policy for table transactions" before this migration.
CREATE POLICY "transactions_insert" ON public.transactions
  FOR INSERT WITH CHECK (get_profile_id() = user_id);

-- ===== 032_trigram_search_indexes.sql =====
-- product.repository.ts and task.repository.ts search with a leading-wildcard
-- ilike ('%term%'), which can't use a standard btree index. products already
-- has a GIN index (products_search_idx), but it's built on to_tsvector(...) —
-- that only accelerates full-text `@@` queries, not ilike, so it does nothing
-- for the actual search queries the app runs. pg_trgm is installed
-- (migration 001) but no gin_trgm_ops index has ever been created — this is
-- the specific index type that DOES accelerate ilike '%...%' substring
-- matching. Fine at current data volumes; this is what keeps it fine as
-- products/tasks grow into the tens of thousands of rows.
CREATE INDEX products_title_trgm_idx ON public.products USING gin (title gin_trgm_ops);
CREATE INDEX products_description_trgm_idx ON public.products USING gin (description gin_trgm_ops);
CREATE INDEX tasks_title_trgm_idx ON public.tasks USING gin (title gin_trgm_ops);
CREATE INDEX tasks_description_trgm_idx ON public.tasks USING gin (description gin_trgm_ops);

-- ===== 033_fix_rpc_privilege_escalation.sql =====
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

-- ===== 034_fix_missing_with_check_policies.sql =====
-- CRITICAL: 8 of the 9 `FOR ALL` RLS policies in this schema were written
-- with only a USING clause and no explicit WITH CHECK. Contrary to what
-- migration comments elsewhere in this codebase assumed ("USING serves as
-- WITH CHECK too when omitted"), that assumption does not hold in practice
-- for these policies — confirmed empirically against a local Supabase
-- instance: platform_settings_admin_write (USING-only, admin-gated) let a
-- plain `student`-role authenticated user overwrite platform_settings
-- (maintenance mode, auto-assign-riders, etc.) via a direct REST call,
-- completely bypassing the admin-only app UI/API. wishlists_own is the one
-- policy in the schema that already had an explicit WITH CHECK matching its
-- USING clause, and behaves correctly — that's the reference pattern this
-- migration applies to the other 8.
--
-- Affected: admin_logs, fcm_tokens, notification_broadcasts, notifications,
-- platform_settings, products ("Admins can manage products"), promotions,
-- refunds. Each WITH CHECK below is copied verbatim from that policy's own
-- existing USING clause — same authorization rule, just actually enforced
-- on writes now, not only on read/target-row visibility.
ALTER POLICY "admin_logs_admin_all" ON public.admin_logs
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin')
  );

ALTER POLICY "fcm_tokens_all" ON public.fcm_tokens
  WITH CHECK (get_profile_id() = profile_id);

ALTER POLICY "notification_broadcasts_admin_all" ON public.notification_broadcasts
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin')
  );

ALTER POLICY "notifications_all" ON public.notifications
  WITH CHECK (get_profile_id() = user_id);

ALTER POLICY "platform_settings_admin_write" ON public.platform_settings
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin')
  );

ALTER POLICY "Admins can manage products" ON public.products
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin')
  );

ALTER POLICY "promotions_admin_all" ON public.promotions
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin')
  );

ALTER POLICY "refunds_admin_all" ON public.refunds
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin')
  );

-- ===== 035_enable_missing_rls.sql =====
-- CRITICAL: 6 tables were CREATEd without ever calling `ALTER TABLE ...
-- ENABLE ROW LEVEL SECURITY` in any migration — `categories` is the 7th and
-- is intentionally left alone (public reference data by design). Any
-- policies that already existed for these tables (admin_logs_admin_all,
-- refunds_admin_all, platform_settings_*) were completely inert the entire
-- time; RLS enforcement itself was never switched on, so those policies
-- never actually restricted anything. Confirmed empirically against a local
-- Supabase instance: migration 017's own comment claims "platform_settings
-- has RLS enabled with zero policies" — that premise was false from the
-- start (migration 001, which creates the table, never enables RLS on it).
--
-- Practical impact of the two most severe: `audit_logs` (old/new data dumps
-- of every sensitive row change across the whole app, plus actor_id and
-- ip_address) and `admin_logs` (the admin action audit trail) were both
-- fully readable AND writable/forgeable by any authenticated (or anon,
-- depending on table grants) request directly against Supabase's REST API,
-- bypassing the app UI/API entirely — a serious information-disclosure and
-- audit-integrity gap. `refunds` (financial records) and `platform_settings`
-- (maintenance mode, auto-assign-riders, etc.) had the same exposure.
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- audit_logs never had a policy defined at all (on top of RLS never being
-- enabled) — the audit_log_trigger() function that writes to it is
-- SECURITY DEFINER, so it's unaffected by RLS; only reads need a policy.
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_logs_admin_select" ON public.audit_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin')
);

-- Lower severity (presence/typing booleans, not damaging if briefly
-- over-exposed) but fixed for completeness while already here. Presence and
-- typing status are meant to be visible broadly (any authenticated user can
-- see who's online / typing in a shared room), just not writable on
-- someone else's behalf.
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_presence_select" ON public.user_presence FOR SELECT TO authenticated USING (true);
CREATE POLICY "user_presence_own_write" ON public.user_presence FOR ALL
  USING (get_profile_id() = profile_id) WITH CHECK (get_profile_id() = profile_id);

ALTER TABLE public.typing_indicators ENABLE ROW LEVEL SECURITY;
CREATE POLICY "typing_indicators_select" ON public.typing_indicators FOR SELECT TO authenticated USING (true);
CREATE POLICY "typing_indicators_own_write" ON public.typing_indicators FOR ALL
  USING (get_profile_id() = profile_id) WITH CHECK (get_profile_id() = profile_id);

