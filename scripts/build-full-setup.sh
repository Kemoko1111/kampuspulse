#!/usr/bin/env bash
# Regenerates supabase/full_setup.sql by concatenating supabase/migrations/*.sql
# in order. This file is the single source of truth for a fresh Supabase
# project setup — it is GENERATED, never hand-edited, so it can no longer
# drift from what actually built production (see PROJECT_AUDIT.md, C7).
#
# Run this after adding a new migration file.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/supabase/full_setup.sql"

{
  echo "-- GENERATED FILE — do not hand-edit."
  echo "-- Produced by scripts/build-full-setup.sh, which concatenates"
  echo "-- supabase/migrations/*.sql in order. Run this in the Supabase SQL"
  echo "-- editor for a brand-new project. To update it after adding a new"
  echo "-- migration, re-run: ./scripts/build-full-setup.sh"
  echo ""
  for f in "$ROOT"/supabase/migrations/*.sql; do
    echo "-- ===== $(basename "$f") ====="
    cat "$f"
    echo ""
  done
} > "$OUT"

echo "Wrote $(wc -l < "$OUT" | tr -d ' ') lines to ${OUT#"$ROOT"/}"
