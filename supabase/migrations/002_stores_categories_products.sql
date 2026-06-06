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
