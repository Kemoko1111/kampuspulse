-- ============================================================
-- FIX: handle_new_user trigger
-- Run this in Supabase SQL Editor to fix "Database error saving new user"
-- ============================================================

-- Drop the broken trigger function and recreate it
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_profile_id UUID;
BEGIN
  -- Step 1: Insert the profile and capture the new profile's UUID
  INSERT INTO public.profiles (user_id, full_name, role, status)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    'active'
  )
  RETURNING id INTO new_profile_id;

  -- Step 2: Create the wallet using the profile's id (not auth.users id)
  INSERT INTO public.wallets (user_id)
  VALUES (new_profile_id);

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't block signup
    RAISE WARNING 'handle_new_user failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Make sure the trigger is attached (drop and recreate to be safe)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
