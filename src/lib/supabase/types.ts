import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// The third generic pins the schema shape. Passing "public" alone (letting it
// default) fails to unify with what @supabase/ssr's createClient<Database>()
// actually returns at every call site (see api/cart/route.ts etc.) — the
// inferred schema-shape object isn't assignable to the literal "public" type
// this generic expects. any is the deliberate escape hatch here (confirmed by
// testing: removing it produces type errors across every page using
// createClient() — this is a real @supabase/supabase-js@2.45 inference gap,
// not laziness).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TypedSupabaseClient = SupabaseClient<Database, "public", any>;
