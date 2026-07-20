import { NextRequest, NextResponse } from "next/server";
import { requireProfile } from "@/lib/middleware/auth";
import { handleApiError } from "@/lib/errors/app-error";

export async function GET() {
  try {
    const { supabase, profile } = await requireProfile();

    // wallets.user_id stores the PROFILE id, not the auth user id — querying by
    // user.id here always returned null, so the balance always showed GHS 0.
    const { data: wallet } = await supabase
      .from("wallets")
      .select("balance, currency")
      .eq("user_id", profile.id)
      .maybeSingle();

    return NextResponse.json({ data: { ...(profile as object), wallet } });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { supabase, user } = await requireProfile();

    const body = await request.json();
    const allowedFields = [
      "full_name", "bio", "phone", "location",
      "hall_of_residence", "department", "year_of_study",
      "avatar_url", "student_id", "notification_preferences",
    ];

    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) updates[field] = body[field];
    }

    const { data, error } = await supabase
      .from("profiles")
      .update({ ...updates, updated_at: new Date().toISOString() } as never)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}
