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
