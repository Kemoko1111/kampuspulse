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
    const role = searchParams.get("role");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const offset = (page - 1) * limit;

    let query = supabase
      .from("profiles")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (role) query = query.eq("role", role);
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

export async function PATCH(request: NextRequest) {
  try {
    await validateCsrf(request);
    const { supabase, profile } = await requireRole(["admin"]);
    const body = await request.json();

    const statusMap: Record<string, string> = {
      approve: "active",
      suspend: "suspended",
      ban: "banned",
      activate: "active",
    };

    const newStatus = statusMap[body.action];
    if (!newStatus) return NextResponse.json({ error: "Invalid action" }, { status: 400 });

    const { data, error } = await supabase
      .from("profiles")
      .update({ status: newStatus } as never)
      .eq("id", body.userId)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await supabase.from("admin_logs").insert({
      admin_id: profile.id,
      action: body.action,
      resource_type: "profile",
      resource_id: body.userId,
      new_data: { status: newStatus },
    } as never);

    await supabase.from("notifications").insert({
      user_id: body.userId,
      type: "system",
      title: body.action === "approve" ? "Account Approved!" : "Account Status Updated",
      body: body.action === "approve"
        ? "Your account has been approved."
        : `Your account status has been updated to: ${newStatus}.`,
    } as never);

    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}
