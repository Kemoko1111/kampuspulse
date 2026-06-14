import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/errors/app-error";
import { requireRole } from "@/lib/middleware/auth";
import { validateCsrf } from "@/lib/middleware/csrf";
import { z } from "zod";

const schema = z.object({
  status: z.enum(["active", "suspended", "pending", "banned"]).optional(),
  rider_status: z.enum(["online", "offline", "busy"]).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { supabase } = await requireRole(["admin"]);

    const { data: profile, error } = await supabase
      .from("profiles")
      .select(`
        *,
        rider_profiles(*)
      `)
      .eq("id", id)
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    
    // Fetch rider stats
    const [{ count: completedOrders }] = await Promise.all([
      supabase.from("orders").select("*", { count: "exact", head: true }).eq("rider_id", id).eq("status", "delivered")
    ]);

    return NextResponse.json({ 
      data: {
        ...(profile as any || {}),
        stats: {
          completedOrders: completedOrders || 0,
        }
      }
    });
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
    const { supabase, profile } = await requireRole(["admin"]);
    const body = schema.parse(await request.json());

    if (body.status) {
      await supabase.from("profiles").update({ status: body.status } as never).eq("id", id);
    }
    
    if (body.rider_status) {
      await supabase.from("rider_profiles").update({ current_status: body.rider_status } as never).eq("id", id);
    }

    await supabase.from("admin_logs").insert({
      admin_id: profile.id,
      action: "update_rider",
      resource_type: "profile",
      resource_id: id,
      new_data: body,
    } as never);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
