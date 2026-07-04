import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { handleApiError } from "@/lib/errors/app-error";
import { rateLimit } from "@/lib/middleware/rate-limit";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
});

// Same rationale as /api/auth/login — requesting a reset email previously
// called Supabase directly from the browser, so nothing could rate-limit
// repeated requests (spam-emailing a target, or probing which addresses
// are registered via response-timing/behavior differences).
export async function POST(request: NextRequest) {
  try {
    const { email } = schema.parse(await request.json());

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
    await rateLimit(`${ip}:${email.toLowerCase()}`, "auth");

    const supabase = await createClient();
    // The redirect base must come from a trusted server-side value, never a
    // client-supplied "origin" — that would hand an attacker a way to point
    // the reset-link redirect at an arbitrary domain of their choosing.
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    // See auth-context.tsx / middleware.ts for what ?recovery=1 does.
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${baseUrl}/auth/callback?next=${encodeURIComponent("/reset-password?recovery=1")}`,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
