#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV="$ROOT/.env.local"

echo "KampusPulse integration status"
echo "=============================="

check() {
  local name="$1"
  local var="$2"
  local val
  val=$(grep "^${var}=" "$ENV" 2>/dev/null | cut -d= -f2- || true)
  if [[ -z "$val" || "$val" == *"placeholder"* || "$val" == *"your_"* ]]; then
    echo "○ $name — not configured ($var)"
  else
    echo "✓ $name — configured"
  fi
}

if [[ ! -f "$ENV" ]]; then
  echo "Missing .env.local — copy from .env.local.example"
  exit 1
fi

check "Supabase" "NEXT_PUBLIC_SUPABASE_URL"
check "Paystack" "PAYSTACK_SECRET_KEY"
if grep -q "placeholder" <<< "$(grep PAYSTACK_SECRET_KEY "$ENV" | cut -d= -f2-)" 2>/dev/null; then
  echo "  → Dev payments ON (checkout works without Paystack)"
fi
check "Google Maps" "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"
check "Firebase" "NEXT_PUBLIC_FIREBASE_API_KEY"
check "Upstash Redis" "UPSTASH_REDIS_REST_URL"

echo ""
echo "Next steps:"
echo "  1. Run supabase/fix_all_rls.sql in Supabase SQL Editor (if not done)"
echo "  2. Smoke test: sell → cart → checkout → post task → book ride"
echo "  3. Optional later: Paystack, Firebase push, Google Maps"
