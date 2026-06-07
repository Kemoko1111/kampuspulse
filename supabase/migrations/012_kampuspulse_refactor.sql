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
