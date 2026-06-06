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
