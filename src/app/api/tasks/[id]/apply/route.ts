import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/errors/app-error";
import { requireProfile } from "@/lib/middleware/auth";
import { validateCsrf } from "@/lib/middleware/csrf";
import { applyTaskSchema } from "@/lib/validators/task";
import { TaskService } from "@/lib/services/task.service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await validateCsrf(request);
    const { id } = await params;
    const { supabase, profile } = await requireProfile();
    const body = applyTaskSchema.parse(await request.json());

    const service = new TaskService(supabase);
    const data = await service.apply(id, profile.id, body.coverMessage, body.proposedPrice);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
