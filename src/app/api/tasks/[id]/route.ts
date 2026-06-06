import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { handleApiError, AppError } from "@/lib/errors/app-error";
import { requireProfile } from "@/lib/middleware/auth";
import { validateCsrf } from "@/lib/middleware/csrf";
import { updateTaskSchema } from "@/lib/validators/task";
import { TaskRepository } from "@/lib/repositories/task.repository";
import { TaskService } from "@/lib/services/task.service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const repo = new TaskRepository(supabase);
    const { data, error } = await repo.findById(id);
    if (error || !data) throw new AppError("Task not found", 404);
    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await validateCsrf(request);
    const { id } = await params;
    const { supabase, profile } = await requireProfile();
    const body = updateTaskSchema.parse(await request.json());
    const service = new TaskService(supabase);

    if (body.status) {
      const data = await service.updateStatus(id, profile.id, body.status);
      return NextResponse.json({ data });
    }

    const { data: rawTask } = await supabase.from("tasks").select("poster_id").eq("id", id).single();
    const task = rawTask as { poster_id: string } | null;
    if (!task || task.poster_id !== profile.id) throw new AppError("Forbidden", 403);

    const repo = new TaskRepository(supabase);
    const { data, error } = await repo.update(id, body);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await validateCsrf(request);
    const { id } = await params;
    const { supabase, profile } = await requireProfile();

    const { data: rawTask } = await supabase.from("tasks").select("poster_id").eq("id", id).single();
    const task = rawTask as { poster_id: string } | null;
    if (!task || task.poster_id !== profile.id) throw new AppError("Forbidden", 403);

    const repo = new TaskRepository(supabase);
    const { error } = await repo.softDelete(id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
