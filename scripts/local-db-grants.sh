#!/usr/bin/env bash
# LOCAL DEV / CI ONLY — never a product migration.
#
# `supabase start`'s first-time container init applies Supabase's standard
# baseline role grants (anon/authenticated/service_role get table + function
# access on the public schema; the real access control is meant to happen
# via RLS policies and explicit REVOKEs, not table-level GRANTs). A real
# hosted Supabase project gets this automatically as part of project
# provisioning. But `supabase db reset` only drops/recreates the `postgres`
# database and replays supabase/migrations/*.sql — it does NOT re-run that
# one-time container init, so a reset local instance ends up with literally
# no default table privileges for ANY role, including service_role.
# Confirmed empirically: this is a CLI/Docker quirk of this local setup, not
# something to "fix" in a migration (a real Supabase project already has it).
#
# Run this once after `supabase db reset` before running integration tests
# locally or in CI against a fresh local instance.
set -euo pipefail

docker exec supabase_db_kampuspulse psql -U postgres -d postgres -q -c "
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
" > /dev/null

echo "Applied local-dev baseline table grants."
