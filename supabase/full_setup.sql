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
  role              TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student','rider','admin')),
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
-- 002: Stores, categories, products


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
  type                  TEXT NOT NULL CHECK (type IN ('product','task_worker','rider','delivery')),
  reference_id          UUID NOT NULL,
  rating                INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment               TEXT,
  is_verified_purchase  BOOLEAN DEFAULT FALSE,
  is_hidden             BOOLEAN DEFAULT FALSE,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX transactions_user_idx ON public.transactions(user_id);
CREATE INDEX transactions_reference_idx ON public.transactions(reference);
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
-- 009: Row Level Security policies
CREATE OR REPLACE FUNCTION public.get_profile_id()
RETURNS UUID AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

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
CREATE POLICY "products_select" ON public.products FOR SELECT USING (status = 'active' AND deleted_at IS NULL);
CREATE POLICY "products_insert" ON public.products FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);
CREATE POLICY "products_update" ON public.products FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);
CREATE POLICY "products_delete" ON public.products FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
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
-- 011: Storage buckets and policies
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg','image/png','image/webp']),
  ('product-images', 'product-images', true, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/gif']),
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



CREATE POLICY "rider_docs_upload" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'rider-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "rider_docs_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'rider-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "task_attachments_upload" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'task-attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "task_attachments_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'task-attachments' AND auth.uid() IS NOT NULL);
