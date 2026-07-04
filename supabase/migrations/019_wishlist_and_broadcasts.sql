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
