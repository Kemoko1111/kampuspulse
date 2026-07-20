import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// Fixed local-dev values that `supabase start` always prints — not secrets
// (every local Supabase CLI install uses these same demo JWTs), safe to
// default to here. Override via env vars for a non-default local setup.
const SUPABASE_URL = process.env.INTEGRATION_SUPABASE_URL || "http://127.0.0.1:54321";
const ANON_KEY =
  process.env.INTEGRATION_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
const SERVICE_ROLE_KEY =
  process.env.INTEGRATION_SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

export const adminClient: SupabaseClient<Database> = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export interface TestUser {
  userId: string;
  profileId: string;
  email: string;
  client: SupabaseClient<Database>;
}

/** Creates a real, confirmed auth user + signs in, returning an RLS-bound client — the same shape the app's own API routes get from requireProfile(). */
export async function createTestUser(overrides: { role?: string; status?: string } = {}): Promise<TestUser> {
  // crypto.randomUUID(), not Date.now()+a per-process counter — test files
  // run in separate worker processes, so a counter isn't actually shared,
  // and two workers creating a user in the same millisecond collided on the
  // email uniqueness constraint (surfaced as GoTrue's generic "Database
  // error creating new user").
  const email = `integration-test-${crypto.randomUUID()}@example.com`;
  const password = "test-password-12345";

  const { data: signUpData, error: signUpError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (signUpError || !signUpData.user) throw new Error(`Failed to create test user: ${signUpError?.message}`);
  const userId = signUpData.user.id;

  // handle_new_user's trigger creates the profiles row; wait for it, then
  // apply any role/status overrides the test needs (as the service role,
  // bypassing RLS — this is setup, not the thing under test).
  let profileId: string | null = null;
  for (let attempt = 0; attempt < 20 && !profileId; attempt++) {
    const { data } = await adminClient.from("profiles").select("id").eq("user_id", userId).maybeSingle();
    if (data) profileId = data.id;
    else await new Promise((r) => setTimeout(r, 100));
  }
  if (!profileId) throw new Error("Test profile was never created by handle_new_user trigger");

  if (overrides.role || overrides.status) {
    await adminClient
      .from("profiles")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ role: overrides.role, status: overrides.status } as any)
      .eq("id", profileId);
  }

  const client = createClient<Database>(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error: signInError } = await client.auth.signInWithPassword({ email, password });
  if (signInError) throw new Error(`Failed to sign in test user: ${signInError.message}`);

  return { userId, profileId, email, client };
}

export async function deleteTestUser(userId: string) {
  await adminClient.auth.admin.deleteUser(userId).catch(() => {});
}
