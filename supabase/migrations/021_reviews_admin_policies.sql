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
