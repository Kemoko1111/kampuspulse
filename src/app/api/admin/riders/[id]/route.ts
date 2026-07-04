import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/errors/app-error";
import { requireRole } from "@/lib/middleware/auth";
import { validateCsrf } from "@/lib/middleware/csrf";
import { z } from "zod";

const schema = z.object({
  status: z.enum(["active", "suspended", "pending", "banned"]).optional(),
  // Admin verify/unverify toggle. is_verified gates whether a rider is
  // matchable (RideRepository.findAvailableRiders); riders default to
  // verified now, so this is the admin's revoke/restore switch.
  is_verified: z.boolean().optional(),
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
    const { count: completedOrders } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("rider_id", id)
      .eq("status", "delivered");

    return NextResponse.json({
      data: {
        ...(profile as object || {}),
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

    if (body.is_verified !== undefined) {
      // rider_profiles keys on user_id (= the profile id in this URL), not its
      // own PK — the previous code updated .eq("id", id) against a nonexistent
      // "current_status" column, so it matched zero rows and did nothing.
      await supabase
        .from("rider_profiles")
        .update({ is_verified: body.is_verified } as never)
        .eq("user_id", id);
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
