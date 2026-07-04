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
