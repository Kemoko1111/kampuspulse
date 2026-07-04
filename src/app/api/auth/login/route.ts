import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { handleApiError } from "@/lib/errors/app-error";
import { rateLimit } from "@/lib/middleware/rate-limit";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Login previously called supabase.auth.signInWithPassword() directly from
// the browser client, which goes straight to Supabase's auth server —
// nothing in this app's own request path, so nothing here could ever
// rate-limit it. Proxying through this route is what makes that possible:
// unlimited password-guessing was otherwise available against /login.
export async function POST(request: NextRequest) {
  try {
    const { email, password } = schema.parse(await request.json());

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
    // Keyed by ip+email, not ip alone: a shared/campus IP shouldn't get one
    // attacker's attempts against account A blocking everyone else's real
    // logins, but repeated attempts against the same target account (from
    // any IP an attacker rotates through) still isn't the primary defense
    // here — this is a first layer, not a substitute for Supabase's own.
    await rateLimit(`${ip}:${email.toLowerCase()}`, "auth");

    const cookieStore = await cookies();
    let response = NextResponse.json({ success: true });

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
            response = NextResponse.json({ success: true });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
            );
          },
        },
      }
    );

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
