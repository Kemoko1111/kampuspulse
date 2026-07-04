import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/errors/app-error";
import { requireRole } from "@/lib/middleware/auth";

export async function DELETE() {
  try {
    const { supabase } = await requireRole(["admin"]);
    const { error } = await supabase
      .from("admin_logs")
      .delete()
      .not("id", "is", null); // delete matches every row; Supabase requires an explicit filter

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
