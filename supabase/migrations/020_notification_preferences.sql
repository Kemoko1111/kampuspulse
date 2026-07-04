-- settings/page.tsx's Push/Email/SMS notification toggles only flip local
-- component state — nothing is persisted, so preferences silently reset on
-- every reload and never actually gate anything. Storing them directly on
-- profiles rather than a separate table since it's a single small JSON blob
-- per user with no independent lifecycle.
ALTER TABLE public.profiles
  ADD COLUMN notification_preferences JSONB NOT NULL DEFAULT '{"push": true, "email": true, "sms": false}';
