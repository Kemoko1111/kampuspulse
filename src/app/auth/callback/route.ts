import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function safeNextPath(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/home";
  return next;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  if (code) {
    const cookieStore = await cookies();
    let response = NextResponse.redirect(`${origin}${next}`);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
            cookiesToSet.forEach(({ name, value }) => cookieStore.set(name, value));
            response = NextResponse.redirect(`${origin}${next}`);
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
            );
          },
        },
      }
    );

    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !sessionData?.user) {
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(error?.message || "Google sign-in failed")}`
      );
    }

    const regDataCookie = cookieStore.get("kampuspulse_reg_data");
    if (regDataCookie) {
      // This cookie is set (register/page.tsx) before redirecting to Google and
      // is only meant to finish profile setup for that exact signup. It's
      // client-set, non-httpOnly, and lives for up to an hour — with no other
      // check, it used to get applied to whichever account next completed a
      // Google sign-in in that browser, including a *different, pre-existing*
      // user just logging in (e.g. an abandoned registration attempt, then a
      // normal login on the same device/browser minutes later) — silently
      // overwriting their real name/phone/role/status with stale data from
      // someone else's registration form. Guard: only ever apply it to an
      // auth user created in the last couple minutes, i.e. genuinely
      // completing signup in *this* OAuth round-trip, never a returning user.
      const userAgeMs = Date.now() - new Date(sessionData.user.created_at).getTime();
      const isFreshSignup = userAgeMs >= 0 && userAgeMs < 2 * 60 * 1000;

      if (isFreshSignup) {
        try {
          const regData = JSON.parse(decodeURIComponent(regDataCookie.value));

          // regData comes from a client-set, non-httpOnly cookie — never trust it for
          // privileged fields. Only "student"/"rider" are allowed here; anything else
          // (e.g. a tampered "admin") is discarded in favor of the safe default.
          const allowedRoles = ["student", "rider"];
          const role = allowedRoles.includes(regData.role) ? regData.role : "student";

          await supabase.from("profiles").update({
            full_name: regData.full_name || sessionData.user.user_metadata?.full_name,
            role,
            phone: regData.phone,
            student_id: regData.student_id,
            department: regData.department,
            hall_of_residence: regData.hall_of_residence,
            status: role === "student" ? "active" : "pending",
          } as never).eq("user_id", sessionData.user.id);
        } catch (e) {
          console.error("Failed to parse registration cookie", e);
        }
      }

      // Always clear it after one OAuth round-trip regardless of outcome —
      // it should never be retried against a later, unrelated sign-in.
      response.cookies.delete("kampuspulse_reg_data");
    }

    return response;
  }

  const authError = searchParams.get("error");
  const authErrorDesc = searchParams.get("error_description");

  if (authError || authErrorDesc) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(authErrorDesc || authError || "Authentication failed")}`
    );
  }

  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent(
      "Google sign-in was cancelled or misconfigured. In Supabase → Authentication → URL Configuration, add http://localhost:3000/auth/callback as a redirect URL. In Google Cloud Console, set the redirect URI to https://YOUR_PROJECT.supabase.co/auth/v1/callback (not localhost)."
    )}`
  );
}
