import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/errors/app-error";
import { requireRole } from "@/lib/middleware/auth";

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
      .from("profiles")
      .select(`
        *,
        rider_profiles(*)
      `, { count: "exact" })
      .eq("role", "rider")
      .order("created_at", { ascending: false });

    if (status) query = query.eq("status", status);
    if (search) query = query.ilike("full_name", `%${search}%`);
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ data, count, page, limit });
  } catch (error) {
    return handleApiError(error);
  }
}
