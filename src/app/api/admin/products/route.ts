import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/errors/app-error";
import { requireRole } from "@/lib/middleware/auth";
import { validateCsrf } from "@/lib/middleware/csrf";
import { z } from "zod";

export async function GET(request: NextRequest) {
  try {
    const { supabase } = await requireRole(["admin"]);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");
    const categoryId = searchParams.get("category_id");
    const search = searchParams.get("search");
    const offset = (page - 1) * limit;

    let query = supabase
      .from("products")
      .select(`
        *,
        category:categories(name)
      `, { count: "exact" })
      .order("created_at", { ascending: false });

    if (status) query = query.eq("status", status);
    if (categoryId) query = query.eq("category_id", categoryId);
    if (search) query = query.ilike("title", `%${search}%`);
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ data, count, page, limit });
  } catch (error) {
    return handleApiError(error);
  }
}

const deleteSchema = z.object({
  id: z.string().uuid(),
});

export async function DELETE(request: NextRequest) {
  try {
    await validateCsrf(request);
    const { supabase, profile } = await requireRole(["admin"]);
    
    // We expect the ID in the search params or body
    const body = deleteSchema.parse(await request.json());
    
    const { error } = await supabase.from("products").delete().eq("id", body.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await supabase.from("admin_logs").insert({
      admin_id: profile.id,
      action: "delete_product",
      resource_type: "product",
      resource_id: body.id,
    } as never);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
