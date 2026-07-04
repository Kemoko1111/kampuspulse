import type { TypedSupabaseClient } from "@/lib/supabase/types";

export function getOAuthCallbackUrl(next = "/home"): string {
  const base =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const path = next.startsWith("/") && !next.startsWith("//") ? next : "/home";
  return `${base}/auth/callback?next=${encodeURIComponent(path)}`;
}

export async function signInWithGoogle(
  supabase: TypedSupabaseClient,
  next = "/home"
): Promise<{ error: string | null }> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: getOAuthCallbackUrl(next),
      // Without this, Google silently re-authenticates with whichever Google
      // account is already active in the browser instead of showing the
      // account chooser — so "sign in with a different account" silently
      // logged back into whatever account was last used on that device.
      queryParams: { prompt: "select_account" },
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
