import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/errors/app-error";
import { requireProfile } from "@/lib/middleware/auth";
import { validateCsrf } from "@/lib/middleware/csrf";
import { rejectApplicationSchema } from "@/lib/validators/task";
import { TaskService } from "@/lib/services/task.service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await validateCsrf(request);
    const { id } = await params;
    const { supabase, profile } = await requireProfile();
    const body = rejectApplicationSchema.parse(await request.json());

    const service = new TaskService(supabase);
    const data = await service.rejectApplication(id, profile.id, body.applicationId);
    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}
