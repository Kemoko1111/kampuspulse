import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/errors/app-error";
import { requireRole } from "@/lib/middleware/auth";
import { validateCsrf } from "@/lib/middleware/csrf";
import { z } from "zod";

const schema = z.object({
  status: z.enum(["active", "suspended", "pending", "banned"]).optional(),
  role: z.enum(["student", "vendor", "rider", "admin"]).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await validateCsrf(request);
    const { id } = await params;
    const { supabase, profile } = await requireRole(["admin"]);
    const body = schema.parse(await request.json());

    const { data: oldData } = await supabase.from("profiles").select("*").eq("id", id).single();

    const { data, error } = await supabase.from("profiles").update(body as never).eq("id", id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await supabase.from("admin_logs").insert({
      admin_id: profile.id,
      action: "update_user",
      resource_type: "profile",
      resource_id: id,
      old_data: oldData,
      new_data: data,
    } as never);

    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}
