#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/.env.local"

echo "============================================"
echo " CampusPulse — Supabase Setup Helper"
echo "============================================"
echo ""

if [[ ! -f "$ENV_FILE" ]]; then
  cp "$ROOT/.env.local.example" "$ENV_FILE"
  echo "Created .env.local from example."
fi

if grep -q "placeholder" "$ENV_FILE" 2>/dev/null; then
  echo "STEP A — Create a Supabase project"
  echo "  1. Go to https://supabase.com/dashboard"
  echo "  2. New Project → name: campuspulse → choose region → set DB password"
  echo "  3. Wait for project to finish provisioning (~2 min)"
  echo ""
  echo "STEP B — Copy API keys into .env.local"
  echo "  Project Settings → API:"
  echo "    NEXT_PUBLIC_SUPABASE_URL        = Project URL"
  echo "    NEXT_PUBLIC_SUPABASE_ANON_KEY   = anon public key"
  echo "    SUPABASE_SERVICE_ROLE_KEY       = service_role key (keep secret)"
  echo ""
  echo "STEP C — Run database schema"
  echo "  SQL Editor → New query → paste contents of:"
  echo "    $ROOT/supabase/full_setup.sql"
  echo "  Click Run (takes ~10 seconds)"
  echo ""
  echo "STEP D — Configure Auth (Authentication → URL Configuration)"
  echo "  Site URL:              http://localhost:3000"
  echo "  Redirect URLs:         http://localhost:3000/auth/callback"
  echo ""
  echo "STEP E — Enable Realtime (Database → Replication)"
  echo "  Enable realtime for: orders, rides, tasks, task_applications,"
  echo "                       messages, notifications, chat_rooms"
  echo ""
  echo "STEP F — Verify storage buckets (Storage)"
  echo "  Should see: avatars, product-images, store-banners,"
  echo "              rider-documents, task-attachments"
  echo ""
  echo "After completing A–F, re-run: ./scripts/supabase-setup.sh verify"
  exit 0
fi

echo "Verifying Supabase connection..."
URL=$(grep NEXT_PUBLIC_SUPABASE_URL "$ENV_FILE" | cut -d= -f2-)
ANON=$(grep NEXT_PUBLIC_SUPABASE_ANON_KEY "$ENV_FILE" | cut -d= -f2-)

if [[ -z "$URL" || -z "$ANON" ]]; then
  echo "ERROR: Missing Supabase URL or anon key in .env.local"
  exit 1
fi

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "apikey: $ANON" \
  -H "Authorization: Bearer $ANON" \
  "$URL/rest/v1/profiles?select=id&limit=1" 2>/dev/null || echo "000")

if [[ "$HTTP_CODE" == "200" ]]; then
  echo "✓ Connected to Supabase — profiles table exists"
  echo ""
  echo "Next: sign up at http://localhost:3000/register"
  echo "Then promote yourself to admin in SQL Editor:"
  echo "  UPDATE profiles SET role = 'admin' WHERE user_id = '<your-auth-user-id>';"
elif [[ "$HTTP_CODE" == "404" || "$HTTP_CODE" == "406" ]]; then
  echo "✓ Connected to Supabase but profiles table not found."
  echo "  Run supabase/full_setup.sql in the SQL Editor first."
else
  echo "✗ Connection failed (HTTP $HTTP_CODE). Check your .env.local credentials."
  exit 1
fi
