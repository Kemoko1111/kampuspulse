-- ============================================================
-- FIX: handle_new_user trigger (Version 2)
-- Run this in Supabase SQL Editor to fix "Database error creating new user"
-- ============================================================

-- 1. Drop the existing trigger and function completely
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Recreate the function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_profile_id UUID;
BEGIN
  -- Insert into profiles and get the new profile UUID
  INSERT INTO public.profiles (
    user_id, 
    full_name, 
    role, 
    status, 
    phone, 
    student_id, 
    department, 
    hall_of_residence
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    'active',
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'student_id',
    NEW.raw_user_meta_data->>'department',
    NEW.raw_user_meta_data->>'hall_of_residence'
  )
  RETURNING id INTO v_profile_id;

  -- Insert into wallets using the new profile UUID
  INSERT INTO public.wallets (user_id)
  VALUES (v_profile_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Re-attach the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
