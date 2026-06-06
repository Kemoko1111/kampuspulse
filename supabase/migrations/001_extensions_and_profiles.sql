-- 001: Extensions and profiles
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

CREATE TABLE public.profiles (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name         TEXT,
  avatar_url        TEXT,
  bio               TEXT,
  phone             TEXT,
  location          TEXT,
  hall_of_residence TEXT,
  department        TEXT,
  year_of_study     INT CHECK (year_of_study BETWEEN 1 AND 6),
  student_id        TEXT,
  role              TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student','vendor','rider','admin')),
  status            TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','pending','banned')),
  is_verified       BOOLEAN DEFAULT FALSE,
  rating            NUMERIC(3,2) DEFAULT 0.0,
  total_reviews     INT DEFAULT 0,
  deleted_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX profiles_user_id_idx ON public.profiles(user_id);
CREATE INDEX profiles_role_idx ON public.profiles(role);
CREATE INDEX profiles_deleted_at_idx ON public.profiles(deleted_at) WHERE deleted_at IS NULL;

CREATE TABLE public.platform_settings (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.platform_settings (key, value) VALUES
  ('ride_fare', '{"base_fare": 5, "per_km_rate": 2.5, "per_min_rate": 0.5}'),
  ('delivery_fare', '{"base_fare": 8, "per_km_rate": 3, "per_min_rate": 0.75}');
