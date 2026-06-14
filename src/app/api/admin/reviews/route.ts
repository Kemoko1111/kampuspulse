import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/errors/app-error";
import { requireRole } from "@/lib/middleware/auth";
import { validateCsrf } from "@/lib/middleware/csrf";

export async function GET(request: NextRequest) {
  try {
    const { supabase } = await requireRole(["admin"]);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const offset = (page - 1) * limit;

    let query = supabase
      .from("reviews")
      .select(`
        *,
        user:profiles!reviews_user_id_fkey(full_name),
        product:products!reviews_product_id_fkey(title)
      `, { count: "exact" })
      .order("created_at", { ascending: false });

    if (status) query = query.eq("status", status);
    if (search) query = query.ilike("comment", `%${search}%`);
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ data, count, page, limit });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await validateCsrf(request);
    const { supabase, profile } = await requireRole(["admin"]);
    const body = await request.json();

    const { error } = await supabase
      .from("reviews")
      .update({ status: body.action } as never)
      .eq("id", body.reviewId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await supabase.from("admin_logs").insert({
      admin_id: profile.id,
      action: body.action === "hidden" ? "hide_review" : "approve_review",
      resource_type: "review",
      resource_id: body.reviewId,
    } as never);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
