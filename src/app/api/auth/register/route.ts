import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { handleApiError } from "@/lib/errors/app-error";
import { rateLimit } from "@/lib/middleware/rate-limit";
import { passwordSchema } from "@/lib/validators/auth";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  password: passwordSchema,
  fullName: z.string().min(1),
  phone: z.string().optional(),
  role: z.enum(["student", "rider"]),
  studentId: z.string().optional(),
  department: z.string().optional(),
  hallOfResidence: z.string().optional(),
});

// Same rationale as /api/auth/login: signUp() previously called Supabase's
// auth API directly from the browser, so nothing in this app could
// rate-limit repeated registration attempts (account-creation spam, or
// probing which emails already exist via the resulting error messages).
export async function POST(request: NextRequest) {
  try {
    const body = schema.parse(await request.json());

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
    await rateLimit(`${ip}:${body.email.toLowerCase()}`, "auth");

    const supabase = await createClient();
    const { error } = await supabase.auth.signUp({
      email: body.email,
      password: body.password,
      options: {
        data: {
          full_name: body.fullName,
          phone: body.phone,
          role: body.role,
          student_id: body.studentId,
          department: body.department,
          hall_of_residence: body.hallOfResidence,
        },
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
