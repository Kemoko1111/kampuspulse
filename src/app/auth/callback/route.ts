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
      try {
        const regData = JSON.parse(decodeURIComponent(regDataCookie.value));

        await supabase.from("profiles").update({
          full_name: regData.full_name || sessionData.user.user_metadata?.full_name,
          role: regData.role,
          phone: regData.phone,
          student_id: regData.student_id,
          department: regData.department,
          hall_of_residence: regData.hall_of_residence,
          status: regData.role === "student" ? "active" : "pending",
        } as never).eq("user_id", sessionData.user.id);

        response.cookies.delete("kampuspulse_reg_data");
      } catch (e) {
        console.error("Failed to parse registration cookie", e);
      }
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
