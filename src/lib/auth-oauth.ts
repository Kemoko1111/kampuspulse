import type { SupabaseClient } from "@supabase/supabase-js";

export function getOAuthCallbackUrl(next = "/home"): string {
  const base =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const path = next.startsWith("/") && !next.startsWith("//") ? next : "/home";
  return `${base}/auth/callback?next=${encodeURIComponent(path)}`;
}

export async function signInWithGoogle(
  supabase: SupabaseClient<any, "public", any>,
  next = "/home"
): Promise<{ error: string | null }> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: getOAuthCallbackUrl(next),
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (!data?.url) {
    return {
      error:
        "Could not start Google sign-in. Enable Google under Supabase → Authentication → Providers.",
    };
  }

  window.location.assign(data.url);
  return { error: null };
}
