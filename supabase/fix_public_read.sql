-- Allow public read access to categories and stores (needed for marketplace browse/sell)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories_public_read" ON public.categories FOR SELECT USING (true);
CREATE POLICY "stores_public_read" ON public.stores FOR SELECT USING (is_active = true);
