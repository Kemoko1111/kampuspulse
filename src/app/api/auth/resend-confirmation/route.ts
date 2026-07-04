import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { handleApiError } from "@/lib/errors/app-error";
import { rateLimit } from "@/lib/middleware/rate-limit";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
});

// Same rationale as the other /api/auth/* routes — resending the signup
// confirmation email previously called Supabase directly from the browser
// (login/page.tsx), so nothing could rate-limit repeated resend requests.
export async function POST(request: NextRequest) {
  try {
    const { email } = schema.parse(await request.json());

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
    await rateLimit(`${ip}:${email.toLowerCase()}`, "auth");

    const supabase = await createClient();
    const { error } = await supabase.auth.resend({ type: "signup", email });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
