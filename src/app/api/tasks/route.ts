import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { handleApiError } from "@/lib/errors/app-error";
import { rateLimit } from "@/lib/middleware/rate-limit";
import { requireProfile } from "@/lib/middleware/auth";
import { validateCsrf } from "@/lib/middleware/csrf";
import { sanitizeObject } from "@/lib/middleware/sanitize";
import { createTaskSchema } from "@/lib/validators/task";
import { TaskRepository } from "@/lib/repositories/task.repository";

export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "anonymous";
    await rateLimit(ip);

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || undefined;
    const search = searchParams.get("search") || undefined;
    const urgent = searchParams.get("urgent") === "true";
    const limit = parseInt(searchParams.get("limit") || "20");
    const page = parseInt(searchParams.get("page") || "1");
    const offset = (page - 1) * limit;

    const supabase = await (await import("@/lib/supabase/server")).createClient();
    const repo = new TaskRepository(supabase);
    const { data, error, count } = await repo.findMany({ category, search, urgent, limit, offset });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data, count, page, limit });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await validateCsrf(request);
    const { profile } = await requireProfile();
    const body = sanitizeObject(
      createTaskSchema.parse(await request.json()),
      ["title", "description", "location"]
    );

    const admin = createAdminClient();
    const repo = new TaskRepository(admin);
    const { data, error } = await repo.create({
      poster_id: profile.id,
      title: body.title,
      description: body.description,
      category: body.category,
      reward: body.reward,
      deadline: body.deadline,
      location: body.location || null,
      is_urgent: body.isUrgent,
      images: body.images,
      status: "open",
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
