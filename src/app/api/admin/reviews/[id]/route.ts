import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/errors/app-error";
import { requireRole } from "@/lib/middleware/auth";
import { validateCsrf } from "@/lib/middleware/csrf";
import { z } from "zod";

const schema = z.object({ isHidden: z.boolean() });

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await validateCsrf(request);
    const { id } = await params;
    const { supabase, profile } = await requireRole(["admin"]);
    const body = schema.parse(await request.json());

    const { data, error } = await supabase
      .from("reviews")
      .update({ is_hidden: body.isHidden } as never)
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await supabase.from("admin_logs").insert({
      admin_id: profile.id,
      action: "moderate_review",
      resource_type: "review",
      resource_id: id,
      new_data: data,
    } as never);

    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}
