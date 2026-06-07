-- ============================================================
-- KampusPulse – Complete PostgreSQL / Supabase Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for full-text search

-- ============================================================
-- USERS & PROFILES
-- ============================================================

CREATE TABLE public.profiles (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name     TEXT,
  avatar_url    TEXT,
  bio           TEXT,
  phone         TEXT,
  location      TEXT,
  hall_of_residence TEXT,
  department    TEXT,
  year_of_study INT CHECK (year_of_study BETWEEN 1 AND 6),
  student_id    TEXT,
  role          TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student','rider','admin')),
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','pending','banned')),
  is_verified   BOOLEAN DEFAULT FALSE,
  rating        NUMERIC(3,2) DEFAULT 0.0,
  total_reviews INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);



-- ============================================================
-- CATEGORIES
-- ============================================================

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

-- ============================================================
-- PRODUCTS
-- ============================================================

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
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX products_seller_idx ON public.products(seller_id);
CREATE INDEX products_category_idx ON public.products(category_id);
CREATE INDEX products_status_idx ON public.products(status);
CREATE INDEX products_search_idx ON public.products USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- ============================================================
-- ORDERS
-- ============================================================

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

-- ============================================================
-- TASKS (Y3 ADWUMA)
-- ============================================================

CREATE TABLE public.tasks (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poster_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  assignee_id   UUID REFERENCES public.profiles(id),
  title         TEXT NOT NULL,
  description   TEXT NOT NULL,
  category      TEXT NOT NULL CHECK (category IN ('academic','delivery','printing','food','laundry','tech','design','event','other')),
  reward        NUMERIC(10,2) NOT NULL CHECK (reward >= 5),
  deadline      TIMESTAMPTZ NOT NULL,
  location      TEXT,
  status        TEXT NOT NULL DEFAULT 'open'
                CHECK (status IN ('open','assigned','in_progress','completed','cancelled','disputed')),
  images        TEXT[] DEFAULT '{}',
  is_urgent     BOOLEAN DEFAULT FALSE,
  total_applicants INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
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

-- ============================================================
-- RIDES & DELIVERIES (EZZYRIDE)
-- ============================================================

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
  rating                NUMERIC(3,2),
  notes                 TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.deliveries (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id             UUID REFERENCES public.profiles(id) NOT NULL,
  rider_id              UUID REFERENCES public.profiles(id),
  delivery_type         TEXT NOT NULL CHECK (delivery_type IN ('food','package','marketplace','document','student_to_student')),
  pickup_address        TEXT NOT NULL,
  delivery_address      TEXT NOT NULL,
  package_description   TEXT,
  package_size          TEXT DEFAULT 'small' CHECK (package_size IN ('small','medium','large')),
  estimated_fee         NUMERIC(10,2),
  actual_fee            NUMERIC(10,2),
  status                TEXT NOT NULL DEFAULT 'searching',
  tracking_code         TEXT UNIQUE,
  payment_method        TEXT,
  payment_status        TEXT DEFAULT 'pending',
  special_instructions  TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.rider_profiles (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  vehicle_type    TEXT NOT NULL CHECK (vehicle_type IN ('bicycle','motorbike','car')),
  vehicle_number  TEXT,
  license_number  TEXT,
  is_verified     BOOLEAN DEFAULT FALSE,
  is_available    BOOLEAN DEFAULT FALSE,
  current_lat     NUMERIC(10,6),
  current_lng     NUMERIC(10,6),
  rating          NUMERIC(3,2) DEFAULT 0.0,
  total_trips     INT DEFAULT 0,
  total_deliveries INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CHAT
-- ============================================================

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
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX messages_room_idx ON public.messages(room_id, created_at DESC);

-- ============================================================
-- REVIEWS
-- ============================================================

CREATE TABLE public.reviews (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reviewer_id           UUID REFERENCES public.profiles(id) NOT NULL,
  reviewed_id           UUID REFERENCES public.profiles(id) NOT NULL,
  type                  TEXT NOT NULL CHECK (type IN ('product','task_worker','rider','delivery')),
  reference_id          UUID NOT NULL,
  rating                INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment               TEXT,
  is_verified_purchase  BOOLEAN DEFAULT FALSE,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PAYMENTS & WALLETS
-- ============================================================

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

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

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

-- ============================================================
-- ADMIN LOGS
-- ============================================================

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

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Profiles: anyone can read, only owner can update
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Products: public read, admin can CRUD
CREATE POLICY "Products are viewable by everyone"
  ON public.products FOR SELECT USING (status = 'active');

CREATE POLICY "Admins can manage products"
  ON public.products FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Orders: buyer and seller can view their own orders
CREATE POLICY "Users can view their orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Tasks: public read
CREATE POLICY "Tasks are publicly visible"
  ON public.tasks FOR SELECT USING (true);

CREATE POLICY "Posters can manage their tasks"
  ON public.tasks FOR ALL USING (auth.uid() = poster_id);

-- Messages: only participants
CREATE POLICY "Chat participants can see messages"
  ON public.messages FOR SELECT
  USING (auth.uid() = ANY(
    SELECT unnest(participants) FROM public.chat_rooms WHERE id = room_id
  ));

-- Notifications: only the recipient
CREATE POLICY "Users see own notifications"
  ON public.notifications FOR ALL USING (auth.uid() = user_id);

-- Wallets: owner only
CREATE POLICY "Users can view own wallet"
  ON public.wallets FOR SELECT USING (auth.uid() = user_id);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');

  INSERT INTO public.wallets (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Update task applicant count
CREATE OR REPLACE FUNCTION public.update_task_applicant_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.tasks
  SET total_applicants = (SELECT COUNT(*) FROM public.task_applications WHERE task_id = NEW.task_id)
  WHERE id = NEW.task_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_task_application
  AFTER INSERT OR DELETE ON public.task_applications
  FOR EACH ROW EXECUTE PROCEDURE public.update_task_applicant_count();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
CREATE TRIGGER set_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
CREATE TRIGGER set_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
CREATE TRIGGER set_rides_updated_at BEFORE UPDATE ON public.rides FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
